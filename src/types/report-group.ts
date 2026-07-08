import type { PageSpeedStrategy } from './report-insights.js';

type ReportGroup = {
    id: string;
    projectId: string;
    name: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    createdAt: string;
};

type ReportGroupSummary = Pick<ReportGroup, 'id' | 'name' | 'pageUrl' | 'strategy'>;

export type { ReportGroup, ReportGroupSummary };
