# Departmental Repository - Frontend

React 18 + React Router + Vite. Plain JavaScript and CSS, no UI library.

## Run it
1. Start the Spring Boot backend on http://localhost:8080.
2. `npm install`
3. `npm run dev` and open http://localhost:5173

In development Vite forwards `/api/*` to the backend (see `vite.config.js`), so no CORS setup is needed.
For a production build, run `npm run build` and set `VITE_API_BASE` to the backend address (see `.env.example`).

## Sign in with the seeded accounts
- Administrator: admin@college.edu / Admin@12345
- Faculty: faculty@college.edu / Faculty@12345
- Students register themselves on the Register page.

## Structure
```
src/
  api.js            fetch wrapper: adds the login token, turns errors into ApiError, opens/downloads PDFs
  auth.jsx          login state (token in localStorage, restored through /api/auth/me)
  App.jsx           routes; Protected.jsx keeps each role on its own pages
  components/       Layout (role-aware navigation), common (badges, fields, tag input), ReportButtons
  pages/
    Repository      "Search in: All / Projects / Research papers" + filters, results from the database
    ItemDetail      project and paper pages, faculty approve/reject panel
    SubmissionForm  new submission and edit-and-resubmit, for both kinds
    StudentDashboard, FacultyQueue, Admin, Login, Register
```
Categories, academic years, faculty and technologies in every dropdown are loaded from the API.
The search page keeps its query in the address bar, so results can be bookmarked and the back button works.

## Try the whole flow
1. Admin: add a category or year (Administration), or create another faculty account.
2. Student: register, then Submit project (attach a PDF), choose the faculty guide.
3. Faculty: open Review queue, read the submission, Approve or Reject with a reason.
4. Student: a rejected item shows the reason and an "Edit and resubmit" button.
5. Anyone: search the Repository for a keyword from an approved item.
