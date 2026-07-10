import { z } from 'zod';

const createClientSchema = z.object({
    name: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Name is required' : 'Name must be a string'
    }).trim().min(1, 'Name is required').max(160, 'Name must be 160 characters or fewer')
});

const updateClientSchema = z.object({
    name: z.string().trim().min(1, 'Name must be a non-empty string').max(160, 'Name must be 160 characters or fewer')
});

export { createClientSchema, updateClientSchema };
