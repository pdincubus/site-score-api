CREATE TABLE IF NOT EXISTS report_groups (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    page_url TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK (strategy IN ('mobile', 'desktop')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, project_id)
);

DELETE FROM reports;

ALTER TABLE reports
DROP CONSTRAINT IF EXISTS reports_ux_score_check;

ALTER TABLE reports
DROP COLUMN IF EXISTS ux_score;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS group_id UUID;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS page_url TEXT;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS best_practices_score INTEGER;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS agentic_browsing_score INTEGER;

ALTER TABLE reports
ALTER COLUMN page_url SET NOT NULL;

ALTER TABLE reports
ALTER COLUMN best_practices_score SET NOT NULL;

ALTER TABLE reports
ALTER COLUMN agentic_browsing_score SET NOT NULL;

ALTER TABLE reports
ADD CONSTRAINT reports_best_practices_score_check
CHECK (best_practices_score BETWEEN 0 AND 100);

ALTER TABLE reports
ADD CONSTRAINT reports_agentic_browsing_score_check
CHECK (agentic_browsing_score BETWEEN 0 AND 100);

ALTER TABLE reports
ADD CONSTRAINT reports_group_project_fk
FOREIGN KEY (group_id, project_id)
REFERENCES report_groups(id, project_id);

CREATE INDEX IF NOT EXISTS report_groups_project_name_idx
ON report_groups (project_id, name, created_at);

CREATE INDEX IF NOT EXISTS reports_project_group_created_at_idx
ON reports (project_id, group_id, created_at DESC);
