import type { PageSpeedStrategy, ReportInsights } from '../types/report-insights.js';
import { fetchPageSpeedInsights } from './pagespeed-client.js';

type ImportReportInsightsInput = {
    source: 'PAGESPEED';
    url: string;
    strategy: PageSpeedStrategy;
};

type ImportCacheEntry = {
    expiresAt: number;
    insights: ReportInsights;
};

const importCache = new Map<string, ImportCacheEntry>();
const cacheTtlMs = 10 * 60 * 1000;

function getCacheKey(input: ImportReportInsightsInput): string {
    return `${input.source}:${input.strategy}:${input.url}`;
}

function clearPageSpeedImportCache() {
    importCache.clear();
}

async function importReportInsights(input: ImportReportInsightsInput): Promise<ReportInsights> {
    const now = Date.now();
    const cacheKey = getCacheKey(input);
    const cached = importCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
        return cached.insights;
    }

    const insights = await fetchPageSpeedInsights({
        url: input.url,
        strategy: input.strategy
    });

    importCache.set(cacheKey, {
        expiresAt: now + cacheTtlMs,
        insights
    });

    return insights;
}

export { clearPageSpeedImportCache, importReportInsights };
