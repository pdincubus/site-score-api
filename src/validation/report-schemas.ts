import { z } from 'zod';
import { reportInsightsSchema } from './report-insights-schema.js';
import { publicHttpUrlSchema } from './url-schemas.js';

const scoreSchema = z.number().int().min(0).max(100);

const reportGroupIdSchema = z.string().uuid('Group id must be a valid UUID');

const reportBodyShape = {
    groupId: reportGroupIdSchema,
    title: z.string().trim().min(1, 'Title is required').max(160, 'Title must be 160 characters or fewer'),
    summary: z.string().trim().min(1, 'Summary is required').max(500, 'Summary must be 500 characters or fewer'),
    pageUrl: publicHttpUrlSchema,
    accessibilityScore: scoreSchema,
    performanceScore: scoreSchema,
    seoScore: scoreSchema,
    bestPracticesScore: scoreSchema,
    agenticBrowsingScore: scoreSchema
};

const createReportSchema = z.object({
    ...reportBodyShape,
    insights: reportInsightsSchema.nullable().optional()
}).strict();

const updateReportSchema = z.object(reportBodyShape).strict();

export { createReportSchema, reportGroupIdSchema, updateReportSchema };
