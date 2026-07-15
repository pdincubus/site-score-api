import { z } from 'zod';

const reportInsightMetricNameSchema = z.enum([
    'pageWeight',
    'firstContentfulPaint',
    'largestContentfulPaint',
    'cumulativeLayoutShift',
    'totalBlockingTime',
    'speedIndex',
    'timeToInteractive',
    'interactionToNextPaint'
]);

const reportInsightResourceTypeSchema = z.enum([
    'total',
    'document',
    'stylesheet',
    'script',
    'image',
    'media',
    'font',
    'other',
    'third-party'
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
    unit: z.enum(['ms', 'score', 'unitless', 'bytes']),
    displayValue: z.string().max(500).nullable(),
    category: z.string().max(100).nullable().optional()
}).strict();

const reportInsightMetricsSchema = z.object({
    pageWeight: reportInsightMetricSchema.optional(),
    firstContentfulPaint: reportInsightMetricSchema.optional(),
    largestContentfulPaint: reportInsightMetricSchema.optional(),
    cumulativeLayoutShift: reportInsightMetricSchema.optional(),
    totalBlockingTime: reportInsightMetricSchema.optional(),
    speedIndex: reportInsightMetricSchema.optional(),
    timeToInteractive: reportInsightMetricSchema.optional(),
    interactionToNextPaint: reportInsightMetricSchema.optional()
}).strict();

const reportInsightResourceSummaryItemSchema = z.object({
    resourceType: reportInsightResourceTypeSchema,
    label: z.string().trim().min(1).max(80),
    requestCount: finiteNumberSchema.int().nonnegative(),
    transferSize: finiteNumberSchema.nonnegative()
}).strict();

const reportInsightResourceSummarySchema = z.object({
    items: z.array(reportInsightResourceSummaryItemSchema).max(12)
}).strict();

const reportInsightDomSizeSchema = z.object({
    totalElements: finiteNumberSchema.int().nonnegative().nullable(),
    maxDepth: finiteNumberSchema.int().nonnegative().nullable(),
    maxChildElements: finiteNumberSchema.int().nonnegative().nullable(),
    displayValue: z.string().max(120).nullable()
}).strict();

const reportInsightOpportunitySchema = z.object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(300),
    displayValue: z.string().max(300).nullable(),
    score: finiteNumberSchema.min(0).max(1).nullable(),
    overallSavingsMs: finiteNumberSchema.nonnegative().nullable()
}).strict();

const reportInsightAuditRefSchema = z.object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(300),
    category: z.string().trim().min(1).max(120),
    severity: z.enum(['fail', 'warning']),
    displayValue: z.string().max(300).nullable(),
    score: finiteNumberSchema.min(0).max(1).nullable()
}).strict();

const reportInsightUserTimingSchema = z.object({
    name: z.string().trim().min(1).max(200),
    entryType: z.enum(['mark', 'measure']),
    startTime: finiteNumberSchema.nonnegative().nullable(),
    duration: finiteNumberSchema.nonnegative().nullable(),
    displayValue: z.string().max(120).nullable()
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
        seo: scoreSchema,
        agenticBrowsing: scoreSchema
    }).strict(),
    metrics: reportInsightMetricsSchema,
    fieldData: z.object({
        source: reportInsightsSourceSchema,
        overallCategory: z.string().max(100).nullable(),
        metrics: reportInsightMetricsSchema
    }).strict().nullable().optional(),
    resourceSummary: reportInsightResourceSummarySchema.nullable().optional(),
    domSize: reportInsightDomSizeSchema.nullable().optional(),
    opportunities: z.array(reportInsightOpportunitySchema).max(5),
    auditRefs: z.array(reportInsightAuditRefSchema).max(20).optional(),
    userTimings: z.array(reportInsightUserTimingSchema).max(50).optional()
}).strict();

export {
    reportInsightAuditRefSchema,
    reportInsightDomSizeSchema,
    pageSpeedStrategySchema,
    reportInsightMetricSchema,
    reportInsightMetricsSchema,
    reportInsightOpportunitySchema,
    reportInsightResourceSummaryItemSchema,
    reportInsightResourceSummarySchema,
    reportInsightResourceTypeSchema,
    reportInsightUserTimingSchema,
    reportInsightsSchema,
    reportInsightsSourceSchema
};
