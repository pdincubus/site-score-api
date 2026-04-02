import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { clearTables } from '../test/test-db.js';
import {
    createProject,
    createReport,
    registerAndLoginAs
} from '../test/test-helpers.js';

describe('Report routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('returns an empty array when a project has no reports', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Project with no reports',
            url: 'https://no-reports.com'
        });

        const projectId = createProjectResponse.body.id;

        const response = await request(app).get(`/projects/${projectId}/reports`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            }
        });
    });

    it('creates a report for an owned project', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Project with reports',
            url: 'https://with-reports.com'
        });

        const projectId = createProjectResponse.body.id;

        const response = await createReport({
            cookie,
            projectId,
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
        const ownerCookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie: ownerCookie,
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
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner@example.com'
        });

        const createProjectResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner project',
            url: 'https://owner-report-project.com'
        });

        const projectId = createProjectResponse.body.id;

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other@example.com'
        });

        const response = await createReport({
            cookie: otherUserCookie,
            projectId,
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
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Project with reports',
            url: 'https://project-reports.com'
        });

        const projectId = createProjectResponse.body.id;

        await createReport({
            cookie,
            projectId,
            title: 'Homepage audit',
            summary: 'Initial report',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            uxScore: 82
        });

        const response = await request(app).get(`/projects/${projectId}/reports`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].projectId).toBe(projectId);
        expect(response.body.data[0].title).toBe('Homepage audit');
    });

    it('returns a report by id', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Single report project',
            url: 'https://single-report.com'
        });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await createReport({
            cookie,
            projectId,
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
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Update report project',
            url: 'https://update-report.com'
        });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await createReport({
            cookie,
            projectId,
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
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Blocked update project',
            url: 'https://blocked-update-report.com'
        });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await createReport({
            cookie,
            projectId,
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
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner@example.com'
        });

        const createProjectResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner report project',
            url: 'https://owner-update-report.com'
        });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await createReport({
            cookie: ownerCookie,
            projectId,
            title: 'Owner report',
            summary: 'Owner summary',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            uxScore: 73
        });

        const reportId = createReportResponse.body.id;

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other@example.com'
        });

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
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Delete report project',
            url: 'https://delete-report.com'
        });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await createReport({
            cookie,
            projectId,
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
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner@example.com'
        });

        const createProjectResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner delete report project',
            url: 'https://owner-delete-report.com'
        });

        const projectId = createProjectResponse.body.id;

        const createReportResponse = await createReport({
            cookie: ownerCookie,
            projectId,
            title: 'Owner report',
            summary: 'Owner summary',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            uxScore: 73
        });

        const reportId = createReportResponse.body.id;

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other@example.com'
        });

        const response = await request(app)
            .delete(`/reports/${reportId}`)
            .set('Cookie', otherUserCookie);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
    });
});