CREATE EXTENSION IF NOT EXISTS pg_trgm;

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
