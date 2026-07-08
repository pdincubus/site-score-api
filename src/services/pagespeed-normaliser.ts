import { AppError } from '../errors/app-error.js';
import type {
    ReportInsightAuditRef,
    PageSpeedStrategy,
    ReportInsightMetric,
    ReportInsightMetricName,
    ReportInsightOpportunity,
    ReportInsightUserTiming,
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
    category: string | null;
};

const metricDefinitions: MetricDefinition[] = [
    {
        auditId: 'total-byte-weight',
        insightName: 'pageWeight',
        unit: 'bytes',
        category: 'performance'
    },
    {
        auditId: 'first-contentful-paint',
        insightName: 'firstContentfulPaint',
        unit: 'ms',
        category: 'performance'
    },
    {
        auditId: 'largest-contentful-paint',
        insightName: 'largestContentfulPaint',
        unit: 'ms',
        category: 'performance'
    },
    {
        auditId: 'cumulative-layout-shift',
        insightName: 'cumulativeLayoutShift',
        unit: 'unitless',
        category: 'performance'
    },
    {
        auditId: 'total-blocking-time',
        insightName: 'totalBlockingTime',
        unit: 'ms',
        category: 'performance'
    },
    {
        auditId: 'speed-index',
        insightName: 'speedIndex',
        unit: 'ms',
        category: 'performance'
    },
    {
        auditId: 'interactive',
        insightName: 'timeToInteractive',
        unit: 'ms',
        category: 'performance'
    },
    {
        auditId: 'interaction-to-next-paint',
        insightName: 'interactionToNextPaint',
        unit: 'ms',
        category: 'performance'
    }
];

const excludedAuditScoreDisplayModes = new Set([
    'manual',
    'informative',
    'notApplicable',
    'error'
]);

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

function getArray(value: unknown, key: string): unknown[] {
    if (!isRecord(value)) {
        return [];
    }

    const child = value[key];

    return Array.isArray(child) ? child : [];
}

function getString(value: unknown): string | null {
    return typeof value === 'string' ? stripHtml(value) : null;
}

function getFiniteNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getNonNegativeNumber(value: unknown): number | null {
    const numberValue = getFiniteNumber(value);

    return numberValue !== null && numberValue >= 0 ? numberValue : null;
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
        category: definition.category
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

function normaliseAuditRefs(
    categories: Record<string, unknown>,
    audits: Record<string, unknown>
): ReportInsightAuditRef[] {
    const auditRefs: ReportInsightAuditRef[] = [];
    const seen = new Set<string>();

    for (const [category, value] of Object.entries(categories)) {
        const categoryRecord = isRecord(value) ? value : undefined;

        if (!categoryRecord) {
            continue;
        }

        for (const auditRefValue of getArray(categoryRecord, 'auditRefs')) {
            const auditRef = isRecord(auditRefValue) ? auditRefValue : undefined;
            const id = getString(auditRef?.id);

            if (!id) {
                continue;
            }

            const key = `${category}:${id}`;

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);

            const audit = getRecord(audits, id);
            const title = getString(audit?.title);
            const score = getFiniteNumber(audit?.score);
            const scoreDisplayMode = getString(audit?.scoreDisplayMode);

            if (
                !audit ||
                !title ||
                score === null ||
                (scoreDisplayMode !== null && excludedAuditScoreDisplayModes.has(scoreDisplayMode))
            ) {
                continue;
            }

            const severity =
                score === 0
                    ? 'fail'
                    : score > 0 && score < 1
                        ? 'warning'
                        : null;

            if (!severity) {
                continue;
            }

            auditRefs.push({
                id,
                title,
                category,
                severity,
                displayValue: getString(audit.displayValue),
                score: normaliseAuditScore(score)
            });

            if (auditRefs.length >= 20) {
                return auditRefs;
            }
        }
    }

    return auditRefs;
}

function formatTimingValue(value: number | null): string | null {
    if (value === null) {
        return null;
    }

    if (value < 1000) {
        return `${Math.round(value)} ms`;
    }

    return `${(value / 1000).toFixed(1)} s`;
}

function normaliseUserTimings(audits: Record<string, unknown>): ReportInsightUserTiming[] {
    const userTimingsAudit = getRecord(audits, 'user-timings');
    const details = getRecord(userTimingsAudit, 'details');

    if (!details) {
        return [];
    }

    return getArray(details, 'items')
        .map((itemValue): ReportInsightUserTiming | null => {
            const item = isRecord(itemValue) ? itemValue : undefined;
            const name = getString(item?.name);
            const timingType = getString(item?.timingType)?.toLowerCase();

            if (!item || !name || name.startsWith('goog_')) {
                return null;
            }

            const entryType =
                timingType === 'measure'
                    ? 'measure'
                    : timingType === 'mark'
                        ? 'mark'
                        : null;

            if (!entryType) {
                return null;
            }

            const startTime = getNonNegativeNumber(item.startTime);
            const duration = entryType === 'measure'
                ? getNonNegativeNumber(item.duration)
                : null;
            const primaryValue = entryType === 'measure' ? duration : startTime;

            return {
                name,
                entryType,
                startTime,
                duration,
                displayValue: formatTimingValue(primaryValue)
            };
        })
        .filter((timing): timing is ReportInsightUserTiming => timing !== null)
        .slice(0, 50);
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
            seo: normaliseCategoryScore(getRecord(categories, 'seo')),
            agenticBrowsing: null
        },
        metrics,
        fieldData: null,
        opportunities: normaliseOpportunities(audits),
        auditRefs: normaliseAuditRefs(categories, audits),
        userTimings: normaliseUserTimings(audits)
    };
}

export { normalisePageSpeedResponse };
