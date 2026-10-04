import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import {
  Notice,
  StatusBadge,
  errorMessage,
  formatDate,
  typeLabel,
} from "../components/common.jsx";
import { useAuth } from "../Auth.jsx";

function ReviewPanel({ item, base, onDone }) {
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");

    try {
      if (mode === "approve") {
        await api.put(`${base}/${item.id}/approve`);
      } else {
        if (!reason.trim()) {
          setError("Please provide a reason for rejection.");
          setBusy(false);
          return;
        }

        await api.put(`${base}/${item.id}/reject`, {
          reason: reason.trim(),
        });
      }

      onDone();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <section className="review-panel">
      <div className="review-panel-heading">
        <div>
          <span className="section-eyebrow">FACULTY ACTION</span>
          <h2>Review submission</h2>
        </div>

        <span className="review-panel-note">
          {mode === "approve"
            ? "Ready to approve"
            : mode === "reject"
              ? "Rejection required"
              : "Choose an action"}
        </span>
      </div>

      <Notice>{error}</Notice>

      {!mode && (
        <div className="review-actions">
          <button
            className="review-approve"
            onClick={() => setMode("approve")}
          >
            Approve submission
            <span>→</span>
          </button>

          <button
            className="review-reject"
            onClick={() => setMode("reject")}
          >
            Reject submission
            <span>→</span>
          </button>
        </div>
      )}

      {mode === "approve" && (
        <div className="review-confirm">
          <p>
            Are you sure you want to approve this submission? It will become
            part of the department repository.
          </p>

          <div className="review-confirm-actions">
            <button
              className="review-approve"
              disabled={busy}
              onClick={submit}
            >
              {busy ? "Approving..." : "Confirm approval →"}
            </button>

            <button
              className="review-cancel"
              disabled={busy}
              onClick={() => setMode(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="review-confirm">
          <label htmlFor="rejection-reason">Reason for rejection</label>

          <textarea
            id="rejection-reason"
            rows="5"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain what the student needs to change before resubmitting..."
          />

          <div className="review-confirm-actions">
            <button
              className="review-reject"
              disabled={busy}
              onClick={submit}
            >
              {busy ? "Rejecting..." : "Confirm rejection →"}
            </button>

            <button
              className="review-cancel"
              disabled={busy}
              onClick={() => setMode(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const project = await api.get(`/api/projects/${id}`);
        setItem(project);
      } catch {
        try {
          const paper = await api.get(`/api/research-papers/${id}`);
          setItem(paper);
        } catch (e) {
          setError(errorMessage(e));
        }
      }
    };

    load();
  }, [id]);

  if (error) {
    return (
      <div className="container detail-page">
        <Notice>{error}</Notice>
        <Link className="detail-back" to="/">
          ← Back to repository
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container detail-page">
        <p className="muted">Loading submission...</p>
      </div>
    );
  }

  const isProject =
    item.type === "PROJECT" ||
    item.kind === "PROJECT" ||
    item.projectType === "PROJECT";

  const base = isProject
    ? "/api/projects"
    : "/api/research-papers";

  const isReviewable =
    ["PENDING", "RESUBMITTED"].includes(item.status) &&
    (user?.role === "FACULTY" || user?.role === "ADMIN");

  const isOwner =
    user?.id === item.studentId ||
    user?.id === item.ownerId ||
    user?.email === item.studentEmail;

  const canEdit =
    user?.role === "STUDENT" &&
    isOwner &&
    item.status === "REJECTED";

  const canDelete =
    user?.role === "ADMIN" ||
    (user?.role === "STUDENT" && isOwner && item.status !== "APPROVED");

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this submission?"
    );

    if (!confirmed) return;

    try {
      await api.del(`${base}/${item.id}`);

      if (user?.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const handleReviewDone = () => {
    window.location.reload();
  };

  return (
    <div className="container detail-page">

      {/* BACK */}
      <Link
        className="detail-back"
        to={user?.role === "FACULTY" ? "/faculty" : "/"}
      >
        ← Back
      </Link>

      {/* HEADER */}
      <header className="detail-header">

        <div className="detail-header-main">
          <div className="detail-type-row">
            <span className="detail-type">
              {typeLabel(item.type)}
            </span>

            <span className="detail-dot">•</span>

            <span className="detail-date">
              Submitted {formatDate(item.submittedAt)}
            </span>
          </div>

          <h1>{item.title}</h1>

          <p className="detail-category">
            {item.category}
            {item.academicYear ? ` · ${item.academicYear}` : ""}
          </p>
        </div>

        <div className="detail-status">
          <StatusBadge status={item.status} />
        </div>

      </header>

      {/* REJECTION MESSAGE */}
      {item.status === "REJECTED" && item.rejectionReason && (
        <section className="detail-rejection">
          <div className="detail-rejection-icon">!</div>

          <div>
            <span className="section-eyebrow">REVISION REQUIRED</span>
            <h2>Submission was rejected</h2>
            <p>{item.rejectionReason}</p>

            {canEdit && (
              <Link
                className="detail-primary-btn"
                to={`/student/edit/${isProject ? "project" : "paper"}/${item.id}`}
              >
                Edit and resubmit →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* FACULTY REVIEW */}
      {isReviewable && (
        <ReviewPanel
          item={item}
          base={base}
          onDone={handleReviewDone}
        />
      )}

      {/* MAIN GRID */}
      <div className="detail-grid">

        {/* LEFT */}
        <main className="detail-main">

          <section className="detail-section">
            <div className="detail-section-heading">
              <span className="section-number">01</span>

              <div>
                <span className="section-eyebrow">OVERVIEW</span>
                <h2>Abstract</h2>
              </div>
            </div>

            <p className="detail-abstract">
              {item.abstract || "No abstract provided."}
            </p>
          </section>

          <section className="detail-section">
            <div className="detail-section-heading">
              <span className="section-number">02</span>

              <div>
                <span className="section-eyebrow">PROJECT INFORMATION</span>
                <h2>Submission details</h2>
              </div>
            </div>

            <div className="detail-facts">

              {item.facultyName && (
                <div className="detail-fact">
                  <span>Faculty guide</span>
                  <strong>{item.facultyName}</strong>
                </div>
              )}

              {item.category && (
                <div className="detail-fact">
                  <span>Category</span>
                  <strong>{item.category}</strong>
                </div>
              )}

              {item.academicYear && (
                <div className="detail-fact">
                  <span>Academic year</span>
                  <strong>{item.academicYear}</strong>
                </div>
              )}

              {item.submittedAt && (
                <div className="detail-fact">
                  <span>Submitted</span>
                  <strong>{formatDate(item.submittedAt)}</strong>
                </div>
              )}

            </div>
          </section>

          {item.people && item.people.length > 0 && (
            <section className="detail-section">
              <div className="detail-section-heading">
                <span className="section-number">03</span>

                <div>
                  <span className="section-eyebrow">CONTRIBUTORS</span>
                  <h2>Students / authors</h2>
                </div>
              </div>

              <div className="detail-people">
                {item.people.map((person, index) => (
                  <div className="detail-person" key={index}>
                    <span className="person-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>{person}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="detail-sidebar">

          {/* RESOURCES */}
          <section className="detail-side-card">
            <span className="section-eyebrow">RESOURCES</span>
            <h2>Project files</h2>

            <div className="resource-list">

              {item.reportUrl && (
                <a
                  className="resource-item"
                  href={item.reportUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="resource-icon">PDF</span>

                  <span>
                    <strong>Project report</strong>
                    <small>Open PDF document</small>
                  </span>

                  <span className="resource-arrow">↗</span>
                </a>
              )}

              {item.githubUrl && (
                <a
                  className="resource-item"
                  href={item.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="resource-icon">GH</span>

                  <span>
                    <strong>GitHub repository</strong>
                    <small>View source code</small>
                  </span>

                  <span className="resource-arrow">↗</span>
                </a>
              )}

              {item.externalUrl && (
                <a
                  className="resource-item"
                  href={item.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="resource-icon">↗</span>

                  <span>
                    <strong>Project link</strong>
                    <small>Open external resource</small>
                  </span>

                  <span className="resource-arrow">↗</span>
                </a>
              )}

              {!item.reportUrl &&
                !item.githubUrl &&
                !item.externalUrl && (
                  <p className="muted">No external resources provided.</p>
                )}

            </div>
          </section>

          {/* TECHNOLOGIES */}
          {item.technologies?.length > 0 && (
            <section className="detail-side-card">
              <span className="section-eyebrow">TECH STACK</span>
              <h2>Technologies</h2>

              <div className="tag-list">
                {item.technologies.map((technology, index) => (
                  <span className="detail-tag" key={index}>
                    {technology}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* KEYWORDS */}
          {item.keywords?.length > 0 && (
            <section className="detail-side-card">
              <span className="section-eyebrow">DISCOVERY</span>
              <h2>Keywords</h2>

              <div className="tag-list">
                {item.keywords.map((keyword, index) => (
                  <span className="detail-tag muted-tag" key={index}>
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ACTIONS */}
          {(canDelete || canEdit) && (
            <section className="detail-side-card detail-management">
              <span className="section-eyebrow">MANAGEMENT</span>
              <h2>Submission actions</h2>

              {canEdit && (
                <Link
                  className="management-btn"
                  to={`/student/edit/${isProject ? "project" : "paper"}/${item.id}`}
                >
                  Edit submission
                </Link>
              )}

              {canDelete && (
                <button
                  className="management-delete"
                  onClick={handleDelete}
                >
                  Delete submission
                </button>
              )}
            </section>
          )}

        </aside>
      </div>

      <Notice>{error}</Notice>

    </div>
  );
}