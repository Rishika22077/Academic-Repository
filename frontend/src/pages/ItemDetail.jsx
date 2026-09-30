import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import ReportButtons from "../components/ReportButtons.jsx";
import { Notice, StatusBadge, errorMessage, formatDate } from "../components/common.jsx";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" };

/** One page for both kinds: kind = "project" | "paper". */
export default function ItemDetail({ kind }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isProject = kind === "project";
  const base = isProject ? "/api/projects" : "/api/research-papers";

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setItem(null);
    api.get(`${base}/${id}`).then(setItem).catch((e) => setError(errorMessage(e)));
  }, [base, id]);
  useEffect(load, [load]);

  if (error && !item) return <div className="container narrow"><Notice>{error}</Notice><p><Link to="/">Back to the repository</Link></p></div>;
  if (!item) return <div className="container"><p className="muted">Loading…</p></div>;

  const isOwner = item.submittedBy.id === user.id;
  const canReview =
    ["PENDING", "RESUBMITTED"].includes(item.status) &&
    (user.role === "ADMIN" || (user.role === "FACULTY" && item.faculty.id === user.id));
  const canEdit = user.role === "STUDENT" && isOwner && item.status === "REJECTED";
  const canDelete = user.role === "ADMIN" || (isOwner && item.status !== "APPROVED");

  const remove = async () => {
    if (!window.confirm("Delete this submission and its PDF? This cannot be undone.")) return;
    try {
      await api.del(`${base}/${id}`);
      navigate(user.role === "ADMIN" ? "/admin" : "/student", { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const metaYear = !isProject && item.publicationYear ? item.publicationYear : item.academicYear;

  return (
    <div className="container detail">
      <p className="meta">{isProject ? "Capstone project" : "Research paper"} · {item.category} · {metaYear}</p>
      <h1 className="detail-title">{item.title}</h1>
      {item.status !== "APPROVED" && <p><StatusBadge status={item.status} /></p>}
      <Notice>{error}</Notice>

      {item.status === "REJECTED" && item.rejectionReason && (
        <div className="callout rejected">
          <strong>Reason for rejection</strong>
          <p>{item.rejectionReason}</p>
          {canEdit && <Link className="btn" to={`/student/edit/${kind}/${item.id}`}>Edit and resubmit</Link>}
        </div>
      )}

      {canReview && <ReviewPanel base={base} id={id} onDone={setItem} />}

      <section>
        <h2>Abstract</h2>
        <p className="abstract">{item.abstractText}</p>
      </section>

      <section>
        <h2>Details</h2>
        <dl className="facts">
          {isProject ? (
            <Fact label="Team members">{item.members.map((m) => m.name).join(", ")}</Fact>
          ) : (
            <Fact label="Authors">{item.authors}</Fact>
          )}
          <Fact label={isProject ? "Faculty guide" : "Faculty reviewer"}>{item.faculty.name}</Fact>
          <Fact label="Department">{item.department}</Fact>
          {!isProject && item.affiliation && <Fact label="Affiliation">{item.affiliation}</Fact>}
          {!isProject && item.venue && <Fact label="Published in">{item.venue}{item.publicationYear ? ` (${item.publicationYear})` : ""}</Fact>}
          {!isProject && item.doi && <Fact label="DOI"><a href={item.doiUrl} {...EXTERNAL}>{item.doi}</a></Fact>}
          {(isProject ? item.technologies : item.researchAreas).length > 0 && (
            <Fact label={isProject ? "Technologies used" : "Research areas"}>{(isProject ? item.technologies : item.researchAreas).join(", ")}</Fact>
          )}
          <Fact label="Keywords">{item.keywords.join(" · ")}</Fact>
          <Fact label="Submitted">{formatDate(item.submittedAt)}</Fact>
          {item.approvedAt && <Fact label="Approved on">{formatDate(item.approvedAt)}</Fact>}
        </dl>
      </section>

      <section>
        <h2>{isProject ? "Project report" : "Paper"}</h2>
        <ReportButtons reportUrl={item.reportUrl} filename={item.originalReportName} />
      </section>

      {isProject && item.githubUrl && (
        <section>
          <h2>Project repository</h2>
          <a className="btn quiet" href={item.githubUrl} {...EXTERNAL}>View project repository</a>
        </section>
      )}
      {!isProject && item.externalUrl && (
        <section>
          <h2>Published version</h2>
          <a className="btn quiet" href={item.externalUrl} {...EXTERNAL}>View paper online</a>
        </section>
      )}

      {canDelete && (
        <section>
          <button className="btn danger small" onClick={remove}>Delete submission</button>
        </section>
      )}
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ReviewPanel({ base, id, onDone }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const act = async (path, body) => {
    setBusy(true);
    setError(null);
    try {
      onDone(await api.put(`${base}/${id}/${path}`, body));
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <div className="callout review">
      <strong>Your decision</strong>
      <p>Read the abstract and the report, then approve it for the repository or send it back with a reason.</p>
      <Notice>{error ? errorMessage(error) : ""}</Notice>
      {!rejecting ? (
        <div className="button-row">
          <button className="btn primary" disabled={busy} onClick={() => act("approve")}>Approve</button>
          <button className="btn quiet" disabled={busy} onClick={() => setRejecting(true)}>Reject…</button>
        </div>
      ) : (
        <>
          <label htmlFor="reason">Reason for rejection (the student will see this)</label>
          <textarea id="reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="button-row">
            <button className="btn danger" disabled={busy || !reason.trim()} onClick={() => act("reject", { reason })}>Reject submission</button>
            <button className="btn quiet" disabled={busy} onClick={() => setRejecting(false)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
