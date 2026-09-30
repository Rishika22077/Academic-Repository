import { Navigate, useLocation } from "react-router-dom";
import { LANDING, useAuth } from "../auth.jsx";

/** Redirects to login when signed out, and away from pages the role may not use. */
export default function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container"><p className="muted">Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={LANDING[user.role]} replace />;
  return children;
}
