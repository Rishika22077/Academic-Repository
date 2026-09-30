import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Notice, StatusBadge, errorMessage, formatDate, itemPath, typeLabel } from "../components/common.jsx";

const TABS = [
  { key: "", label: "Awaiting my review", empty: "Nothing is waiting for you right now." },
  { key: "APPROVED", label: "Approved", empty: "You have not approved anything yet." },
  { key: "REJECTED", label: "Rejected", empty: "You have not rejected anything." },
];

export default function FacultyQueue() {
  const [tab, setTab] = useState(TABS[0]);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(null);
    const params = tab.key ? { status: tab.key } : undefined;
    Promise.all([api.get("/api/faculty/projects", params), api.get("/api/faculty/research-papers", params)])
      .then(([p, r]) => setItems([...p, ...r].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))))
      .catch((e) => setError(errorMessage(e)));
  }, [tab]);

  return (
    <div className="container">
      <h1 className="page-title">Review queue</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.label} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t.label}</button>
        ))}
      </div>
      <Notice>{error}</Notice>
      {items && items.length === 0 && <p className="empty">{tab.empty}</p>}
      <div className="entries">
        {items?.map((item) => (
          <article className="entry" key={`${item.type}-${item.id}`}>
            <h2><Link to={itemPath(item)}>{item.title}</Link></h2>
            <p className="meta">{typeLabel(item.type)} · {item.category} · Submitted {formatDate(item.submittedAt)}</p>
            <p><span className="label">By:</span> {item.people.join(", ")}</p>
            <p><StatusBadge status={item.status} /></p>
            <Link className="entry-link" to={itemPath(item)}>{["PENDING", "RESUBMITTED"].includes(item.status) ? "Open to review" : "Open"}</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
