import type { PageSpeedStrategy } from './report-insights.js';

type ReportTrendPoint = {
    id: string;
    title: string;
    pageUrl: string;
    createdAt: string;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ReportGroupTrend = {
    groupId: string;
    groupName: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    points: ReportTrendPoint[];
};

export type { ReportGroupTrend, ReportTrendPoint };
