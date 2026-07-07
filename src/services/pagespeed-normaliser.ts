import { AppError } from '../errors/app-error.js';
import type {
    PageSpeedStrategy,
    ReportInsightMetric,
    ReportInsightMetricName,
    ReportInsightOpportunity,
    ReportInsights
} from '../types/report-insights.js';

type NormalisePageSpeedOptions = {
    testedUrl: string;
    strategy: PageSpeedStrategy;
    fetchedAt: Date;
};

type MetricDefinition = {
    auditId: string;
    insightName: ReportInsightMetricName;
    unit: ReportInsightMetric['unit'];
};

const metricDefinitions: MetricDefinition[] = [
    {
        auditId: 'first-contentful-paint',
        insightName: 'firstContentfulPaint',
        unit: 'ms'
    },
    {
        auditId: 'largest-contentful-paint',
        insightName: 'largestContentfulPaint',
        unit: 'ms'
    },
    {
        auditId: 'cumulative-layout-shift',
        insightName: 'cumulativeLayoutShift',
        unit: 'unitless'
    },
    {
        auditId: 'total-blocking-time',
        insightName: 'totalBlockingTime',
        unit: 'ms'
    },
    {
        auditId: 'speed-index',
        insightName: 'speedIndex',
        unit: 'ms'
    },
    {
        auditId: 'interactive',
        insightName: 'timeToInteractive',
        unit: 'ms'
    },
    {
        auditId: 'interaction-to-next-paint',
        insightName: 'interactionToNextPaint',
        unit: 'ms'
    }
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, key: string): Record<string, unknown> | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const child = value[key];

    return isRecord(child) ? child : undefined;
}

function getString(value: unknown): string | null {
    return typeof value === 'string' ? stripHtml(value) : null;
}

function getFiniteNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function normaliseCategoryScore(category: Record<string, unknown> | undefined): number | null {
    const score = getFiniteNumber(category?.score);

    if (score === null || score < 0 || score > 1) {
        return null;
    }

    return Math.round(score * 100);
}

function normaliseAuditScore(value: unknown): number | null {
    const score = getFiniteNumber(value);

    return score !== null && score >= 0 && score <= 1 ? score : null;
}

function normaliseUrl(value: unknown): string | null {
    const urlValue = getString(value);

    if (!urlValue) {
        return null;
    }

    try {
        const url = new URL(urlValue);

        return url.protocol === 'http:' || url.protocol === 'https:' ? urlValue : null;
    } catch {
        return null;
    }
}

function normaliseMetric(
    audits: Record<string, unknown>,
    definition: MetricDefinition
): ReportInsightMetric | undefined {
    const audit = getRecord(audits, definition.auditId);

    if (!audit) {
        return undefined;
    }

    return {
        value: getFiniteNumber(audit.numericValue),
        unit: definition.unit,
        displayValue: getString(audit.displayValue),
        category: null
    };
}

function normaliseOpportunities(audits: Record<string, unknown>): ReportInsightOpportunity[] {
    return Object.entries(audits)
        .map(([key, value]): ReportInsightOpportunity | null => {
            const audit = isRecord(value) ? value : undefined;
            const details = getRecord(audit, 'details');
            const overallSavingsMs = getFiniteNumber(details?.overallSavingsMs);
            const title = getString(audit?.title);

            if (
                !audit ||
                !details ||
                details.type !== 'opportunity' ||
                !title ||
                !overallSavingsMs ||
                overallSavingsMs <= 0
            ) {
                return null;
            }

            const id = getString(audit.id) || key;

            return {
                id,
                title,
                displayValue: getString(audit.displayValue),
                score: normaliseAuditScore(audit.score),
                overallSavingsMs
            };
        })
        .filter((opportunity): opportunity is ReportInsightOpportunity => opportunity !== null)
        .sort((first, second) => (second.overallSavingsMs ?? 0) - (first.overallSavingsMs ?? 0))
        .slice(0, 5);
}

function normalisePageSpeedResponse(
    responseBody: unknown,
    options: NormalisePageSpeedOptions
): ReportInsights {
    const lighthouseResult = getRecord(responseBody, 'lighthouseResult');

    if (!lighthouseResult) {
        throw new AppError('PageSpeed returned an unusable response', 502);
    }

    const categories = getRecord(lighthouseResult, 'categories') || {};
    const audits = getRecord(lighthouseResult, 'audits') || {};
    const metrics: ReportInsights['metrics'] = {};

    for (const definition of metricDefinitions) {
        const metric = normaliseMetric(audits, definition);

        if (metric) {
            metrics[definition.insightName] = metric;
        }
    }

    return {
        source: 'PAGESPEED',
        strategy: options.strategy,
        testedUrl: options.testedUrl,
        finalUrl:
            normaliseUrl(lighthouseResult.finalDisplayedUrl) ||
            normaliseUrl(lighthouseResult.finalUrl),
        fetchedAt: options.fetchedAt.toISOString(),
        lighthouseVersion: getString(lighthouseResult.lighthouseVersion),
        scores: {
            performance: normaliseCategoryScore(getRecord(categories, 'performance')),
            accessibility: normaliseCategoryScore(getRecord(categories, 'accessibility')),
            bestPractices: normaliseCategoryScore(getRecord(categories, 'best-practices')),
            seo: normaliseCategoryScore(getRecord(categories, 'seo'))
        },
        metrics,
        fieldData: null,
        opportunities: normaliseOpportunities(audits)
    };
}

export { normalisePageSpeedResponse };
