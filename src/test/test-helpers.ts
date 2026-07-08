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
    groupId: string;
    title: string;
    summary: string;
    pageUrl: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
    insights?: unknown;
};

type CreateReportGroupInput = {
    cookie: AuthCookie;
    projectId: string;
    name: string;
    pageUrl: string;
    strategy: 'mobile' | 'desktop';
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
            groupId: input.groupId,
            title: input.title,
            summary: input.summary,
            pageUrl: input.pageUrl,
            accessibilityScore: input.accessibilityScore,
            performanceScore: input.performanceScore,
            seoScore: input.seoScore,
            bestPracticesScore: input.bestPracticesScore,
            agenticBrowsingScore: input.agenticBrowsingScore,
            ...(input.insights !== undefined ? { insights: input.insights } : {})
        });
}

async function createReportGroup(input: CreateReportGroupInput) {
    return request(app)
        .post(`/projects/${input.projectId}/report-groups`)
        .set('Cookie', input.cookie)
        .send({
            name: input.name,
            pageUrl: input.pageUrl,
            strategy: input.strategy
        });
}

export {
    registerUser,
    loginUser,
    registerAndLoginAs,
    createProject,
    createReportGroup,
    createReport
};
