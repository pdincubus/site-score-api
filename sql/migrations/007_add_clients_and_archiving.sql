CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_id UUID;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DO $$
BEGIN
    ALTER TABLE projects
    ADD CONSTRAINT projects_client_fk
    FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS clients_user_archived_name_idx
ON clients (user_id, archived_at, name);

CREATE INDEX IF NOT EXISTS clients_name_trgm_idx
ON clients USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS projects_user_archived_created_at_idx
ON projects (user_id, archived_at, created_at DESC);

CREATE INDEX IF NOT EXISTS reports_project_archived_created_at_idx
ON reports (project_id, archived_at, created_at DESC);
