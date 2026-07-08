type Project = {
    id: string;
    name: string;
    url: string;
    createdAt: string;
};

type ProjectSummaryScores = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ProjectSummary = {
    reportCount: number;
    reportGroupCount: number;
    latestReportCreatedAt: string | null;
    latestReportTitle: string | null;
    latestScores: ProjectSummaryScores | null;
};

type ProjectListItem = Project & {
    summary: ProjectSummary;
};

export type { Project, ProjectListItem, ProjectSummary, ProjectSummaryScores };
