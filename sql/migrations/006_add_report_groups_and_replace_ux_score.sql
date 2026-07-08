CREATE TABLE IF NOT EXISTS report_groups (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    page_url TEXT NOT NULL,
    strategy TEXT NOT NULL CHECK (strategy IN ('mobile', 'desktop')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (id, project_id)
);

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS group_id UUID;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS page_url TEXT;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS best_practices_score INTEGER;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS agentic_browsing_score INTEGER;

WITH legacy_groups AS (
    SELECT
        (
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 1 FOR 8) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 9 FOR 4) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 13 FOR 4) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 17 FOR 4) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 21 FOR 12)
        )::uuid AS id,
        p.id AS project_id,
        p.url AS page_url,
        MIN(r.created_at) AS created_at
    FROM projects p
    INNER JOIN reports r ON r.project_id = p.id
    GROUP BY p.id, p.url
)
INSERT INTO report_groups (id, project_id, name, page_url, strategy, created_at)
SELECT
    id,
    project_id,
    'Legacy reports',
    page_url,
    'desktop',
    created_at
FROM legacy_groups
ON CONFLICT (id) DO NOTHING;

WITH legacy_groups AS (
    SELECT
        (
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 1 FOR 8) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 9 FOR 4) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 13 FOR 4) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 17 FOR 4) || '-' ||
            SUBSTRING(MD5(p.id::text || ':legacy-report-group') FROM 21 FOR 12)
        )::uuid AS id,
        p.id AS project_id,
        p.url AS page_url
    FROM projects p
    INNER JOIN reports r ON r.project_id = p.id
    GROUP BY p.id, p.url
)
UPDATE reports r
SET group_id = COALESCE(r.group_id, legacy_groups.id),
    page_url = COALESCE(r.page_url, legacy_groups.page_url),
    best_practices_score = COALESCE(r.best_practices_score, r.ux_score),
    agentic_browsing_score = COALESCE(r.agentic_browsing_score, r.ux_score)
FROM legacy_groups
WHERE r.project_id = legacy_groups.project_id;

ALTER TABLE reports
ALTER COLUMN page_url SET NOT NULL;

ALTER TABLE reports
ALTER COLUMN best_practices_score SET NOT NULL;

ALTER TABLE reports
ALTER COLUMN agentic_browsing_score SET NOT NULL;

ALTER TABLE reports
DROP CONSTRAINT IF EXISTS reports_ux_score_check;

ALTER TABLE reports
DROP COLUMN IF EXISTS ux_score;

ALTER TABLE reports
DROP CONSTRAINT IF EXISTS reports_best_practices_score_check;

ALTER TABLE reports
ADD CONSTRAINT reports_best_practices_score_check
CHECK (best_practices_score BETWEEN 0 AND 100);

ALTER TABLE reports
DROP CONSTRAINT IF EXISTS reports_agentic_browsing_score_check;

ALTER TABLE reports
ADD CONSTRAINT reports_agentic_browsing_score_check
CHECK (agentic_browsing_score BETWEEN 0 AND 100);

ALTER TABLE reports
DROP CONSTRAINT IF EXISTS reports_group_project_fk;

ALTER TABLE reports
ADD CONSTRAINT reports_group_project_fk
FOREIGN KEY (group_id, project_id)
REFERENCES report_groups(id, project_id);

CREATE INDEX IF NOT EXISTS report_groups_project_name_idx
ON report_groups (project_id, name, created_at);

CREATE INDEX IF NOT EXISTS reports_project_group_created_at_idx
ON reports (project_id, group_id, created_at DESC);
