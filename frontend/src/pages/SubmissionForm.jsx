import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../Auth.jsx";
import {
  Field,
  Notice,
  TagInput,
  errorMessage,
} from "../components/common.jsx";

const MAX_BYTES = 10 * 1024 * 1024;

const EMPTY = {
  title: "",
  abstractText: "",
  department: "",
  categoryId: "",
  academicYearId: "",
  facultyId: "",
  keywords: [],
  technologies: [],
  members: [],
  githubUrl: "",
  authors: "",
  affiliation: "",
  venue: "",
  publicationYear: "",
  doi: "",
  externalUrl: "",
};

export default function SubmissionForm() {
  const { kind, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isProject = kind === "project";
  const editing = !!id;
  const base = isProject
    ? "/api/projects"
    : "/api/research-papers";

  const [lookups, setLookups] = useState(null);
  const [f, setF] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [original, setOriginal] = useState(null);
  const [blocked, setBlocked] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF(EMPTY);
    setFile(null);

    Promise.all([
      api.get("/api/categories"),
      api.get("/api/academic-years"),
      api.get("/api/users/faculty"),
      editing
        ? api.get(`${base}/${id}`)
        : Promise.resolve(null),
    ])
      .then(([categories, years, faculty, d]) => {
        setLookups({ categories, years, faculty });

        if (!d) return;

        if (
          d.submittedBy.id !== user.id ||
          d.status !== "REJECTED"
        ) {
          setBlocked(
            "Only the student who submitted a rejected item can edit and resubmit it."
          );
          return;
        }

        setOriginal(d);

        setF({
          ...EMPTY,
          title: d.title,
          abstractText: d.abstractText,
          department: d.department,
          categoryId: String(
            categories.find((c) => c.name === d.category)?.id ?? ""
          ),
          academicYearId: String(
            years.find((y) => y.name === d.academicYear)?.id ?? ""
          ),
          facultyId: String(d.faculty.id),
          keywords: d.keywords,
          technologies: isProject
            ? d.technologies
            : d.researchAreas,
          members: isProject
            ? d.members
                .filter((m) => m.id !== user.id)
                .map((m) => ({
                  id: m.id,
                  name: m.name,
                }))
            : [],
          githubUrl: d.githubUrl || "",
          authors: d.authors || "",
          affiliation: d.affiliation || "",
          venue: d.venue || "",
          publicationYear: d.publicationYear
            ? String(d.publicationYear)
            : "",
          doi: d.doi || "",
          externalUrl: d.externalUrl || "",
        });
      })
      .catch((e) => setErr(e));
  }, [kind, id]);

  if (kind !== "project" && kind !== "paper") {
    return (
      <div className="container">
        <p>Unknown submission type.</p>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="container narrow">
        <Notice>{blocked}</Notice>
        <p>
          <Link to="/student">
            Back to my submissions
          </Link>
        </p>
      </div>
    );
  }

  if (!lookups) {
    return (
      <div className="container">
        <Notice>
          {err ? errorMessage(err) : ""}
        </Notice>

        {!err && (
          <p className="muted">Loading…</p>
        )}
      </div>
    );
  }

  const set = (k) => (e) =>
    setF((prev) => ({
      ...prev,
      [k]: e.target.value,
    }));

  const setList = (k) => (v) =>
    setF((prev) => ({
      ...prev,
      [k]: v,
    }));

  const fe = err?.fieldErrors || {};

  const pickFile = (e) => {
    const chosen = e.target.files[0] || null;

    if (
      chosen &&
      !chosen.name.toLowerCase().endsWith(".pdf")
    ) {
      setErr({
        message: "Only PDF files are allowed.",
      });
      e.target.value = "";
      return;
    }

    if (chosen && chosen.size > MAX_BYTES) {
      setErr({
        message: "The PDF is larger than 10 MB.",
      });
      e.target.value = "";
      return;
    }

    setErr(null);
    setFile(chosen);
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!editing && !file) {
      setErr({
        message: isProject
          ? "Attach the project report as a PDF."
          : "Attach the paper as a PDF.",
      });
      return;
    }

    const common = {
      title: f.title,
      abstractText: f.abstractText,
      department: f.department,
      categoryId: f.categoryId
        ? Number(f.categoryId)
        : null,
      academicYearId: f.academicYearId
        ? Number(f.academicYearId)
        : null,
      facultyId: f.facultyId
        ? Number(f.facultyId)
        : null,
      keywords: f.keywords,
    };

    const data = isProject
      ? {
          ...common,
          memberIds: f.members.map((m) => m.id),
          technologies: f.technologies,
          githubUrl: f.githubUrl.trim() || null,
        }
      : {
          ...common,
          authors: f.authors,
          affiliation: f.affiliation,
          venue: f.venue,
          publicationYear: f.publicationYear
            ? Number(f.publicationYear)
            : null,
          doi: f.doi,
          externalUrl: f.externalUrl.trim() || null,
          researchAreas: f.technologies,
        };

    const form = new FormData();

    form.append(
      "data",
      new Blob([JSON.stringify(data)], {
        type: "application/json",
      })
    );

    if (file) {
      form.append("report", file);
    }

    setBusy(true);
    setErr(null);

    try {
      if (editing) {
        await api.putForm(`${base}/${id}`, form);
      } else {
        await api.postForm(base, form);
      }

      navigate("/student", {
        state: {
          flash: editing
            ? "Resubmitted. Your reviewer will look at it again."
            : "Submitted. Your faculty reviewer will be notified in their queue.",
        },
      });
    } catch (ex) {
      setErr(ex);
      setBusy(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const noun = isProject
    ? "project"
    : "research paper";

  return (
    <div className="container submission-page">

      {/* HEADER */}
      <section className="submission-header">

        <div>
          <p className="section-eyebrow">
            {editing
              ? "RESUBMISSION"
              : isProject
              ? "CAPSTONE PROJECT"
              : "RESEARCH PAPER"}
          </p>

          <h1 className="page-title">
            {editing
              ? `Edit and resubmit your ${noun}`
              : `Submit a ${noun}`}
          </h1>

          <p className="lead">
            {editing
              ? "Update the requested information and send your work back for review."
              : "Add your academic work to the departmental repository for faculty review."}
          </p>
        </div>

        <div className="submission-step-indicator">
          <span className="submission-step-active">
            01
          </span>
          <span>Information</span>
          <span>02</span>
          <span>Details</span>
          <span>03</span>
          <span>Report</span>
        </div>

      </section>

      {original?.rejectionReason && (
        <div className="submission-rejection">

          <div>
            <span className="repository-label">
              REVIEW FEEDBACK
            </span>

            <strong>
              Changes were requested
            </strong>

            <p>
              {original.rejectionReason}
            </p>
          </div>

        </div>
      )}

      <Notice>
        {err
          ? err.fieldErrors
            ? "Some fields need attention — see the messages below."
            : err.message
          : ""}
      </Notice>

      <form
        onSubmit={submit}
        noValidate
        className="submission-form"
      >

        {/* BASIC INFORMATION */}
        <section className="submission-section">

          <div className="submission-section-heading">
            <span>01</span>

            <div>
              <h2>Basic information</h2>
              <p>
                Tell us about the academic work you are submitting.
              </p>
            </div>
          </div>

          <div className="submission-fields">

            <Field
              id="title"
              label="Title"
              error={fe.title}
            >
              <input
                id="title"
                value={f.title}
                onChange={set("title")}
                maxLength={255}
                placeholder={
                  isProject
                    ? "Enter your project title"
                    : "Enter your research paper title"
                }
              />
            </Field>

            {!isProject && (
              <Field
                id="authors"
                label="Authors"
                hint="Separate names with commas."
                error={fe.authors}
              >
                <input
                  id="authors"
                  value={f.authors}
                  onChange={set("authors")}
                  placeholder="A. Student, B. Student"
                />
              </Field>
            )}

            <Field
              id="abstract"
              label="Abstract"
              hint="At least 30 characters."
              error={fe.abstractText}
            >
              <textarea
                id="abstract"
                rows={7}
                value={f.abstractText}
                onChange={set("abstractText")}
                placeholder="Describe the purpose, approach and main outcome of your work..."
              />
            </Field>

            <div className="two-col">
              <Field
                id="department"
                label="Department"
                error={fe.department}
              >
                <input
                  id="department"
                  value={f.department}
                  onChange={set("department")}
                  placeholder="Your department"
                />
              </Field>

              <Field
                id="category"
                label={
                  isProject
                    ? "Category"
                    : "Research category"
                }
                error={fe.categoryId}
              >
                <select
                  id="category"
                  value={f.categoryId}
                  onChange={set("categoryId")}
                >
                  <option value="">Select…</option>

                  {lookups.categories.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="two-col">
              <Field
                id="year"
                label="Academic year"
                error={fe.academicYearId}
              >
                <select
                  id="year"
                  value={f.academicYearId}
                  onChange={set("academicYearId")}
                >
                  <option value="">Select…</option>

                  {lookups.years.map((y) => (
                    <option
                      key={y.id}
                      value={y.id}
                    >
                      {y.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="faculty"
                label={
                  isProject
                    ? "Faculty guide"
                    : "Faculty reviewer"
                }
                error={fe.facultyId}
              >
                <select
                  id="faculty"
                  value={f.facultyId}
                  onChange={set("facultyId")}
                >
                  <option value="">Select…</option>

                  {lookups.faculty.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

          </div>
        </section>

        {/* DETAILS */}
        <section className="submission-section">

          <div className="submission-section-heading">
            <span>02</span>

            <div>
              <h2>
                {isProject
                  ? "Project details"
                  : "Research details"}
              </h2>

              <p>
                Add searchable information and supporting details.
              </p>
            </div>
          </div>

          <div className="submission-fields">

            <Field
              id="keywords"
              label="Keywords"
              hint="Type a keyword and press Enter."
              error={fe.keywords}
            >
              <TagInput
                id="keywords"
                value={f.keywords}
                onChange={setList("keywords")}
                placeholder="e.g. phishing, machine learning"
              />
            </Field>

            <Field
              id="tech"
              label={
                isProject
                  ? "Technologies used"
                  : "Research areas"
              }
              hint="Press Enter after each one."
              error={
                fe.technologies ||
                fe.researchAreas
              }
            >
              <TagInput
                id="tech"
                value={f.technologies}
                onChange={setList("technologies")}
                placeholder={
                  isProject
                    ? "e.g. Java, React, PostgreSQL"
                    : "e.g. Email security"
                }
              />
            </Field>

            {isProject && (
              <>
                <Field
                  id="members"
                  label="Other team members"
                  hint="Search registered students by name or email."
                >
                  <MemberPicker
                    value={f.members}
                    onChange={setList("members")}
                    selfId={user.id}
                  />
                </Field>

                <Field
                  id="github"
                  label="GitHub or project link"
                  error={fe.githubUrl}
                >
                  <input
                    id="github"
                    type="url"
                    placeholder="https://github.com/username/project"
                    value={f.githubUrl}
                    onChange={set("githubUrl")}
                  />
                </Field>
              </>
            )}

            {!isProject && (
              <>
                <div className="two-col">
                  <Field
                    id="venue"
                    label="Journal or conference"
                    error={fe.venue}
                  >
                    <input
                      id="venue"
                      value={f.venue}
                      onChange={set("venue")}
                    />
                  </Field>

                  <Field
                    id="pubyear"
                    label="Publication year"
                    error={fe.publicationYear}
                  >
                    <input
                      id="pubyear"
                      type="number"
                      min="1900"
                      max="2100"
                      value={f.publicationYear}
                      onChange={set("publicationYear")}
                    />
                  </Field>
                </div>

                <Field
                  id="affiliation"
                  label="Affiliation"
                  error={fe.affiliation}
                >
                  <input
                    id="affiliation"
                    value={f.affiliation}
                    onChange={set("affiliation")}
                  />
                </Field>

                <div className="two-col">
                  <Field
                    id="doi"
                    label="DOI"
                    hint="Optional. Example: 10.1000/example"
                    error={fe.doi}
                  >
                    <input
                      id="doi"
                      value={f.doi}
                      onChange={set("doi")}
                    />
                  </Field>

                  <Field
                    id="exturl"
                    label="Link to the paper"
                    error={fe.externalUrl}
                  >
                    <input
                      id="exturl"
                      type="url"
                      value={f.externalUrl}
                      onChange={set("externalUrl")}
                    />
                  </Field>
                </div>
              </>
            )}

          </div>
        </section>

        {/* REPORT */}
        <section className="submission-section">

          <div className="submission-section-heading">
            <span>03</span>

            <div>
              <h2>Academic document</h2>

              <p>
                Upload the PDF that will be reviewed by your faculty member.
              </p>
            </div>
          </div>

          <div className="submission-upload">

            <Field
              id="report"
              label={
                isProject
                  ? "Project report (PDF)"
                  : "Paper (PDF)"
              }
              hint={
                editing
                  ? "Leave empty to keep the PDF uploaded before. Maximum 10 MB."
                  : "PDF format only. Maximum 10 MB."
              }
            >
              <input
                id="report"
                type="file"
                accept=".pdf,application/pdf"
                onChange={pickFile}
              />
            </Field>

            <div className="upload-note">
              <strong>PDF only</strong>
              <span>Maximum file size: 10 MB</span>
            </div>

          </div>

        </section>

        {/* ACTIONS */}
        <div className="submission-actions">

          <Link
            className="btn quiet"
            to="/student"
          >
            Cancel
          </Link>

          <button
            className="btn primary"
            disabled={busy}
          >
            {busy
              ? "Sending…"
              : editing
              ? "Resubmit for review"
              : `Submit ${noun}`}
          </button>

        </div>

      </form>
    </div>
  );
}

/** Search registered students by name/email and add them as team members. */
function MemberPicker({ value, onChange, selfId }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api
        .get("/api/users/students", {
          q: q.trim(),
        })
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);

    return () => clearTimeout(timer);
  }, [q]);

  const available = results.filter(
    (s) =>
      s.id !== selfId &&
      !value.some((m) => m.id === s.id)
  );

  return (
    <div>

      {value.length > 0 && (
        <div className="chips">
          {value.map((m) => (
            <span className="chip" key={m.id}>
              {m.name}

              <button
                type="button"
                aria-label={`Remove ${m.name}`}
                onClick={() =>
                  onChange(
                    value.filter(
                      (v) => v.id !== m.id
                    )
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        id="members"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Type at least 2 letters"
        autoComplete="off"
      />

      {available.length > 0 && (
        <ul className="picker">
          {available.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange([
                    ...value,
                    {
                      id: s.id,
                      name: s.name,
                    },
                  ]);

                  setQ("");
                  setResults([]);
                }}
              >
                {s.name}

                <span className="muted">
                  {s.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}