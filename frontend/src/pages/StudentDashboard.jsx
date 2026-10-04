import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api.js";
import {
  Notice,
  StatusBadge,
  errorMessage,
  formatDate,
  itemPath,
  typeLabel,
} from "../components/common.jsx";

export default function StudentDashboard() {
  const location = useLocation();

  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/student/projects"),
      api.get("/api/student/research-papers"),
    ])
      .then(([p, r]) =>
        setItems(
          [...p, ...r].sort((a, b) =>
            b.submittedAt.localeCompare(a.submittedAt)
          )
        )
      )
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const total = items?.length || 0;
  const approved =
    items?.filter((item) => item.status === "APPROVED").length || 0;
  const pending =
    items?.filter(
      (item) =>
        item.status === "PENDING" || item.status === "RESUBMITTED"
    ).length || 0;
  const rejected =
    items?.filter((item) => item.status === "REJECTED").length || 0;

  return (
    <div className="container student-dashboard">

      {/* HEADER */}
      <section className="student-dashboard-header">

        <div>
          <p className="section-eyebrow">STUDENT WORKSPACE</p>

          <h1 className="page-title">My submissions</h1>

          <p className="lead">
            Track your projects and research papers through the
            review process.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link
            className="btn primary"
            to="/student/submit/project"
          >
            + Submit project
          </Link>

          <Link
            className="btn quiet"
            to="/student/submit/paper"
          >
            + Submit research paper
          </Link>
        </div>

      </section>

      <Notice kind="success">
        {location.state?.flash}
      </Notice>

      <Notice>{error}</Notice>

      {/* STATISTICS */}
      <section className="student-stats">

        <div className="student-stat-card">
          <span className="student-stat-number">{total}</span>
          <span className="student-stat-label">TOTAL SUBMISSIONS</span>
        </div>

        <div className="student-stat-card">
          <span className="student-stat-number">{approved}</span>
          <span className="student-stat-label">APPROVED</span>
        </div>

        <div className="student-stat-card">
          <span className="student-stat-number">{pending}</span>
          <span className="student-stat-label">UNDER REVIEW</span>
        </div>

        <div className="student-stat-card">
          <span className="student-stat-number">{rejected}</span>
          <span className="student-stat-label">NEEDS CHANGES</span>
        </div>

      </section>

      {/* SUBMISSIONS */}
      <section className="student-submissions-section">

        <div className="student-section-heading">
          <div>
            <p className="section-eyebrow">ACADEMIC RECORD</p>
            <h2>Your submissions</h2>
          </div>

          {items && items.length > 0 && (
            <span className="student-count">
              {items.length}{" "}
              {items.length === 1 ? "submission" : "submissions"}
            </span>
          )}
        </div>

        {items && items.length === 0 && (
          <div className="student-empty">

            <div className="empty-mark">AR</div>

            <h2>No submissions yet</h2>

            <p>
              You have not submitted anything yet. Start with
              your capstone project or a research paper.
            </p>

            <div className="button-row">
              <Link
                className="btn primary"
                to="/student/submit/project"
              >
                Submit a project
              </Link>

              <Link
                className="btn quiet"
                to="/student/submit/paper"
              >
                Submit a research paper
              </Link>
            </div>

          </div>
        )}

        <div className="student-submissions">

          {items?.map((item) => (
            <article
              className="student-submission"
              key={`${item.type}-${item.id}`}
            >

              <div className="student-submission-main">

                <div className="student-submission-title">

                  <span className="student-item-type">
                    {typeLabel(item.type)}
                  </span>

                  <h3>
                    <Link to={itemPath(item)}>
                      {item.title}
                    </Link>
                  </h3>

                  <p className="student-item-meta">
                    {item.category}
                    <span>•</span>
                    Submitted {formatDate(item.submittedAt)}
                  </p>

                </div>

                <div className="student-submission-reviewer">

                  <span className="repository-label">
                    REVIEWER
                  </span>

                  <p>
                    {item.facultyName || "Not assigned"}
                  </p>

                </div>

                <div className="student-submission-status">

                  <span className="repository-label">
                    STATUS
                  </span>

                  <StatusBadge status={item.status} />

                </div>

                <div className="student-submission-view">

                  <Link
                    className="entry-link"
                    to={itemPath(item)}
                  >
                    View
                    <span>→</span>
                  </Link>

                </div>

              </div>

              {item.status === "REJECTED" && (
                <div className="student-rejection">

                  <div>
                    <strong>Changes requested</strong>

                    <p>
                      {item.rejectionReason}
                    </p>
                  </div>

                  <Link
                    className="btn small"
                    to={`/student/edit/${
                      item.type === "PROJECT"
                        ? "project"
                        : "paper"
                    }/${item.id}`}
                  >
                    Edit & resubmit
                  </Link>

                </div>
              )}

            </article>
          ))}

        </div>

      </section>

    </div>
  );
}