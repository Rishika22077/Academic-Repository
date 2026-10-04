import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LANDING, useAuth } from "../Auth.jsx";
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
    <div className="login-page">

      {/* Left side */}
      <div className="login-intro">
        <div className="intro-content">
          <div className="logo-mark">AR</div>

          <p className="eyebrow">ACADEMIC REPOSITORY</p>

          <h1>
            Your department's
            <span> knowledge,</span>
            all in one place.
          </h1>

          <p className="intro-text">
            Discover capstone projects, research papers and academic work
            from students across different batches.
          </p>

          <div className="intro-features">
            <div>
              <span>01</span>
              <p>Explore previous projects and research</p>
            </div>

            <div>
              <span>02</span>
              <p>Submit and track your academic work</p>
            </div>

            <div>
              <span>03</span>
              <p>Connect projects with GitHub repositories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="login-form-area">
        <div className="login-card">

          <div className="mobile-brand">
            <div className="logo-mark small">AR</div>
            <span>Academic Repository</span>
          </div>

          <div className="login-heading">
            <p className="form-eyebrow">WELCOME BACK</p>
            <h2>Sign in to your account</h2>
            <p>Access your department repository and submissions.</p>
          </div>

          <form onSubmit={submit} noValidate>

            <Notice>{error}</Notice>

            <Field id="email" label="Email address">
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field id="password" label="Password">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            <button
              className="login-button"
              disabled={busy}
              type="submit"
            >
              {busy ? "Signing in…" : "Sign in"}
              {!busy && <span>→</span>}
            </button>

          </form>

          <div className="register-prompt">
            <span>New student?</span>
            <Link to="/register">Create an account</Link>
          </div>

          <p className="faculty-note">
            Faculty accounts are created by the administrator.
          </p>

        </div>
      </div>

    </div>
  );
}