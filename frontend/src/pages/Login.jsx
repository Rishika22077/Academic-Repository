import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LANDING, useAuth } from "../auth.jsx";
import { Field, Notice, errorMessage } from "../components/common.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={LANDING[user.role]} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await login(email, password);
      navigate(location.state?.from || LANDING[r.role], { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <h1 className="brand-large">Departmental Repository</h1>
        <p className="muted">Capstone projects and research papers from every batch, in one place.</p>
        <form onSubmit={submit} noValidate>
          <Notice>{error}</Notice>
          <Field id="email" label="Email">
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field id="password" label="Password">
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <button className="btn primary block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="muted">New student? <Link to="/register">Create an account</Link>. Faculty accounts are created by the administrator.</p>
      </div>
    </div>
  );
}
