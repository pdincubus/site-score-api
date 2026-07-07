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

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    accessibility_score INTEGER NOT NULL CHECK (accessibility_score BETWEEN 0 AND 100),
    performance_score INTEGER NOT NULL CHECK (performance_score BETWEEN 0 AND 100),
    seo_score INTEGER NOT NULL CHECK (seo_score BETWEEN 0 AND 100),
    ux_score INTEGER NOT NULL CHECK (ux_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_user_created_at_idx
ON projects (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS projects_user_name_idx
ON projects (user_id, name);

CREATE INDEX IF NOT EXISTS projects_name_trgm_idx
ON projects USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS projects_url_trgm_idx
ON projects USING GIN (url gin_trgm_ops);

CREATE INDEX IF NOT EXISTS reports_project_created_at_idx
ON reports (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reports_project_title_idx
ON reports (project_id, title);

CREATE INDEX IF NOT EXISTS reports_title_trgm_idx
ON reports USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS reports_summary_trgm_idx
ON reports USING GIN (summary gin_trgm_ops);
