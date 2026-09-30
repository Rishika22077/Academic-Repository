import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { Notice, Pagination, errorMessage, itemPath, typeLabel } from "../components/common.jsx";

const TYPES = [
  { value: "ALL", label: "All" },
  { value: "PROJECTS", label: "Projects" },
  { value: "PAPERS", label: "Research papers" },
];

export default function Repository() {
  const [sp, setSp] = useSearchParams();
  const type = sp.get("type") || "ALL";
  const q = sp.get("q") || "";
  const categoryId = sp.get("categoryId") || "";
  const academicYearId = sp.get("academicYearId") || "";
  const technology = sp.get("technology") || "";
  const facultyId = sp.get("facultyId") || "";
  const page = Number(sp.get("page") || 0);

  const [draft, setDraft] = useState(q);
  const [opts, setOpts] = useState({ categories: [], years: [], faculty: [], tech: [] });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter dropdowns come from the database - nothing is hard-coded here.
  useEffect(() => {
    Promise.all([
      api.get("/api/categories"),
      api.get("/api/academic-years"),
      api.get("/api/users/faculty"),
      api.get("/api/tags", { type: "TECHNOLOGY" }),
    ])
      .then(([categories, years, faculty, tech]) => setOpts({ categories, years, faculty, tech }))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/api/repository/search", { type, q, categoryId, academicYearId, technology, facultyId, page, size: 10 })
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          setError("");
        }
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [type, q, categoryId, academicYearId, technology, facultyId, page]);

  const update = (changes) => {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => (v === "" || v == null ? next.delete(k) : next.set(k, v)));
    if (!("page" in changes)) next.delete("page");
    setSp(next);
  };

  const filtersActive = categoryId || academicYearId || technology || facultyId;

  return (
    <div className="container">
      <h1 className="page-title">Search the repository</h1>
      <p className="lead">Approved capstone projects and research papers from earlier batches.</p>

      <form className="search-panel" onSubmit={(e) => { e.preventDefault(); update({ q: draft.trim() }); }}>
        <div className="search-in" role="group" aria-label="Search in">
          <span>Search in</span>
          {TYPES.map((t) => (
            <button type="button" key={t.value} aria-pressed={type === t.value} onClick={() => update({ type: t.value === "ALL" ? "" : t.value })}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="search-row">
          <input
            type="search"
            aria-label="Search by title, keyword, author"
            placeholder="Search by title, keyword, author…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn primary">Search</button>
        </div>
        <div className="filters">
          <select aria-label="Category" value={categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
            <option value="">Any category</option>
            {opts.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Academic year" value={academicYearId} onChange={(e) => update({ academicYearId: e.target.value })}>
            <option value="">Any year</option>
            {opts.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <select aria-label="Technology or research area" value={technology} onChange={(e) => update({ technology: e.target.value })}>
            <option value="">Any technology / research area</option>
            {opts.tech.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select aria-label="Faculty" value={facultyId} onChange={(e) => update({ facultyId: e.target.value })}>
            <option value="">Any faculty</option>
            {opts.faculty.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {filtersActive && (
            <button type="button" className="btn quiet small" onClick={() => update({ categoryId: "", academicYearId: "", technology: "", facultyId: "" })}>
              Clear filters
            </button>
          )}
        </div>
      </form>

      <Notice>{error}</Notice>

      {result && (
        <p className="result-count" aria-live="polite">
          {loading ? "Searching…" : `${result.totalElements} ${result.totalElements === 1 ? "result" : "results"}`}
        </p>
      )}

      <div className="entries">
        {result?.content.map((item) => <Entry key={`${item.type}-${item.id}`} item={item} />)}
      </div>

      {result && !loading && result.content.length === 0 && (
        <p className="empty">Nothing approved matches this search. Use fewer words, or remove a filter.</p>
      )}

      {result && <Pagination page={result.page} totalPages={result.totalPages} onChange={(p) => update({ page: String(p) })} />}
    </div>
  );
}

function Entry({ item }) {
  const isPaper = item.type === "RESEARCH_PAPER";
  return (
    <article className="entry">
      <h2><Link to={itemPath(item)}>{item.title}</Link></h2>
      <p className="meta">
        {typeLabel(item.type)} · {item.category} · {isPaper && item.publicationYear ? item.publicationYear : item.academicYear}
      </p>
      {item.people.length > 0 && (
        <p><span className="label">{isPaper ? "Authors:" : "Team:"}</span> {item.people.join(", ")}</p>
      )}
      {item.keywords.length > 0 && (
        <p><span className="label">Keywords:</span> {item.keywords.join(" · ")}</p>
      )}
      {!isPaper && item.technologies.length > 0 && (
        <p><span className="label">Built with:</span> {item.technologies.join(" · ")}</p>
      )}
      <p className="preview"><span className="label">Abstract:</span> {item.abstractPreview}</p>
      <Link className="entry-link" to={itemPath(item)}>{isPaper ? "View paper" : "View project"}</Link>
    </article>
  );
}
