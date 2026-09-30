# Academic Repository

A full-stack departmental repository for managing, reviewing, searching, and accessing student capstone projects and research papers.

The system provides a centralized platform where students can submit their academic work, faculty can review and approve submissions, and approved projects and papers can be searched through a departmental repository.

---

## Features

### Student
- Register and log in securely
- Submit capstone projects
- Submit research papers
- Upload PDF reports
- Add project/paper metadata
- Add keywords and technologies
- Add faculty guide information
- Add GitHub/project links
- Track submission status
- View rejection reasons
- Resubmit rejected submissions
- View approved work in the repository

### Faculty
- Secure faculty login
- View pending submissions
- Review student projects and papers
- Approve submissions
- Reject submissions with a reason
- View approved submissions

### Administrator
- Secure admin login
- Manage users
- Manage categories
- Manage academic years
- View projects and research papers
- Manage repository data
- View repository statistics

### Repository & Search
- Search approved projects and research papers
- Search by title, abstract, authors/team members, faculty, category, academic year, keywords, and technologies
- Dedicated keyword-based search for research papers
- Filter repository content
- View project and paper details
- Access uploaded PDF reports

---

## Workflow

```text
Student
   │
   ├── Register / Login
   │
   ├── Submit Project / Research Paper
   │
   ▼
PENDING
   │
   ▼
Faculty Review
   │
   ├───────────────┐
   │               │
   ▼               ▼
APPROVED        REJECTED
   │               │
   │               ▼
   │          Rejection Reason
   │               │
   │               ▼
   │          Edit & Resubmit
   │               │
   │               └──────► PENDING
   │
   ▼
Department Repository