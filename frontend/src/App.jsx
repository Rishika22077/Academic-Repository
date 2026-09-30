import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Protected from "./components/Protected.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Repository from "./pages/Repository.jsx";
import ItemDetail from "./pages/ItemDetail.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import SubmissionForm from "./pages/SubmissionForm.jsx";
import FacultyQueue from "./pages/FacultyQueue.jsx";
import Admin from "./pages/Admin.jsx";

function NotFound() {
  return (
    <div className="container narrow">
      <h1 className="page-title">Page not found</h1>
      <p>That address does not exist. <Link to="/">Go to the repository</Link>.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Protected><Repository /></Protected>} />
        <Route path="/projects/:id" element={<Protected><ItemDetail kind="project" /></Protected>} />
        <Route path="/papers/:id" element={<Protected><ItemDetail kind="paper" /></Protected>} />
        <Route path="/student" element={<Protected roles={["STUDENT"]}><StudentDashboard /></Protected>} />
        <Route path="/student/submit/:kind" element={<Protected roles={["STUDENT"]}><SubmissionForm /></Protected>} />
        <Route path="/student/edit/:kind/:id" element={<Protected roles={["STUDENT"]}><SubmissionForm /></Protected>} />
        <Route path="/faculty" element={<Protected roles={["FACULTY"]}><FacultyQueue /></Protected>} />
        <Route path="/admin" element={<Protected roles={["ADMIN"]}><Admin /></Protected>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
