import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LANDING, useAuth } from "../auth.jsx";
import { Field, Notice } from "../components/common.jsx";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={LANDING[user.role]} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fe = error?.fieldErrors || {};

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await register(form.name, form.email, form.password);
      navigate(LANDING[r.role], { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1 className="brand-large">Create a student account</h1>
        <form onSubmit={submit} noValidate>
          <Notice>{error && !error.fieldErrors ? error.message : ""}</Notice>
          <Field id="name" label="Full name" error={fe.name}>
            <input id="name" autoComplete="name" value={form.name} onChange={set("name")} required />
          </Field>
          <Field id="email" label="Email" error={fe.email}>
            <input id="email" type="email" autoComplete="username" value={form.email} onChange={set("email")} required />
          </Field>
          <Field id="password" label="Password" hint="At least 8 characters." error={fe.password}>
            <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required />
          </Field>
          <button className="btn primary block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        </form>
        <p className="muted">Already registered? <Link to="/login">Sign in</Link>.</p>
      </div>
    </div>
  );
}
