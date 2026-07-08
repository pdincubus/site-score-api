type PageSpeedStrategy = 'mobile' | 'desktop';

type ReportInsightsSource = 'PAGESPEED' | 'CRUX';

type ReportInsightMetricName =
    | 'pageWeight'
    | 'firstContentfulPaint'
    | 'largestContentfulPaint'
    | 'cumulativeLayoutShift'
    | 'totalBlockingTime'
    | 'speedIndex'
    | 'timeToInteractive'
    | 'interactionToNextPaint';

type ReportInsightMetric = {
    value: number | null;
    unit: 'ms' | 'score' | 'unitless' | 'bytes';
    displayValue: string | null;
    category?: string | null;
};

type ReportInsightOpportunity = {
    id: string;
    title: string;
    displayValue: string | null;
    score: number | null;
    overallSavingsMs: number | null;
};

type ReportInsightAuditSeverity = 'fail' | 'warning';

type ReportInsightAuditRef = {
    id: string;
    title: string;
    category: string;
    severity: ReportInsightAuditSeverity;
    displayValue: string | null;
    score: number | null;
};

type ReportInsightUserTiming = {
    name: string;
    entryType: 'mark' | 'measure';
    startTime: number | null;
    duration: number | null;
    displayValue: string | null;
};

type ReportInsights = {
    source: ReportInsightsSource;
    strategy: PageSpeedStrategy;
    testedUrl: string;
    finalUrl: string | null;
    fetchedAt: string;
    lighthouseVersion: string | null;
    scores: {
        performance: number | null;
        accessibility: number | null;
        bestPractices: number | null;
        seo: number | null;
        agenticBrowsing: number | null;
    };
    metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    fieldData?: {
        source: ReportInsightsSource;
        overallCategory: string | null;
        metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    } | null;
    opportunities: ReportInsightOpportunity[];
    auditRefs?: ReportInsightAuditRef[];
    userTimings?: ReportInsightUserTiming[];
};

export type {
    PageSpeedStrategy,
    ReportInsightAuditRef,
    ReportInsightAuditSeverity,
    ReportInsightMetric,
    ReportInsightMetricName,
    ReportInsightOpportunity,
    ReportInsightUserTiming,
    ReportInsights,
    ReportInsightsSource
};
