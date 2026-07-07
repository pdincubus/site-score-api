import type { ReportInsights } from './report-insights.js';

type Report = {
    id: string;
    projectId: string;
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
    insights: ReportInsights | null;
    createdAt: string;
};

export type { Report };
