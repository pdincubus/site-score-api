import request from 'supertest';
import { app } from '../app.js';

type AuthUserInput = {
    name: string;
    email: string;
    password?: string;
};

type LoginInput = {
    email: string;
    password?: string;
};

type AuthCookie = string[];

type CreateProjectInput = {
    cookie: AuthCookie;
    name: string;
    url: string;
};

type CreateReportInput = {
    cookie: AuthCookie;
    projectId: string;
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
};

async function registerUser(input: AuthUserInput) {
    const password = input.password ?? 'secret123';

    return request(app)
        .post('/auth/register')
        .send({
            name: input.name,
            email: input.email,
            password
        });
}

async function loginUser(input: LoginInput) {
    const password = input.password ?? 'secret123';

    return request(app)
        .post('/auth/login')
        .send({
            email: input.email,
            password
        });
}

async function registerAndLoginAs(input: AuthUserInput): Promise<AuthCookie> {
    const password = input.password ?? 'secret123';

    await registerUser({
        name: input.name,
        email: input.email,
        password
    });

    const loginResponse = await loginUser({
        email: input.email,
        password
    });

    const cookie = loginResponse.headers['set-cookie'];

    if (!cookie || !Array.isArray(cookie)) {
        throw new Error('Expected login response to include a set-cookie header array');
    }

    return cookie;
}

async function createProject(input: CreateProjectInput) {
    return request(app)
        .post('/projects')
        .set('Cookie', input.cookie)
        .send({
            name: input.name,
            url: input.url
        });
}

async function createReport(input: CreateReportInput) {
    return request(app)
        .post(`/projects/${input.projectId}/reports`)
        .set('Cookie', input.cookie)
        .send({
            title: input.title,
            summary: input.summary,
            accessibilityScore: input.accessibilityScore,
            performanceScore: input.performanceScore,
            seoScore: input.seoScore,
            uxScore: input.uxScore
        });
}

export {
    registerUser,
    loginUser,
    registerAndLoginAs,
    createProject,
    createReport
};