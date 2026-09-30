# Departmental Research Paper & Capstone Project Repository - Backend

Spring Boot 3 / Java 17 / PostgreSQL / JWT. Covers: authentication, project submission + review,
research paper submission + review, PDF upload, and database-backed keyword search.

## Run it
1. Install Java 17+, Maven, PostgreSQL.
2. Create the database: `CREATE DATABASE archive_db;`
3. Set `DB_USER` / `DB_PASSWORD` if yours differ from postgres / postgres.
4. `mvn spring-boot:run` - tables are created on first start (IntelliJ: enable *Annotation Processing* for Lombok).

## Seeded accounts (change in application.yml)
| Role    | Email               | Password       |
|---------|---------------------|----------------|
| ADMIN   | admin@college.edu   | Admin@12345    |
| FACULTY | faculty@college.edu | Faculty@12345  |

Students self-register at `POST /api/auth/register`.

## Workflow
```
Student submits ──> PENDING ──> faculty APPROVE ──> APPROVED (visible in search)
                        │
                        └─> faculty REJECT (reason required) ──> REJECTED
                                                                   │ student edits + PUT
                                                                   v
                                                              RESUBMITTED ──> review again
```
Only the faculty member chosen by the student (or an admin) can approve/reject.
Only APPROVED items appear in search. Pending/rejected items are visible only to the
people involved and admins.

## Endpoints (all need `Authorization: Bearer <token>` except register/login)
### Auth
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register | creates a STUDENT |
| POST | /api/auth/login | returns JWT |
| GET  | /api/auth/me | current user |

### Dropdown data
| GET | /api/categories, /api/academic-years, /api/users/faculty |
|---|---|
| GET | /api/users/students?q=ab (STUDENT only, min 2 chars) - team member picker |
| GET | /api/tags?type=TECHNOLOGY\|KEYWORD - names used by approved items (filter dropdown) |

### Projects  (`/api/research-papers/...` mirrors these exactly)
| Method | Path | Who |
|---|---|---|
| POST | /api/projects | STUDENT - multipart |
| PUT  | /api/projects/{id} | STUDENT owner, only when REJECTED - multipart, sets RESUBMITTED |
| DELETE | /api/projects/{id} | owner (not if approved) or ADMIN |
| GET  | /api/student/projects | STUDENT - my submissions incl. rejection reasons |
| GET  | /api/faculty/projects?status=PENDING,RESUBMITTED | FACULTY - assigned to me (default shown) |
| GET  | /api/admin/projects?status= | ADMIN - everything |
| PUT  | /api/projects/{id}/approve | assigned FACULTY or ADMIN |
| PUT  | /api/projects/{id}/reject  | body `{ "reason": "..." }` |
| GET  | /api/projects/{id} | approved: anyone logged in; else involved users/admin |
| GET  | /api/projects/{id}/report?download=true | PDF stream (same visibility) |
| GET  | /api/projects/search?q=&categoryId=&academicYearId=&technology=&facultyId=&page=&size= | approved only |

Research papers add `publicationYear` and `author` search filters:
`GET /api/research-papers/search?q=phishing`

### Unified search page
`GET /api/repository/search?type=ALL|PROJECTS|PAPERS&q=machine learning&categoryId=1&page=0&size=10`

Search rules: the query is split into words; **every word must match** at least one of
title, abstract, authors/team members, faculty, category, academic year, or any keyword/technology.
So `phishing` and `machine learning` both find a paper tagged Phishing / Machine Learning.
It is a normal SQL `LIKE` query in PostgreSQL. Semantic/AI search is future scope.

## Multipart requests (submit / resubmit)
Two parts:
- `data` - JSON, **Content-Type must be application/json**
- `report` - the PDF (max 10 MB; checked by extension, content type and `%PDF-` signature)

Postman: Body -> form-data -> add key `data` (type Text, then set the content type to
`application/json` via the "..." column menu) with e.g.

```json
{
  "title": "Phishing Detector",
  "abstractText": "A browser extension that flags phishing emails using a trained classifier.",
  "department": "CSE",
  "categoryId": 1,
  "academicYearId": 2,
  "facultyId": 2,
  "memberIds": [],
  "keywords": ["phishing", "email security"],
  "technologies": ["Java", "React"],
  "githubUrl": "https://github.com/user/project"
}
```
and key `report` (type File). `githubUrl` is optional; when present it must be an http(s) link.

React (later): `const fd = new FormData(); fd.append("data", new Blob([JSON.stringify(payload)], {type:"application/json"})); fd.append("report", file);`
Do not set the Content-Type header manually - the browser adds the boundary.

## Showing the PDF in React
A plain `<a href="/api/projects/1/report">` cannot send the JWT. Fetch with the header,
turn the response into a blob, and open `URL.createObjectURL(blob)` (View) or save it (Download).

## Error format
`{ "timestamp": "...", "status": 400, "error": "message", "fieldErrors": { "title": "Title is required" } }`

## Admin (all under /api/admin/** = ADMIN only, except category/year writes which are @PreAuthorize ADMIN)
| Method | Path | Notes |
|---|---|---|
| GET | /api/admin/stats | user counts by role, project/paper counts by status |
| GET | /api/admin/users?role=&active=&q=&page=&size= | search accounts |
| POST | /api/admin/users | create FACULTY / STUDENT / ADMIN with an initial password |
| PUT | /api/admin/users/{id} | edit name + email (role is fixed) |
| PUT | /api/admin/users/{id}/deactivate, /activate | deactivated users are locked out on their next request |
| PUT | /api/admin/users/{id}/password | body `{ "newPassword": "..." }` |
| GET | /api/admin/projects, /api/admin/research-papers | all submissions, optional `?status=` |
| POST/PUT/DELETE | /api/categories, /api/categories/{id} | body `{ "name": "Networking" }`; delete blocked if in use |
| POST/PUT/DELETE | /api/academic-years, /api/academic-years/{id} | body `{ "label": "2027-28" }` |

Exceptional cases: admins can approve/reject any pending item, and delete any item, through the same
project/paper endpoints faculty use (for example when a faculty guide is deactivated with reviews pending).
Accounts are deactivated, never deleted, because submissions reference them.
An admin cannot deactivate their own account.
