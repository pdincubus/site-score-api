import type { PageSpeedStrategy } from './report-insights.js';
import type { ReportInsightResourceSummaryItem } from './report-insights.js';

type ReportTrendTechnicalMetrics = {
    pageWeightBytes: number | null;
    domNodes: number | null;
    resources: ReportInsightResourceSummaryItem[];
};

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
    technicalMetrics?: ReportTrendTechnicalMetrics;
};

type ReportGroupTrend = {
    groupId: string;
    groupName: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    points: ReportTrendPoint[];
};

export type { ReportGroupTrend, ReportTrendPoint, ReportTrendTechnicalMetrics };
