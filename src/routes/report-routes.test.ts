import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { clearTables } from '../test/test-db.js';
import {
    createProject,
    createReport,
    registerAndLoginAs
} from '../test/test-helpers.js';

const validInsights = {
    source: 'PAGESPEED',
    strategy: 'mobile',
    testedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    fetchedAt: '2026-07-07T12:00:00.000Z',
    lighthouseVersion: '13.0.0',
    scores: {
        performance: 94,
        accessibility: 98,
        bestPractices: 92,
        seo: 100
    },
    metrics: {
        largestContentfulPaint: {
            value: 1800,
            unit: 'ms',
            displayValue: '1.8 s',
            category: null
        },
        cumulativeLayoutShift: {
            value: 0.02,
            unit: 'unitless',
            displayValue: '0.02',
            category: null
        }
    },
    fieldData: null,
    opportunities: [
        {
            id: 'render-blocking-resources',
            title: 'Eliminate render-blocking resources',
            displayValue: 'Potential savings of 520 ms',
            score: 0.71,
            overallSavingsMs: 520
        }
    ]
};

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

        const response = await request(app)
            .get(`/projects/${projectId}/reports`)
            .set('Cookie', cookie);

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

    it('rejects report listing when not authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Protected report list project',
            url: 'https://protected-report-list.com'
        });

        const response = await request(app)
            .get(`/projects/${createProjectResponse.body.id}/reports`);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
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

    it('creates a report with optional PageSpeed insights', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-insights-create@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Project with imported insights',
            url: 'https://with-imported-insights.com'
        });

        const projectId = createProjectResponse.body.id;

        const response = await createReport({
            cookie,
            projectId,
            title: 'Homepage audit',
            summary: 'Initial report',
            accessibilityScore: 98,
            performanceScore: 94,
            seoScore: 100,
            uxScore: 82,
            insights: validInsights
        });

        expect(response.status).toBe(201);
        expect(response.body.insights).toEqual(validInsights);

        const listResponse = await request(app)
            .get(`/projects/${projectId}/reports`)
            .set('Cookie', cookie);

        expect(listResponse.status).toBe(200);
        expect(listResponse.body.data[0].insights).toEqual(validInsights);
    });

    it('rejects malformed report insights on create', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-bad-insights-create@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Bad insights project',
            url: 'https://bad-insights-create.com'
        });

        const response = await createReport({
            cookie,
            projectId: createProjectResponse.body.id,
            title: 'Homepage audit',
            summary: 'Initial report',
            accessibilityScore: 98,
            performanceScore: 94,
            seoScore: 100,
            uxScore: 82,
            insights: {
                source: 'PAGESPEED'
            }
        });

        expect(response.status).toBe(400);
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

    it('returns reports for an owned project', async () => {
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

        const response = await request(app)
            .get(`/projects/${projectId}/reports`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].projectId).toBe(projectId);
        expect(response.body.data[0].title).toBe('Homepage audit');
    });

    it('returns an owned report by id', async () => {
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

        const response = await request(app)
            .get(`/reports/${reportId}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(reportId);
        expect(response.body.title).toBe('Single report');
    });

    it('rejects report lookup when not authenticated', async () => {
        const response = await request(app)
            .get('/reports/22222222-2222-2222-2222-222222222222');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('returns 404 for a missing report while authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const response = await request(app)
            .get('/reports/22222222-2222-2222-2222-222222222222')
            .set('Cookie', cookie);

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

    it('updates report insights when owned by the authenticated user', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-insights-update@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Update report insights project',
            url: 'https://update-report-insights.com'
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

        const response = await request(app)
            .patch(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie)
            .send({
                insights: validInsights
            });

        expect(response.status).toBe(200);
        expect(response.body.insights).toEqual(validInsights);
        expect(response.body.title).toBe('Old report title');
    });

    it('rejects malformed report insights on update', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-bad-insights-update@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Bad update insights project',
            url: 'https://bad-update-insights.com'
        });

        const createReportResponse = await createReport({
            cookie,
            projectId: createProjectResponse.body.id,
            title: 'Old report title',
            summary: 'Old summary',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            uxScore: 73
        });

        const response = await request(app)
            .patch(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie)
            .send({
                insights: {
                    source: 'PAGESPEED'
                }
            });

        expect(response.status).toBe(400);
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

        const getResponse = await request(app)
            .get(`/reports/${reportId}`)
            .set('Cookie', cookie);
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

    it('rejects report listing by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner-list-reports@example.com'
        });

        const createProjectResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner report list project',
            url: 'https://owner-report-list-project.com'
        });

        const projectId = createProjectResponse.body.id;

        await createReport({
            cookie: ownerCookie,
            projectId,
            title: 'Owner report',
            summary: 'Owner summary',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            uxScore: 73
        });

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other-list-reports@example.com'
        });

        const response = await request(app)
            .get(`/projects/${projectId}/reports`)
            .set('Cookie', otherUserCookie);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
    });

    it('rejects report lookup by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner-read-report@example.com'
        });

        const createProjectResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner read report project',
            url: 'https://owner-read-report-project.com'
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

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other-read-report@example.com'
        });

        const response = await request(app)
            .get(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', otherUserCookie);

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
    });

    it('filters reports by search term', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });
    
        const createProjectResponse = await createProject({
            cookie,
            name: 'Searchable project',
            url: 'https://searchable-project.com'
        });
    
        const projectId = createProjectResponse.body.id;
    
        await createReport({
            cookie,
            projectId,
            title: 'Homepage audit',
            summary: 'Main landing page review',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            uxScore: 82
        });
    
        await createReport({
            cookie,
            projectId,
            title: 'Checkout audit',
            summary: 'Purchase flow review',
            accessibilityScore: 80,
            performanceScore: 88,
            seoScore: 76,
            uxScore: 79
        });
    
        const response = await request(app).get(
            `/projects/${projectId}/reports?search=checkout`
        ).set('Cookie', cookie);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toBe('Checkout audit');
        expect(response.body.pagination.total).toBe(1);
    });
    
    it('sorts reports by title ascending', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });
    
        const createProjectResponse = await createProject({
            cookie,
            name: 'Sortable reports project',
            url: 'https://sortable-reports.com'
        });
    
        const projectId = createProjectResponse.body.id;
    
        await createReport({
            cookie,
            projectId,
            title: 'Zoo audit',
            summary: 'Last alphabetically',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            uxScore: 82
        });
    
        await createReport({
            cookie,
            projectId,
            title: 'Alpha audit',
            summary: 'First alphabetically',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            uxScore: 82
        });
    
        const response = await request(app).get(
            `/projects/${projectId}/reports?sort=title&order=asc`
        ).set('Cookie', cookie);
    
        expect(response.status).toBe(200);
        expect(response.body.data[0].title).toBe('Alpha audit');
        expect(response.body.data[1].title).toBe('Zoo audit');
    });
});
