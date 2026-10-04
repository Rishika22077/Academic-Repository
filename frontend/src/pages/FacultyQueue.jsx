import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import {
  Notice,
  StatusBadge,
  errorMessage,
  formatDate,
  itemPath,
  typeLabel,
} from "../components/common.jsx";

const TABS = [
  {
    key: "",
    label: "Awaiting review",
    empty: "Nothing is waiting for you right now.",
  },
  {
    key: "APPROVED",
    label: "Approved",
    empty: "You have not approved anything yet.",
  },
  {
    key: "REJECTED",
    label: "Rejected",
    empty: "You have not rejected anything.",
  },
];

export default function FacultyQueue() {
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(null);
    setError("");

    const params = tab.key ? { status: tab.key } : undefined;

    Promise.all([
      api.get("/api/faculty/projects", params),
      api.get("/api/faculty/research-papers", params),
    ])
      .then(([p, r]) =>
        setItems(
          [...p, ...r].sort((a, b) =>
            b.submittedAt.localeCompare(a.submittedAt)
          )
        )
      )
      .catch((e) => setError(errorMessage(e)));
  }, [tab]);

  const pendingCount =
    items?.filter((item) =>
      ["PENDING", "RESUBMITTED"].includes(item.status)
    ).length || 0;

  return (
    <div className="container faculty-page">

      {/* PAGE HEADER */}
      <section className="faculty-header">

        <div>
          <p className="section-eyebrow">FACULTY REVIEW</p>

          <h1 className="page-title">
            Review queue
          </h1>

          <p className="lead">
            Review submitted academic work and manage your department's
            repository entries.
          </p>
        </div>

        <div className="faculty-summary">
          <span className="faculty-summary-label">
            {tab.key === ""
              ? "AWAITING REVIEW"
              : tab.key}
          </span>

          <strong>
            {items ? pendingCount : "—"}
          </strong>

          <span>
            submissions
          </span>
        </div>

      </section>

      {/* TABS */}
      <div className="faculty-tabs" role="tablist">

        {TABS.map((t) => (
          <button
            key={t.label}
            className={tab === t ? "faculty-tab active" : "faculty-tab"}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            <span>{t.label}</span>

            {t.key === "" && items && (
              <span className="faculty-tab-count">
                {pendingCount}
              </span>
            )}
          </button>
        ))}

      </div>

      <Notice>{error}</Notice>

      {/* EMPTY STATE */}
      {items && items.length === 0 && (
        <div className="faculty-empty">

          <div className="faculty-empty-number">
            00
          </div>

          <h2>{tab.empty}</h2>

          <p>
            New student submissions will appear here when they are assigned
            to you for review.
          </p>

        </div>
      )}

      {/* SUBMISSIONS */}
      <div className="faculty-entries">

        {items?.map((item) => {

          const isPending =
            ["PENDING", "RESUBMITTED"].includes(item.status);

          return (
            <article
              className="faculty-entry"
              key={`${item.type}-${item.id}`}
            >

              {/* TOP ROW */}
              <div className="faculty-entry-top">

                <span className="faculty-type">
                  {typeLabel(item.type)}
                </span>

                <StatusBadge status={item.status} />

              </div>

              {/* TITLE */}
              <h2>
                <Link to={itemPath(item)}>
                  {item.title}
                </Link>
              </h2>

              {/* META */}
              <p className="faculty-entry-meta">
                {item.category}
                <span>•</span>
                Submitted {formatDate(item.submittedAt)}
              </p>

              {/* PEOPLE */}
              {item.people?.length > 0 && (
                <div className="faculty-entry-info">

                  <span className="faculty-info-label">
                    SUBMITTED BY
                  </span>

                  <span className="faculty-info-value">
                    {item.people.join(", ")}
                  </span>

                </div>
              )}

              {/* ACTION */}
              <div className="faculty-entry-action">

                <Link
                  className="faculty-open-btn"
                  to={itemPath(item)}
                >
                  {isPending
                    ? "Open for review →"
                    : "View submission →"}
                </Link>

              </div>

            </article>
          );
        })}

      </div>

    </div>
  );
}