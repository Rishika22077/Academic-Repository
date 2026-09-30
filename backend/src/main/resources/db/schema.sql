-- Reference schema (PostgreSQL). Hibernate creates the same structure automatically
-- with spring.jpa.hibernate.ddl-auto=update. Run this by hand only if you prefer to
-- manage the database yourself (then set ddl-auto to "validate").
--
--   CREATE DATABASE archive_db;

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'ADMIN')),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users (role);

CREATE TABLE categories (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE academic_years (
    id     BIGSERIAL PRIMARY KEY,
    label  VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE tags (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(100) NOT NULL,
    type  VARCHAR(20)  NOT NULL CHECK (type IN ('KEYWORD', 'TECHNOLOGY')),
    CONSTRAINT uk_tags_name_type UNIQUE (name, type)
);
CREATE INDEX idx_tags_name ON tags (name);

CREATE TABLE projects (
    id                    BIGSERIAL PRIMARY KEY,
    title                 VARCHAR(255) NOT NULL,
    abstract_text         TEXT         NOT NULL,
    department            VARCHAR(100) NOT NULL,
    category_id           BIGINT       NOT NULL REFERENCES categories (id),
    academic_year_id      BIGINT       NOT NULL REFERENCES academic_years (id),
    faculty_id            BIGINT       NOT NULL REFERENCES users (id),
    submitted_by          BIGINT       NOT NULL REFERENCES users (id),
    report_path           VARCHAR(500) NOT NULL,
    original_report_name  VARCHAR(255),
    github_url            VARCHAR(500),
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RESUBMITTED')),
    rejection_reason      TEXT,
    submitted_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    approved_at           TIMESTAMP
);
CREATE INDEX idx_projects_status       ON projects (status);
CREATE INDEX idx_projects_category     ON projects (category_id);
CREATE INDEX idx_projects_year         ON projects (academic_year_id);
CREATE INDEX idx_projects_faculty      ON projects (faculty_id);
CREATE INDEX idx_projects_submitted_by ON projects (submitted_by);

CREATE TABLE project_members (
    project_id  BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    student_id  BIGINT NOT NULL REFERENCES users (id),
    PRIMARY KEY (project_id, student_id)
);

CREATE TABLE project_tags (
    project_id  BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    tag_id      BIGINT NOT NULL REFERENCES tags (id),
    PRIMARY KEY (project_id, tag_id)
);
CREATE INDEX idx_project_tags_tag ON project_tags (tag_id);

CREATE TABLE research_papers (
    id                    BIGSERIAL PRIMARY KEY,
    title                 VARCHAR(255) NOT NULL,
    authors               TEXT         NOT NULL,
    abstract_text         TEXT         NOT NULL,
    department            VARCHAR(100) NOT NULL,
    category_id           BIGINT       NOT NULL REFERENCES categories (id),
    academic_year_id      BIGINT       NOT NULL REFERENCES academic_years (id),
    faculty_id            BIGINT       NOT NULL REFERENCES users (id),
    submitted_by          BIGINT       NOT NULL REFERENCES users (id),
    affiliation           VARCHAR(255),
    venue                 VARCHAR(255),
    publication_year      INTEGER,
    doi                   VARCHAR(255),
    external_url          VARCHAR(500),
    report_path           VARCHAR(500) NOT NULL,
    original_report_name  VARCHAR(255),
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RESUBMITTED')),
    rejection_reason      TEXT,
    submitted_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    approved_at           TIMESTAMP
);
CREATE INDEX idx_papers_status       ON research_papers (status);
CREATE INDEX idx_papers_category     ON research_papers (category_id);
CREATE INDEX idx_papers_year         ON research_papers (academic_year_id);
CREATE INDEX idx_papers_pub_year     ON research_papers (publication_year);
CREATE INDEX idx_papers_faculty      ON research_papers (faculty_id);
CREATE INDEX idx_papers_submitted_by ON research_papers (submitted_by);

CREATE TABLE paper_tags (
    paper_id  BIGINT NOT NULL REFERENCES research_papers (id) ON DELETE CASCADE,
    tag_id    BIGINT NOT NULL REFERENCES tags (id),
    PRIMARY KEY (paper_id, tag_id)
);
CREATE INDEX idx_paper_tags_tag ON paper_tags (tag_id);
