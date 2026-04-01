import { z } from 'zod';

const registerSchema = z.object({
    name: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Name is required' : 'Name must be a string'
    }).trim().min(1, 'Name is required'),
    email: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Email is required' : 'Email must be a string'
    }).trim().min(1, 'Email is required').email('Email must be valid'),
    password: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Password is required' : 'Password must be a string'
    }).trim().min(1, 'Password is required')
});

const loginSchema = z.object({
    email: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Email is required' : 'Email must be a string'
    }).trim().min(1, 'Email is required').email('Email must be valid'),
    password: z.string({
        error: (issue) =>
            issue.input === undefined ? 'Password is required' : 'Password must be a string'
    }).trim().min(1, 'Password is required')
});

export { registerSchema, loginSchema };