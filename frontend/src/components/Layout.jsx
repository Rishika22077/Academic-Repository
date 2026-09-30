import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="site-header">
        <div className="bar">
          <NavLink to="/" className="brand">Departmental Repository</NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>Repository</NavLink>
            {user?.role === "STUDENT" && (
              <>
                <NavLink to="/student" end>My submissions</NavLink>
                <NavLink to="/student/submit/project">Submit project</NavLink>
                <NavLink to="/student/submit/paper">Submit paper</NavLink>
              </>
            )}
            {user?.role === "FACULTY" && <NavLink to="/faculty">Review queue</NavLink>}
            {user?.role === "ADMIN" && <NavLink to="/admin">Administration</NavLink>}
          </nav>
          <div className="who">
            <span>{user?.name}</span>
            <button className="btn quiet small" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
