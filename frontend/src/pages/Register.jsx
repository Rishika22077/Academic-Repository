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

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
    <div className="register-page">

      {/* LEFT SIDE */}
      <div className="register-intro">
        <div className="register-intro-content">

          <div className="register-logo">
            AR
          </div>

          <p className="register-eyebrow">
            ACADEMIC REPOSITORY
          </p>

          <h1>
            Build your academic
            <span> record.</span>
          </h1>

          <p className="register-description">
            Create your student account and become part of your
            department's academic repository.
          </p>

          <div className="register-points">
            <div>
              <span>01</span>
              <p>Submit your projects and research papers</p>
            </div>

            <div>
              <span>02</span>
              <p>Track submissions through faculty review</p>
            </div>

            <div>
              <span>03</span>
              <p>Build a searchable academic record</p>
            </div>
          </div>

        </div>
      </div>


      {/* RIGHT SIDE */}
      <div className="register-form-area">

        <div className="register-card">

          <p className="register-form-eyebrow">
            GET STARTED
          </p>

          <h2>
            Create your account
          </h2>

          <p className="register-subtitle">
            Register as a student to access the departmental repository.
          </p>

          <form onSubmit={submit} noValidate>

            <Notice>
              {error && !error.fieldErrors ? error.message : ""}
            </Notice>

            <Field
              id="name"
              label="Full name"
              error={fe.name}
            >
              <input
                id="name"
                autoComplete="name"
                value={form.name}
                onChange={set("name")}
                required
              />
            </Field>

            <Field
              id="email"
              label="Email"
              error={fe.email}
            >
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={set("email")}
                required
              />
            </Field>

            <Field
              id="password"
              label="Password"
              hint="At least 8 characters."
              error={fe.password}
            >
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                required
              />
            </Field>

            <button
              className="register-button"
              disabled={busy}
            >
              {busy ? "Creating account…" : "Create account →"}
            </button>

          </form>

          <p className="register-login">
            Already registered?
            <Link to="/login"> Sign in</Link>
          </p>

        </div>

      </div>

    </div>
  );
}