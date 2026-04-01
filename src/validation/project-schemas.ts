import { z } from 'zod';

const createProjectSchema = z.object({
    name: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Name is required' : 'Name must be a string'
    }).trim().min(1, 'Name is required'),
    url: z.string({
        error: (issue) =>
            issue.input === undefined ? 'URL is required' : 'URL must be a string'
    }).trim().min(1, 'URL is required').url('URL must be valid')
});

const updateProjectSchema = z.object({
    name: z.string().trim().min(1, 'Name must be a non-empty string').optional(),
    url: z.string().trim().min(1, 'URL must be a non-empty string').url('URL must be valid').optional()
}).refine(
    (data) => data.name !== undefined || data.url !== undefined,
    {
        message: 'At least one of name or URL is required'
    }
);

export { createProjectSchema, updateProjectSchema };