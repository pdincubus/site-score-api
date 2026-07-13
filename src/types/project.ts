type Project = {
    id: string;
    name: string;
    url: string;
    clientId: string | null;
    archivedAt: string | null;
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
    clientName: string | null;
    summary: ProjectSummary;
};

export type { Project, ProjectListItem, ProjectSummary, ProjectSummaryScores };
