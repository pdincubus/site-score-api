ALTER TABLE reports
ADD CONSTRAINT reports_accessibility_score_check
CHECK (accessibility_score BETWEEN 0 AND 100);

ALTER TABLE reports
ADD CONSTRAINT reports_performance_score_check
CHECK (performance_score BETWEEN 0 AND 100);

ALTER TABLE reports
ADD CONSTRAINT reports_seo_score_check
CHECK (seo_score BETWEEN 0 AND 100);

ALTER TABLE reports
ADD CONSTRAINT reports_ux_score_check
CHECK (ux_score BETWEEN 0 AND 100);