import { z } from 'zod';

const scoreSchema = z.number().int().min(0).max(100);

const createReportSchema = z.object({
    title: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Title is required' : 'Title must be a string'
    }).trim().min(1, 'Title is required'),
    summary: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Summary is required' : 'Summary must be a string'
    }).trim().min(1, 'Summary is required'),
    accessibilityScore: scoreSchema,
    performanceScore: scoreSchema,
    seoScore: scoreSchema,
    uxScore: scoreSchema
});

const updateReportSchema = z.object({
    title: z.string().trim().min(1, 'Title must be a non-empty string').optional(),
    summary: z.string().trim().min(1, 'Summary must be a non-empty string').optional(),
    accessibilityScore: scoreSchema.optional(),
    performanceScore: scoreSchema.optional(),
    seoScore: scoreSchema.optional(),
    uxScore: scoreSchema.optional()
}).refine(
    (data) =>
        data.title !== undefined ||
        data.summary !== undefined ||
        data.accessibilityScore !== undefined ||
        data.performanceScore !== undefined ||
        data.seoScore !== undefined ||
        data.uxScore !== undefined,
    {
        message: 'At least one report field is required'
    }
);

export { createReportSchema, updateReportSchema };