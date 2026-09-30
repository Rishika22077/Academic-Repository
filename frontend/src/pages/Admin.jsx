import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Field, Notice, Pagination, StatusBadge, errorMessage, formatDate, itemPath, typeLabel } from "../components/common.jsx";

const TABS = ["Overview", "Users", "Submissions", "Categories", "Academic years"];

export default function Admin() {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <div className="container">
      <h1 className="page-title">Administration</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === "Overview" && <Overview />}
      {tab === "Users" && <Users />}
      {tab === "Submissions" && <Submissions />}
      {tab === "Categories" && <LookupManager key="cat" title="Categories" path="/api/categories" field="name" example="Networking" />}
      {tab === "Academic years" && <LookupManager key="year" title="Academic years" path="/api/academic-years" field="label" example="2027-28" />}
    </div>
  );
}

// ---------------------------------------------------------------- overview
function Overview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/api/admin/stats").then(setS).catch((e) => setError(errorMessage(e)));
  }, []);
  if (error) return <Notice>{error}</Notice>;
  if (!s) return <p className="muted">Loading…</p>;
  const order = ["PENDING", "RESUBMITTED", "APPROVED", "REJECTED"];
  return (
    <>
      <h2>Accounts</h2>
      <p>{s.students} students, {s.faculty} faculty, {s.admins} administrators.</p>
      <h2>Submissions</h2>
      <table className="table">
        <thead><tr><th></th>{order.map((k) => <th key={k}><StatusBadge status={k} /></th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">Projects</th>{order.map((k) => <td key={k}>{s.projectsByStatus[k]}</td>)}</tr>
          <tr><th scope="row">Research papers</th>{order.map((k) => <td key={k}>{s.papersByStatus[k]}</td>)}</tr>
        </tbody>
      </table>
    </>
  );
}

// ---------------------------------------------------------------- users
function Users() {
  const [filters, setFilters] = useState({ role: "", active: "", q: "" });
  const [qDraft, setQDraft] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .get("/api/admin/users", { ...filters, page, size: 15 })
      .then((d) => { setData(d); setError(""); })
      .catch((e) => setError(errorMessage(e)));
  }, [filters, page]);
  useEffect(load, [load]);

  const act = async (fn, message) => {
    setError(""); setNote("");
    try {
      await fn();
      if (message) setNote(message);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const resetPassword = (u) => {
    const pw = window.prompt(`New password for ${u.name} (at least 8 characters):`);
    if (pw) act(() => api.put(`/api/admin/users/${u.id}/password`, { newPassword: pw }), `Password changed for ${u.name}.`);
  };

  return (
    <>
      <form className="filter-row" onSubmit={(e) => { e.preventDefault(); setPage(0); setFilters((f) => ({ ...f, q: qDraft.trim() })); }}>
        <input aria-label="Search users" placeholder="Search name or email" value={qDraft} onChange={(e) => setQDraft(e.target.value)} />
        <select aria-label="Role" value={filters.role} onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, role: e.target.value })); }}>
          <option value="">Any role</option><option value="STUDENT">Students</option><option value="FACULTY">Faculty</option><option value="ADMIN">Administrators</option>
        </select>
        <select aria-label="Status" value={filters.active} onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, active: e.target.value })); }}>
          <option value="">Active and inactive</option><option value="true">Active</option><option value="false">Deactivated</option>
        </select>
        <button className="btn quiet">Search</button>
        <button type="button" className="btn primary" onClick={() => setCreating((c) => !c)}>{creating ? "Close" : "Add user"}</button>
      </form>

      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>
      {creating && <CreateUser onCreated={() => { setCreating(false); setNote("Account created."); load(); }} />}

      {data && (
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.content.map((u) =>
              editing?.id === u.id ? (
                <tr key={u.id}>
                  <td><input aria-label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></td>
                  <td><input aria-label="Email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></td>
                  <td>{u.role}</td><td></td>
                  <td className="actions">
                    <button className="btn small" onClick={() => act(() => api.put(`/api/admin/users/${u.id}`, { name: editing.name, email: editing.email }).then(() => setEditing(null)), "Saved.")}>Save</button>
                    <button className="btn quiet small" onClick={() => setEditing(null)}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className={u.active ? "" : "inactive"}>
                  <td>{u.name}</td><td>{u.email}</td><td>{u.role.charAt(0) + u.role.slice(1).toLowerCase()}</td>
                  <td>{u.active ? "Active" : "Deactivated"}</td>
                  <td className="actions">
                    <button className="btn quiet small" onClick={() => setEditing({ id: u.id, name: u.name, email: u.email })}>Edit</button>
                    <button className="btn quiet small" onClick={() => resetPassword(u)}>Reset password</button>
                    {u.active
                      ? <button className="btn quiet small" onClick={() => act(() => api.put(`/api/admin/users/${u.id}/deactivate`), `${u.name} was deactivated.`)}>Deactivate</button>
                      : <button className="btn quiet small" onClick={() => act(() => api.put(`/api/admin/users/${u.id}/activate`), `${u.name} was reactivated.`)}>Activate</button>}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
      {data && data.content.length === 0 && <p className="empty">No accounts match these filters.</p>}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </>
  );
}

function CreateUser({ onCreated }) {
  const [f, setF] = useState({ name: "", email: "", password: "", role: "FACULTY" });
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const fe = err?.fieldErrors || {};

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/api/admin/users", f);
      onCreated();
    } catch (ex) {
      setErr(ex);
    }
  };

  return (
    <form className="panel form" onSubmit={submit} noValidate>
      <Notice>{err && !err.fieldErrors ? err.message : ""}</Notice>
      <div className="two-col">
        <Field id="cu-name" label="Full name" error={fe.name}><input id="cu-name" value={f.name} onChange={set("name")} /></Field>
        <Field id="cu-email" label="Email" error={fe.email}><input id="cu-email" type="email" value={f.email} onChange={set("email")} /></Field>
      </div>
      <div className="two-col">
        <Field id="cu-pw" label="Initial password" hint="At least 8 characters. Share it with the user." error={fe.password}>
          <input id="cu-pw" type="text" value={f.password} onChange={set("password")} />
        </Field>
        <Field id="cu-role" label="Role" error={fe.role}>
          <select id="cu-role" value={f.role} onChange={set("role")}>
            <option value="FACULTY">Faculty</option><option value="STUDENT">Student</option><option value="ADMIN">Administrator</option>
          </select>
        </Field>
      </div>
      <button className="btn primary">Create account</button>
    </form>
  );
}

// ---------------------------------------------------------------- all submissions
function Submissions() {
  const [kind, setKind] = useState("projects");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(null);
    api
      .get(kind === "projects" ? "/api/admin/projects" : "/api/admin/research-papers", { status })
      .then(setItems)
      .catch((e) => setError(errorMessage(e)));
  }, [kind, status]);

  return (
    <>
      <div className="filter-row">
        <select aria-label="Type" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="projects">Projects</option><option value="papers">Research papers</option>
        </select>
        <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option><option value="PENDING">Awaiting review</option><option value="RESUBMITTED">Resubmitted</option>
          <option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
        </select>
      </div>
      <Notice>{error}</Notice>
      {items && items.length === 0 && <p className="empty">No submissions with this status.</p>}
      {items && items.length > 0 && (
        <table className="table">
          <thead><tr><th>Title</th><th>Reviewer</th><th>Status</th><th>Submitted</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={`${i.type}-${i.id}`}>
                <td><Link to={itemPath(i)}>{i.title}</Link><div className="muted small-text">{typeLabel(i.type)} · {i.category}</div></td>
                <td>{i.facultyName}</td><td><StatusBadge status={i.status} /></td><td>{formatDate(i.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small-text">Open an item to approve, reject or delete it — for example when a reviewer is unavailable.</p>
    </>
  );
}

// ---------------------------------------------------------------- categories / academic years
function LookupManager({ title, path, field, example }) {
  const [items, setItems] = useState(null);
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get(path).then(setItems).catch((e) => setError(errorMessage(e)));
  }, [path]);
  useEffect(load, [load]);

  const act = async (fn) => {
    setError("");
    try {
      await fn();
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <h2>{title}</h2>
      <Notice>{error}</Notice>
      <form className="filter-row" onSubmit={(e) => { e.preventDefault(); act(async () => { await api.post(path, { [field]: value }); setValue(""); }); }}>
        <input aria-label={`New entry`} placeholder={`e.g. ${example}`} value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn primary" disabled={!value.trim()}>Add</button>
      </form>
      {items && (
        <table className="table">
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>
                  {editing?.id === it.id
                    ? <input aria-label="Name" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} />
                    : it.name}
                </td>
                <td className="actions">
                  {editing?.id === it.id ? (
                    <>
                      <button className="btn small" onClick={() => act(async () => { await api.put(`${path}/${it.id}`, { [field]: editing.value }); setEditing(null); })}>Save</button>
                      <button className="btn quiet small" onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn quiet small" onClick={() => setEditing({ id: it.id, value: it.name })}>Rename</button>
                      <button className="btn quiet small" onClick={() => window.confirm(`Delete "${it.name}"?`) && act(() => api.del(`${path}/${it.id}`))}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small-text">An entry that existing submissions use cannot be deleted; rename it instead.</p>
    </>
  );
}
