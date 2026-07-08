CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_groups (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    page_url TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK (strategy IN ('mobile', 'desktop')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, project_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    group_id UUID,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    page_url TEXT NOT NULL,
    accessibility_score INTEGER NOT NULL CHECK (accessibility_score BETWEEN 0 AND 100),
    performance_score INTEGER NOT NULL CHECK (performance_score BETWEEN 0 AND 100),
    seo_score INTEGER NOT NULL CHECK (seo_score BETWEEN 0 AND 100),
    best_practices_score INTEGER NOT NULL CHECK (best_practices_score BETWEEN 0 AND 100),
    agentic_browsing_score INTEGER NOT NULL CHECK (agentic_browsing_score BETWEEN 0 AND 100),
    insights JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT reports_group_project_fk
    FOREIGN KEY (group_id, project_id)
    REFERENCES report_groups(id, project_id)
);

CREATE INDEX IF NOT EXISTS projects_user_created_at_idx
ON projects (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS projects_user_name_idx
ON projects (user_id, name);

CREATE INDEX IF NOT EXISTS projects_name_trgm_idx
ON projects USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS projects_url_trgm_idx
ON projects USING GIN (url gin_trgm_ops);

CREATE INDEX IF NOT EXISTS report_groups_project_name_idx
ON report_groups (project_id, name, created_at);

CREATE INDEX IF NOT EXISTS reports_project_created_at_idx
ON reports (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reports_project_group_created_at_idx
ON reports (project_id, group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reports_project_title_idx
ON reports (project_id, title);

CREATE INDEX IF NOT EXISTS reports_title_trgm_idx
ON reports USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS reports_summary_trgm_idx
ON reports USING GIN (summary gin_trgm_ops);
