import type { ReportGroupSummary } from './report-group.js';
import type { ReportInsights } from './report-insights.js';

type ReportScoreComparison = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ReportInsightUserTimingComparison = {
    name: string;
    entryType: 'mark' | 'measure';
    currentValue: number | null;
    previousValue: number | null;
    delta: number | null;
    unit: 'ms';
    previousReportId?: string;
    previousCreatedAt?: string;
};

type ReportComparison = {
    previousReportId: string;
    previousCreatedAt: string;
    scores: ReportScoreComparison;
    userTimings?: ReportInsightUserTimingComparison[];
};

type Report = {
    id: string;
    projectId: string;
    groupId: string | null;
    group: ReportGroupSummary | null;
    title: string;
    summary: string;
    pageUrl: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
    insights: ReportInsights | null;
    comparison: ReportComparison | null;
    createdAt: string;
};

export type {
    Report,
    ReportComparison,
    ReportInsightUserTimingComparison,
    ReportScoreComparison
};
