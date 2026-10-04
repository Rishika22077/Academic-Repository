import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import {
  Field,
  Notice,
  Pagination,
  StatusBadge,
  errorMessage,
  formatDate,
  itemPath,
  typeLabel,
} from "../components/common.jsx";

const TABS = [
  "Overview",
  "Users",
  "Submissions",
  "Categories",
  "Academic years",
];

export default function Admin() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div className="container admin-page">

      <header className="admin-header">
        <div>
          <span className="section-eyebrow">ADMINISTRATION</span>
          <h1>Department console</h1>
          <p>
            Manage users, submissions and the academic repository from one
            place.
          </p>
        </div>

        <div className="admin-header-mark">
          <span>AR</span>
        </div>
      </header>

      <nav className="admin-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            className={tab === t ? "admin-tab active" : "admin-tab"}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="admin-content">
        {tab === "Overview" && <Overview />}
        {tab === "Users" && <Users />}
        {tab === "Submissions" && <Submissions />}

        {tab === "Categories" && (
          <LookupManager
            key="cat"
            title="Categories"
            path="/api/categories"
            field="name"
            example="Networking"
          />
        )}

        {tab === "Academic years" && (
          <LookupManager
            key="year"
            title="Academic years"
            path="/api/academic-years"
            field="label"
            example="2027-28"
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */

function Overview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/stats")
      .then(setS)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <Notice>{error}</Notice>;

  if (!s) {
    return <p className="muted">Loading dashboard...</p>;
  }

  const order = [
    "PENDING",
    "RESUBMITTED",
    "APPROVED",
    "REJECTED",
  ];

  const totalProjects = order.reduce(
    (sum, key) => sum + (s.projectsByStatus[key] || 0),
    0
  );

  const totalPapers = order.reduce(
    (sum, key) => sum + (s.papersByStatus[key] || 0),
    0
  );

  return (
    <div className="admin-section">

      <div className="admin-section-heading">
        <div>
          <span className="section-eyebrow">OVERVIEW</span>
          <h2>Repository at a glance</h2>
        </div>

        <span className="admin-live">LIVE DATA</span>
      </div>

      {/* ACCOUNT STATS */}

      <div className="admin-stat-grid">

        <div className="admin-stat-card">
          <span>STUDENTS</span>
          <strong>{s.students}</strong>
          <small>Registered accounts</small>
        </div>

        <div className="admin-stat-card">
          <span>FACULTY</span>
          <strong>{s.faculty}</strong>
          <small>Faculty accounts</small>
        </div>

        <div className="admin-stat-card">
          <span>ADMINISTRATORS</span>
          <strong>{s.admins}</strong>
          <small>Admin accounts</small>
        </div>

        <div className="admin-stat-card highlight">
          <span>TOTAL WORK</span>
          <strong>{totalProjects + totalPapers}</strong>
          <small>{totalProjects} projects · {totalPapers} papers</small>
        </div>

      </div>

      {/* SUBMISSION STATUS */}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="section-eyebrow">SUBMISSIONS</span>
            <h3>Repository activity</h3>
          </div>
        </div>

        <div className="admin-status-grid">

          <div className="admin-status-card">
            <span className="status-dot pending"></span>
            <div>
              <strong>
                {(s.projectsByStatus.PENDING || 0) +
                  (s.papersByStatus.PENDING || 0)}
              </strong>
              <small>Awaiting review</small>
            </div>
          </div>

          <div className="admin-status-card">
            <span className="status-dot resubmitted"></span>
            <div>
              <strong>
                {(s.projectsByStatus.RESUBMITTED || 0) +
                  (s.papersByStatus.RESUBMITTED || 0)}
              </strong>
              <small>Resubmitted</small>
            </div>
          </div>

          <div className="admin-status-card">
            <span className="status-dot approved"></span>
            <div>
              <strong>
                {(s.projectsByStatus.APPROVED || 0) +
                  (s.papersByStatus.APPROVED || 0)}
              </strong>
              <small>Approved</small>
            </div>
          </div>

          <div className="admin-status-card">
            <span className="status-dot rejected"></span>
            <div>
              <strong>
                {(s.projectsByStatus.REJECTED || 0) +
                  (s.papersByStatus.REJECTED || 0)}
              </strong>
              <small>Rejected</small>
            </div>
          </div>

        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                {order.map((key) => (
                  <th key={key}>
                    <StatusBadge status={key} />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <th>Projects</th>
                {order.map((key) => (
                  <td key={key}>
                    {s.projectsByStatus[key] || 0}
                  </td>
                ))}
              </tr>

              <tr>
                <th>Research papers</th>
                {order.map((key) => (
                  <td key={key}>
                    {s.papersByStatus[key] || 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

/* =========================================================
   USERS
   ========================================================= */

function Users() {
  const [filters, setFilters] = useState({
    role: "",
    active: "",
    q: "",
  });

  const [qDraft, setQDraft] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .get("/api/admin/users", {
        ...filters,
        page,
        size: 15,
      })
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(errorMessage(e)));
  }, [filters, page]);

  useEffect(load, [load]);

  const act = async (fn, message) => {
    setError("");
    setNote("");

    try {
      await fn();

      if (message) {
        setNote(message);
      }

      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const resetPassword = (u) => {
    const pw = window.prompt(
      `New password for ${u.name} (at least 8 characters):`
    );

    if (pw) {
      act(
        () =>
          api.put(`/api/admin/users/${u.id}/password`, {
            newPassword: pw,
          }),
        `Password changed for ${u.name}.`
      );
    }
  };

  return (
    <div className="admin-section">

      <div className="admin-section-heading">
        <div>
          <span className="section-eyebrow">USER MANAGEMENT</span>
          <h2>Accounts</h2>
        </div>

        <button
          className="admin-primary-btn"
          onClick={() => setCreating((c) => !c)}
        >
          {creating ? "Close" : "+ Add user"}
        </button>
      </div>

      <form
        className="admin-filter-bar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setFilters((f) => ({
            ...f,
            q: qDraft.trim(),
          }));
        }}
      >
        <input
          aria-label="Search users"
          placeholder="Search name or email"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
        />

        <select
          aria-label="Role"
          value={filters.role}
          onChange={(e) => {
            setPage(0);
            setFilters((f) => ({
              ...f,
              role: e.target.value,
            }));
          }}
        >
          <option value="">Any role</option>
          <option value="STUDENT">Students</option>
          <option value="FACULTY">Faculty</option>
          <option value="ADMIN">Administrators</option>
        </select>

        <select
          aria-label="Status"
          value={filters.active}
          onChange={(e) => {
            setPage(0);
            setFilters((f) => ({
              ...f,
              active: e.target.value,
            }));
          }}
        >
          <option value="">Active and inactive</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>

        <button className="admin-secondary-btn">
          Search
        </button>
      </form>

      <Notice>{error}</Notice>
      <Notice kind="success">{note}</Notice>

      {creating && (
        <CreateUser
          onCreated={() => {
            setCreating(false);
            setNote("Account created.");
            load();
          }}
        />
      )}

      {data && (
        <div className="admin-table-wrap">
          <table className="admin-table users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {data.content.map((u) =>
                editing?.id === u.id ? (
                  <tr key={u.id}>
                    <td>
                      <input
                        aria-label="Name"
                        value={editing.name}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            name: e.target.value,
                          })
                        }
                      />
                    </td>

                    <td>
                      <input
                        aria-label="Email"
                        value={editing.email}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            email: e.target.value,
                          })
                        }
                      />
                    </td>

                    <td>{u.role}</td>
                    <td></td>

                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-small-btn primary"
                          onClick={() =>
                            act(
                              () =>
                                api
                                  .put(`/api/admin/users/${u.id}`, {
                                    name: editing.name,
                                    email: editing.email,
                                  })
                                  .then(() => setEditing(null)),
                              "Saved."
                            )
                          }
                        >
                          Save
                        </button>

                        <button
                          className="admin-small-btn"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={u.id}
                    className={!u.active ? "admin-inactive" : ""}
                  >
                    <td>
                      <strong>{u.name}</strong>
                    </td>

                    <td className="admin-email">
                      {u.email}
                    </td>

                    <td>
                      <span className="role-chip">
                        {u.role.charAt(0) +
                          u.role.slice(1).toLowerCase()}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          u.active
                            ? "account-status active"
                            : "account-status inactive"
                        }
                      >
                        {u.active ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-small-btn"
                          onClick={() =>
                            setEditing({
                              id: u.id,
                              name: u.name,
                              email: u.email,
                            })
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="admin-small-btn"
                          onClick={() => resetPassword(u)}
                        >
                          Reset password
                        </button>

                        {u.active ? (
                          <button
                            className="admin-small-btn danger"
                            onClick={() =>
                              act(
                                () =>
                                  api.put(
                                    `/api/admin/users/${u.id}/deactivate`
                                  ),
                                `${u.name} was deactivated.`
                              )
                            }
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="admin-small-btn primary"
                            onClick={() =>
                              act(
                                () =>
                                  api.put(
                                    `/api/admin/users/${u.id}/activate`
                                  ),
                                `${u.name} was reactivated.`
                              )
                            }
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.content.length === 0 && (
        <div className="admin-empty">
          <strong>No accounts found</strong>
          <span>Try changing your search or filters.</span>
        </div>
      )}

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}

/* =========================================================
   CREATE USER
   ========================================================= */

function CreateUser({ onCreated }) {
  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    role: "FACULTY",
  });

  const [err, setErr] = useState(null);

  const set = (k) => (e) =>
    setF((p) => ({
      ...p,
      [k]: e.target.value,
    }));

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
    <form
      className="admin-create-panel"
      onSubmit={submit}
      noValidate
    >
      <div className="admin-create-heading">
        <div>
          <span className="section-eyebrow">NEW ACCOUNT</span>
          <h3>Create user</h3>
        </div>
      </div>

      <Notice>
        {err && !err.fieldErrors ? err.message : ""}
      </Notice>

      <div className="two-col">
        <Field
          id="cu-name"
          label="Full name"
          error={fe.name}
        >
          <input
            id="cu-name"
            value={f.name}
            onChange={set("name")}
          />
        </Field>

        <Field
          id="cu-email"
          label="Email"
          error={fe.email}
        >
          <input
            id="cu-email"
            type="email"
            value={f.email}
            onChange={set("email")}
          />
        </Field>
      </div>

      <div className="two-col">
        <Field
          id="cu-pw"
          label="Initial password"
          hint="At least 8 characters."
          error={fe.password}
        >
          <input
            id="cu-pw"
            type="text"
            value={f.password}
            onChange={set("password")}
          />
        </Field>

        <Field
          id="cu-role"
          label="Role"
          error={fe.role}
        >
          <select
            id="cu-role"
            value={f.role}
            onChange={set("role")}
          >
            <option value="FACULTY">Faculty</option>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </Field>
      </div>

      <button className="admin-primary-btn">
        Create account →
      </button>
    </form>
  );
}

/* =========================================================
   SUBMISSIONS
   ========================================================= */

function Submissions() {
  const [kind, setKind] = useState("projects");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(null);

    api
      .get(
        kind === "projects"
          ? "/api/admin/projects"
          : "/api/admin/research-papers",
        { status }
      )
      .then(setItems)
      .catch((e) => setError(errorMessage(e)));
  }, [kind, status]);

  return (
    <div className="admin-section">

      <div className="admin-section-heading">
        <div>
          <span className="section-eyebrow">
            CONTENT MANAGEMENT
          </span>
          <h2>All submissions</h2>
        </div>
      </div>

      <div className="admin-filter-bar">
        <select
          aria-label="Type"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="projects">Projects</option>
          <option value="papers">Research papers</option>
        </select>

        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Any status</option>
          <option value="PENDING">Awaiting review</option>
          <option value="RESUBMITTED">Resubmitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <Notice>{error}</Notice>

      {items && items.length === 0 && (
        <div className="admin-empty">
          <strong>No submissions found</strong>
          <span>No items match the selected status.</span>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Submission</th>
                <th>Reviewer</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>

            <tbody>
              {items.map((i) => (
                <tr key={`${i.type}-${i.id}`}>
                  <td>
                    <Link
                      className="admin-item-link"
                      to={itemPath(i)}
                    >
                      {i.title}
                    </Link>

                    <div className="admin-subtext">
                      {typeLabel(i.type)} · {i.category}
                    </div>
                  </td>

                  <td>{i.facultyName || "—"}</td>

                  <td>
                    <StatusBadge status={i.status} />
                  </td>

                  <td>{formatDate(i.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-help-text">
        Open a submission to view its full details and available
        administrative actions.
      </p>
    </div>
  );
}

/* =========================================================
   CATEGORIES / ACADEMIC YEARS
   ========================================================= */

function LookupManager({
  title,
  path,
  field,
  example,
}) {
  const [items, setItems] = useState(null);
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .get(path)
      .then(setItems)
      .catch((e) => setError(errorMessage(e)));
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
    <div className="admin-section">

      <div className="admin-section-heading">
        <div>
          <span className="section-eyebrow">
            REPOSITORY SETTINGS
          </span>

          <h2>{title}</h2>
        </div>
      </div>

      <Notice>{error}</Notice>

      <form
        className="admin-add-row"
        onSubmit={(e) => {
          e.preventDefault();

          act(async () => {
            await api.post(path, {
              [field]: value,
            });

            setValue("");
          });
        }}
      >
        <input
          aria-label="New entry"
          placeholder={`e.g. ${example}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <button
          className="admin-primary-btn"
          disabled={!value.trim()}
        >
          Add
        </button>
      </form>

      {items && (
        <div className="admin-table-wrap">
          <table className="admin-table lookup-table">
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    {editing?.id === it.id ? (
                      <input
                        aria-label="Name"
                        value={editing.value}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            value: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <strong>{it.name}</strong>
                    )}
                  </td>

                  <td>
                    <div className="admin-actions">
                      {editing?.id === it.id ? (
                        <>
                          <button
                            className="admin-small-btn primary"
                            onClick={() =>
                              act(async () => {
                                await api.put(
                                  `${path}/${it.id}`,
                                  {
                                    [field]: editing.value,
                                  }
                                );

                                setEditing(null);
                              })
                            }
                          >
                            Save
                          </button>

                          <button
                            className="admin-small-btn"
                            onClick={() => setEditing(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="admin-small-btn"
                            onClick={() =>
                              setEditing({
                                id: it.id,
                                value: it.name,
                              })
                            }
                          >
                            Rename
                          </button>

                          <button
                            className="admin-small-btn danger"
                            onClick={() =>
                              window.confirm(
                                `Delete "${it.name}"?`
                              ) &&
                              act(() =>
                                api.del(`${path}/${it.id}`)
                              )
                            }
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-help-text">
        An entry already used by existing submissions cannot be
        deleted. Rename it instead.
      </p>
    </div>
  );
}