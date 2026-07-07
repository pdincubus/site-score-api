import { z } from 'zod';

const reportInsightMetricNameSchema = z.enum([
    'firstContentfulPaint',
    'largestContentfulPaint',
    'cumulativeLayoutShift',
    'totalBlockingTime',
    'speedIndex',
    'timeToInteractive',
    'interactionToNextPaint'
]);

const reportInsightsSourceSchema = z.enum(['PAGESPEED', 'CRUX']);
const pageSpeedStrategySchema = z.enum(['mobile', 'desktop']);
const finiteNumberSchema = z.number().finite();
const scoreSchema = z.number().int().min(0).max(100).nullable();

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);

        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

const reportInsightUrlSchema = z.string()
    .trim()
    .min(1)
    .max(2048)
    .refine(isHttpUrl, 'URL must be an absolute http or https URL');

const reportInsightMetricSchema = z.object({
    value: finiteNumberSchema.nullable(),
    unit: z.enum(['ms', 'score', 'unitless']),
    displayValue: z.string().max(500).nullable(),
    category: z.string().max(100).nullable().optional()
}).strict();

const reportInsightMetricsSchema = z.object({
    firstContentfulPaint: reportInsightMetricSchema.optional(),
    largestContentfulPaint: reportInsightMetricSchema.optional(),
    cumulativeLayoutShift: reportInsightMetricSchema.optional(),
    totalBlockingTime: reportInsightMetricSchema.optional(),
    speedIndex: reportInsightMetricSchema.optional(),
    timeToInteractive: reportInsightMetricSchema.optional(),
    interactionToNextPaint: reportInsightMetricSchema.optional()
}).strict();

const reportInsightOpportunitySchema = z.object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(300),
    displayValue: z.string().max(300).nullable(),
    score: finiteNumberSchema.min(0).max(1).nullable(),
    overallSavingsMs: finiteNumberSchema.nonnegative().nullable()
}).strict();

const isoDateTimeSchema = z.string().refine((value) => {
    const timestamp = Date.parse(value);

    return !Number.isNaN(timestamp);
}, 'Fetched date must be an ISO date-time string');

const reportInsightsSchema = z.object({
    source: reportInsightsSourceSchema,
    strategy: pageSpeedStrategySchema,
    testedUrl: reportInsightUrlSchema,
    finalUrl: reportInsightUrlSchema.nullable(),
    fetchedAt: isoDateTimeSchema,
    lighthouseVersion: z.string().max(80).nullable(),
    scores: z.object({
        performance: scoreSchema,
        accessibility: scoreSchema,
        bestPractices: scoreSchema,
        seo: scoreSchema
    }).strict(),
    metrics: reportInsightMetricsSchema,
    fieldData: z.object({
        source: reportInsightsSourceSchema,
        overallCategory: z.string().max(100).nullable(),
        metrics: reportInsightMetricsSchema
    }).strict().nullable().optional(),
    opportunities: z.array(reportInsightOpportunitySchema).max(5)
}).strict();

export {
    pageSpeedStrategySchema,
    reportInsightMetricSchema,
    reportInsightMetricsSchema,
    reportInsightOpportunitySchema,
    reportInsightsSchema,
    reportInsightsSourceSchema
};
