import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { clearTables } from '../test/test-db.js';

async function registerAndLoginAs(
    name: string,
    email: string,
    password = 'secret123'
) {
    await request(app)
        .post('/auth/register')
        .send({
            name,
            email,
            password
        });

    const loginResponse = await request(app)
        .post('/auth/login')
        .send({
            email,
            password
        });

    return loginResponse.headers['set-cookie'];
}

describe('Report routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('returns an empty array when a project has no reports', async () => {
        const cookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                name: 'Project with no reports',
                url: 'https://no-reports.com'
            });

        const projectId = createProjectResponse.body.id;

        const response = await request(app).get(`/projects/${projectId}/reports`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('creates a report for an owned project', async () => {
        const cookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                name: 'Project with reports',
                url: 'https://with-reports.com'
            });

        const projectId = createProjectResponse.body.id;

        const response = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', cookie)
            .send({
                title: 'Homepage audit',
                summary: 'Initial report',
                accessibilityScore: 85,
                performanceScore: 90,
                seoScore: 78,
                uxScore: 82
            });

        expect(response.status).toBe(201);
        expect(response.body.projectId).toBe(projectId);
        expect(response.body.title).toBe('Homepage audit');
        expect(response.body.accessibilityScore).toBe(85);
    });

    it('rejects report creation when not authenticated', async () => {
        const ownerCookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', ownerCookie)
            .send({
                name: 'Protected project',
                url: 'https://protected-reports.com'
            });

        const projectId = createProjectResponse.body.id;

        const response = await request(app)
            .post(`/projects/${projectId}/reports`)
            .send({
                title: 'Blocked report',
                summary: 'Should fail',
                accessibilityScore: 85,
                performanceScore: 90,
                seoScore: 78,
                uxScore: 82
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('rejects report creation by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs('Owner', 'owner@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', ownerCookie)
            .send({
                name: 'Owner project',
                url: 'https://owner-report-project.com'
            });

        const projectId = createProjectResponse.body.id;

        const otherUserCookie = await registerAndLoginAs('Other user', 'other@example.com');

        const response = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', otherUserCookie)
            .send({
                title: 'Blocked report',
                summary: 'Should fail',
                accessibilityScore: 85,
                performanceScore: 90,
                seoScore: 78,
                uxScore: 82
            });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
    });

    it('returns reports for a project', async () => {
        const cookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                name: 'Project with reports',
                url: 'https://project-reports.com'
            });

        const projectId = createProjectResponse.body.id;

        await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', cookie)
            .send({
                title: 'Homepage audit',
                summary: 'Initial report',
                accessibilityScore: 85,
                performanceScore: 90,
                seoScore: 78,
                uxScore: 82
            });

        const response = await request(app).get(`/projects/${projectId}/reports`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].projectId).toBe(projectId);
        expect(response.body[0].title).toBe('Homepage audit');
    });

    it('returns a report by id', async () => {
        const cookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                name: 'Single report project',
                url: 'https://single-report.com'
            });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', cookie)
            .send({
                title: 'Single report',
                summary: 'Single report summary',
                accessibilityScore: 81,
                performanceScore: 82,
                seoScore: 83,
                uxScore: 84
            });

        const reportId = createReportResponse.body.id;

        const response = await request(app).get(`/reports/${reportId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(reportId);
        expect(response.body.title).toBe('Single report');
    });

    it('returns 404 for a missing report', async () => {
        const response = await request(app).get(
            '/reports/22222222-2222-2222-2222-222222222222'
        );

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Report not found'
        });
    });

    it('updates a report when owned by the authenticated user', async () => {
        const cookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                name: 'Update report project',
                url: 'https://update-report.com'
            });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', cookie)
            .send({
                title: 'Old report title',
                summary: 'Old summary',
                accessibilityScore: 70,
                performanceScore: 71,
                seoScore: 72,
                uxScore: 73
            });

        const reportId = createReportResponse.body.id;

        const response = await request(app)
            .patch(`/reports/${reportId}`)
            .set('Cookie', cookie)
            .send({
                title: 'New report title',
                performanceScore: 95
            });

        expect(response.status).toBe(200);
        expect(response.body.title).toBe('New report title');
        expect(response.body.performanceScore).toBe(95);
        expect(response.body.summary).toBe('Old summary');
    });

    it('rejects report update when not authenticated', async () => {
        const cookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                name: 'Blocked update project',
                url: 'https://blocked-update-report.com'
            });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', cookie)
            .send({
                title: 'Old report title',
                summary: 'Old summary',
                accessibilityScore: 70,
                performanceScore: 71,
                seoScore: 72,
                uxScore: 73
            });

        const reportId = createReportResponse.body.id;

        const response = await request(app)
            .patch(`/reports/${reportId}`)
            .send({
                title: 'Blocked change'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('rejects report update by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs('Owner', 'owner@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', ownerCookie)
            .send({
                name: 'Owner report project',
                url: 'https://owner-update-report.com'
            });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', ownerCookie)
            .send({
                title: 'Owner report',
                summary: 'Owner summary',
                accessibilityScore: 70,
                performanceScore: 71,
                seoScore: 72,
                uxScore: 73
            });

        const reportId = createReportResponse.body.id;

        const otherUserCookie = await registerAndLoginAs('Other user', 'other@example.com');

        const response = await request(app)
            .patch(`/reports/${reportId}`)
            .set('Cookie', otherUserCookie)
            .send({
                title: 'Blocked update'
            });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
    });

    it('deletes a report when owned by the authenticated user', async () => {
        const cookie = await registerAndLoginAs('Phil', 'phil@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                name: 'Delete report project',
                url: 'https://delete-report.com'
            });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', cookie)
            .send({
                title: 'Delete me',
                summary: 'Delete summary',
                accessibilityScore: 70,
                performanceScore: 71,
                seoScore: 72,
                uxScore: 73
            });

        const reportId = createReportResponse.body.id;

        const deleteResponse = await request(app)
            .delete(`/reports/${reportId}`)
            .set('Cookie', cookie);

        expect(deleteResponse.status).toBe(204);

        const getResponse = await request(app).get(`/reports/${reportId}`);
        expect(getResponse.status).toBe(404);
    });

    it('rejects report deletion by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs('Owner', 'owner@example.com');

        const createProjectResponse = await request(app)
            .post('/projects')
            .set('Cookie', ownerCookie)
            .send({
                name: 'Owner delete report project',
                url: 'https://owner-delete-report.com'
            });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', ownerCookie)
            .send({
                title: 'Owner report',
                summary: 'Owner summary',
                accessibilityScore: 70,
                performanceScore: 71,
                seoScore: 72,
                uxScore: 73
            });

        const reportId = createReportResponse.body.id;

        const otherUserCookie = await registerAndLoginAs('Other user', 'other@example.com');

        const response = await request(app)
            .delete(`/reports/${reportId}`)
            .set('Cookie', otherUserCookie);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
    });
});