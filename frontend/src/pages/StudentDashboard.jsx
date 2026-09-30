import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { Notice, StatusBadge, errorMessage, formatDate, itemPath, typeLabel } from "../components/common.jsx";

export default function StudentDashboard() {
  const location = useLocation();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/api/student/projects"), api.get("/api/student/research-papers")])
      .then(([p, r]) => setItems([...p, ...r].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  return (
    <div className="container">
      <h1 className="page-title">My submissions</h1>
      <Notice kind="success">{location.state?.flash}</Notice>
      <Notice>{error}</Notice>
      <div className="button-row">
        <Link className="btn primary" to="/student/submit/project">Submit a project</Link>
        <Link className="btn quiet" to="/student/submit/paper">Submit a research paper</Link>
      </div>

      {items && items.length === 0 && (
        <p className="empty">You have not submitted anything yet. Start with your capstone project or a research paper.</p>
      )}

      <div className="entries">
        {items?.map((item) => (
          <article className="entry" key={`${item.type}-${item.id}`}>
            <h2><Link to={itemPath(item)}>{item.title}</Link></h2>
            <p className="meta">{typeLabel(item.type)} · {item.category} · Submitted {formatDate(item.submittedAt)}</p>
            <p><StatusBadge status={item.status} /> <span className="muted">Reviewer: {item.facultyName}</span></p>
            {item.status === "REJECTED" && (
              <div className="callout rejected">
                <strong>Reason for rejection</strong>
                <p>{item.rejectionReason}</p>
                <Link className="btn small" to={`/student/edit/${item.type === "PROJECT" ? "project" : "paper"}/${item.id}`}>Edit and resubmit</Link>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
