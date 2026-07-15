import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/database.js';
import { clearTables } from '../test/test-db.js';
import {
    createProject,
    createReport,
    createReportGroup,
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
        seo: 100,
        agenticBrowsing: null
    },
    metrics: {
        pageWeight: {
            value: 1837056,
            unit: 'bytes',
            displayValue: null,
            category: 'performance'
        },
        largestContentfulPaint: {
            value: 1800,
            unit: 'ms',
            displayValue: '1.8 s',
            category: 'performance'
        },
        cumulativeLayoutShift: {
            value: 0.02,
            unit: 'unitless',
            displayValue: '0.02',
            category: 'performance'
        }
    },
    fieldData: null,
    resourceSummary: {
        items: [
            {
                resourceType: 'total',
                label: 'Total',
                requestCount: 24,
                transferSize: 1837056
            },
            {
                resourceType: 'script',
                label: 'Script',
                requestCount: 5,
                transferSize: 612448
            },
            {
                resourceType: 'image',
                label: 'Image',
                requestCount: 8,
                transferSize: 874320
            }
        ]
    },
    domSize: {
        totalElements: 932,
        maxDepth: 17,
        maxChildElements: 42,
        displayValue: '932 elements'
    },
    opportunities: [
        {
            id: 'render-blocking-resources',
            title: 'Eliminate render-blocking resources',
            displayValue: 'Potential savings of 520 ms',
            score: 0.71,
            overallSavingsMs: 520
        }
    ],
    auditRefs: [
        {
            id: 'tap-targets',
            title: 'Tap targets are not sized appropriately',
            category: 'seo',
            severity: 'fail',
            displayValue: null,
            score: 0
        }
    ],
    userTimings: [
        {
            name: 'app:hydrate',
            entryType: 'measure',
            startTime: 690,
            duration: 850,
            displayValue: '850 ms'
        },
        {
            name: 'app:ready',
            entryType: 'mark',
            startTime: 3200,
            duration: null,
            displayValue: '3.2 s'
        }
    ]
};

async function createOwnedProjectWithGroup(email = 'phil@example.com') {
    const cookie = await registerAndLoginAs({
        name: 'Phil',
        email
    });

    const createProjectResponse = await createProject({
        cookie,
        name: 'Report project',
        url: 'https://report-project.com'
    });

    const projectId = createProjectResponse.body.id;
    const createGroupResponse = await createReportGroup({
        cookie,
        projectId,
        name: 'Homepage mobile',
        pageUrl: 'https://report-project.com/',
        strategy: 'mobile'
    });

    return {
        cookie,
        projectId,
        group: createGroupResponse.body
    };
}

function buildReportBody(groupId: string, overrides: Record<string, unknown> = {}) {
    return {
        groupId,
        title: 'Homepage audit',
        summary: 'Initial report',
        pageUrl: 'https://report-project.com/',
        accessibilityScore: 85,
        performanceScore: 90,
        seoScore: 78,
        bestPracticesScore: 92,
        agenticBrowsingScore: 80,
        ...overrides
    };
}

function buildInsightsWithUserTimings(hydrateDuration: number, readyStartTime: number) {
    return {
        ...validInsights,
        userTimings: [
            {
                name: 'app:hydrate',
                entryType: 'measure',
                startTime: 690,
                duration: hydrateDuration,
                displayValue: `${hydrateDuration} ms`
            },
            {
                name: 'app:ready',
                entryType: 'mark',
                startTime: readyStartTime,
                duration: null,
                displayValue: `${(readyStartTime / 1000).toFixed(1)} s`
            }
        ]
    };
}

async function setReportCreatedAt(reportId: string, createdAt: string) {
    await pool.query(
        `
            UPDATE reports
            SET created_at = $1
            WHERE id = $2
        `,
        [createdAt, reportId]
    );
}

describe('Report routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('creates and lists report groups for an owned project', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();

        expect(group.projectId).toBe(projectId);
        expect(group.name).toBe('Homepage mobile');
        expect(group.pageUrl).toBe('https://report-project.com/');
        expect(group.strategy).toBe('mobile');
        expect(group.createdAt).toEqual(expect.any(String));

        const response = await request(app)
            .get(`/projects/${projectId}/report-groups`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([group]);
    });

    it('validates report group create requests', async () => {
        const { cookie, projectId } = await createOwnedProjectWithGroup();

        const testCases = [
            {
                name: '',
                pageUrl: 'https://example.com/',
                strategy: 'mobile'
            },
            {
                name: 'Homepage mobile',
                pageUrl: 'http://localhost:3000/',
                strategy: 'mobile'
            },
            {
                name: 'Homepage mobile',
                pageUrl: 'https://example.com/',
                strategy: 'tablet'
            }
        ];

        for (const body of testCases) {
            const response = await request(app)
                .post(`/projects/${projectId}/report-groups`)
                .set('Cookie', cookie)
                .send(body);

            expect(response.status).toBe(400);
        }
    });

    it('requires authentication and shares report group administration', async () => {
        const { projectId } = await createOwnedProjectWithGroup();

        const unauthenticatedResponse = await request(app)
            .get(`/projects/${projectId}/report-groups`);

        expect(unauthenticatedResponse.status).toBe(401);

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other@example.com'
        });

        const sharedResponse = await request(app)
            .post(`/projects/${projectId}/report-groups`)
            .set('Cookie', otherUserCookie)
            .send({
                name: 'Pricing mobile',
                pageUrl: 'https://report-project.com/pricing',
                strategy: 'mobile'
            });

        expect(sharedResponse.status).toBe(201);
        expect(sharedResponse.body.name).toBe('Pricing mobile');
    });

    it('returns an empty paginated list when a project has no reports', async () => {
        const { cookie, projectId } = await createOwnedProjectWithGroup();

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

    it('creates a report with group details, page URL, five scores, and no uxScore', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();

        const response = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage audit',
            summary: 'Initial report',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80
        });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            projectId,
            groupId: group.id,
            group: {
                id: group.id,
                name: 'Homepage mobile',
                pageUrl: 'https://report-project.com/',
                strategy: 'mobile'
            },
            title: 'Homepage audit',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80,
            insights: null
        });
        expect(response.body.createdAt).toEqual(expect.any(String));
        expect(response.body).not.toHaveProperty('uxScore');
    });

    it('requires groupId, pageUrl, and all five scores when creating reports', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const requiredFields = [
            'groupId',
            'pageUrl',
            'accessibilityScore',
            'performanceScore',
            'seoScore',
            'bestPracticesScore',
            'agenticBrowsingScore'
        ];

        for (const field of requiredFields) {
            const body: Record<string, unknown> = buildReportBody(group.id);
            delete body[field];

            const response = await request(app)
                .post(`/projects/${projectId}/reports`)
                .set('Cookie', cookie)
                .send(body);

            expect(response.status).toBe(400);
        }
    });

    it('rejects invalid scores and removed uxScore on create', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const testCases = [
            buildReportBody(group.id, {
                performanceScore: 90.5
            }),
            buildReportBody(group.id, {
                seoScore: 101
            }),
            buildReportBody(group.id, {
                uxScore: 82
            })
        ];

        for (const body of testCases) {
            const response = await request(app)
                .post(`/projects/${projectId}/reports`)
                .set('Cookie', cookie)
                .send(body);

            expect(response.status).toBe(400);
        }
    });

    it('creates a report with optional PageSpeed insights', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();

        const response = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage audit',
            summary: 'Initial report',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 98,
            performanceScore: 94,
            seoScore: 100,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80,
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
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();

        const response = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage audit',
            summary: 'Initial report',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 98,
            performanceScore: 94,
            seoScore: 100,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80,
            insights: {
                source: 'PAGESPEED'
            }
        });

        expect(response.status).toBe(400);
    });

    it('rejects malformed report resource summary insights on create', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();

        const response = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage audit',
            summary: 'Initial report',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 98,
            performanceScore: 94,
            seoScore: 100,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80,
            insights: {
                ...validInsights,
                resourceSummary: {
                    items: [
                        {
                            resourceType: 'video',
                            label: 'Video',
                            requestCount: 1,
                            transferSize: 1000000
                        }
                    ]
                }
            }
        });

        expect(response.status).toBe(400);
    });

    it('rejects reports created with a group from another project', async () => {
        const { cookie, projectId } = await createOwnedProjectWithGroup();
        const otherProjectResponse = await createProject({
            cookie,
            name: 'Other project',
            url: 'https://other-project.com'
        });
        const otherGroupResponse = await createReportGroup({
            cookie,
            projectId: otherProjectResponse.body.id,
            name: 'Other homepage mobile',
            pageUrl: 'https://other-project.com/',
            strategy: 'mobile'
        });

        const response = await request(app)
            .post(`/projects/${projectId}/reports`)
            .set('Cookie', cookie)
            .send(buildReportBody(otherGroupResponse.body.id));

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Report group not found'
        });
    });

    it('filters project reports by groupId', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const secondGroupResponse = await createReportGroup({
            cookie,
            projectId,
            name: 'Pricing mobile',
            pageUrl: 'https://report-project.com/pricing',
            strategy: 'mobile'
        });

        await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage audit',
            summary: 'Homepage report',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80
        });
        await createReport({
            cookie,
            projectId,
            groupId: secondGroupResponse.body.id,
            title: 'Pricing audit',
            summary: 'Pricing report',
            pageUrl: 'https://report-project.com/pricing',
            accessibilityScore: 86,
            performanceScore: 91,
            seoScore: 79,
            bestPracticesScore: 93,
            agenticBrowsingScore: 81
        });

        const response = await request(app)
            .get(`/projects/${projectId}/reports?groupId=${secondGroupResponse.body.id}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toBe('Pricing audit');
        expect(response.body.data[0].groupId).toBe(secondGroupResponse.body.id);
        expect(response.body.pagination.total).toBe(1);
    });

    it('validates report list groupId filters', async () => {
        const { cookie, projectId } = await createOwnedProjectWithGroup();

        const invalidResponse = await request(app)
            .get(`/projects/${projectId}/reports?groupId=not-a-uuid`)
            .set('Cookie', cookie);

        expect(invalidResponse.status).toBe(400);

        const otherProjectResponse = await createProject({
            cookie,
            name: 'Filter other project',
            url: 'https://filter-other-project.com'
        });
        const otherGroupResponse = await createReportGroup({
            cookie,
            projectId: otherProjectResponse.body.id,
            name: 'Other group',
            pageUrl: 'https://filter-other-project.com/',
            strategy: 'desktop'
        });

        const inaccessibleResponse = await request(app)
            .get(`/projects/${projectId}/reports?groupId=${otherGroupResponse.body.id}`)
            .set('Cookie', cookie);

        expect(inaccessibleResponse.status).toBe(404);
        expect(inaccessibleResponse.body).toEqual({
            error: 'Report group not found'
        });
    });

    it('returns report group trends with full history ordered oldest to newest', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const emptyGroupResponse = await createReportGroup({
            cookie,
            projectId,
            name: 'Homepage desktop',
            pageUrl: 'https://report-project.com/',
            strategy: 'desktop'
        });
        const olderReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'June baseline',
            summary: 'June baseline',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 97,
            performanceScore: 68,
            seoScore: 100,
            bestPracticesScore: 86,
            agenticBrowsingScore: 82,
            insights: {
                ...validInsights,
                metrics: {
                    ...validInsights.metrics,
                    pageWeight: {
                        value: 2162688,
                        unit: 'bytes',
                        displayValue: null,
                        category: 'performance'
                    }
                },
                resourceSummary: {
                    items: [
                        {
                            resourceType: 'total',
                            label: 'Total',
                            requestCount: 26,
                            transferSize: 2162688
                        },
                        {
                            resourceType: 'script',
                            label: 'Script',
                            requestCount: 6,
                            transferSize: 700000
                        }
                    ]
                },
                domSize: {
                    totalElements: 1040,
                    maxDepth: 18,
                    maxChildElements: 45,
                    displayValue: '1,040 elements'
                }
            }
        });
        const newerReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'July snapshot',
            summary: 'July snapshot',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 97,
            performanceScore: 75,
            seoScore: 98,
            bestPracticesScore: 90,
            agenticBrowsingScore: 79,
            insights: validInsights
        });

        await setReportCreatedAt(newerReportResponse.body.id, '2026-07-08T09:30:00.000Z');
        await setReportCreatedAt(olderReportResponse.body.id, '2026-06-08T09:30:00.000Z');

        const response = await request(app)
            .get(`/projects/${projectId}/report-group-trends`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                groupId: emptyGroupResponse.body.id,
                groupName: 'Homepage desktop',
                pageUrl: 'https://report-project.com/',
                strategy: 'desktop',
                points: []
            },
            {
                groupId: group.id,
                groupName: 'Homepage mobile',
                pageUrl: 'https://report-project.com/',
                strategy: 'mobile',
                points: [
                    {
                        id: olderReportResponse.body.id,
                        title: 'June baseline',
                        pageUrl: 'https://report-project.com/',
                        createdAt: '2026-06-08T09:30:00.000Z',
                        performanceScore: 68,
                        accessibilityScore: 97,
                        seoScore: 100,
                        bestPracticesScore: 86,
                        agenticBrowsingScore: 82,
                        technicalMetrics: {
                            pageWeightBytes: 2162688,
                            domNodes: 1040,
                            resources: [
                                {
                                    resourceType: 'total',
                                    label: 'Total',
                                    requestCount: 26,
                                    transferSize: 2162688
                                },
                                {
                                    resourceType: 'script',
                                    label: 'Script',
                                    requestCount: 6,
                                    transferSize: 700000
                                }
                            ]
                        }
                    },
                    {
                        id: newerReportResponse.body.id,
                        title: 'July snapshot',
                        pageUrl: 'https://report-project.com/',
                        createdAt: '2026-07-08T09:30:00.000Z',
                        performanceScore: 75,
                        accessibilityScore: 97,
                        seoScore: 98,
                        bestPracticesScore: 90,
                        agenticBrowsingScore: 79,
                        technicalMetrics: {
                            pageWeightBytes: 1837056,
                            domNodes: 932,
                            resources: [
                                {
                                    resourceType: 'total',
                                    label: 'Total',
                                    requestCount: 24,
                                    transferSize: 1837056
                                },
                                {
                                    resourceType: 'script',
                                    label: 'Script',
                                    requestCount: 5,
                                    transferSize: 612448
                                },
                                {
                                    resourceType: 'image',
                                    label: 'Image',
                                    requestCount: 8,
                                    transferSize: 874320
                                }
                            ]
                        }
                    }
                ]
            }
        ]);
    });

    it('filters report group trends by groupId', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const secondGroupResponse = await createReportGroup({
            cookie,
            projectId,
            name: 'Pricing mobile',
            pageUrl: 'https://report-project.com/pricing',
            strategy: 'mobile'
        });

        await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage trend point',
            summary: 'Homepage trend point',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 97,
            performanceScore: 75,
            seoScore: 98,
            bestPracticesScore: 90,
            agenticBrowsingScore: 79
        });

        const response = await request(app)
            .get(`/projects/${projectId}/report-group-trends?groupId=${secondGroupResponse.body.id}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                groupId: secondGroupResponse.body.id,
                groupName: 'Pricing mobile',
                pageUrl: 'https://report-project.com/pricing',
                strategy: 'mobile',
                points: []
            }
        ]);
    });

    it('validates report group trend filters and shares trend access', async () => {
        const { cookie, projectId } = await createOwnedProjectWithGroup();

        const invalidResponse = await request(app)
            .get(`/projects/${projectId}/report-group-trends?groupId=not-a-uuid`)
            .set('Cookie', cookie);

        expect(invalidResponse.status).toBe(400);

        const otherProjectResponse = await createProject({
            cookie,
            name: 'Trend other project',
            url: 'https://trend-other-project.com'
        });
        const otherGroupResponse = await createReportGroup({
            cookie,
            projectId: otherProjectResponse.body.id,
            name: 'Other trend group',
            pageUrl: 'https://trend-other-project.com/',
            strategy: 'desktop'
        });

        const inaccessibleResponse = await request(app)
            .get(`/projects/${projectId}/report-group-trends?groupId=${otherGroupResponse.body.id}`)
            .set('Cookie', cookie);

        expect(inaccessibleResponse.status).toBe(404);
        expect(inaccessibleResponse.body).toEqual({
            error: 'Report group not found'
        });

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'trend-other@example.com'
        });
        const sharedResponse = await request(app)
            .get(`/projects/${projectId}/report-group-trends`)
            .set('Cookie', otherUserCookie);

        expect(sharedResponse.status).toBe(200);
        expect(sharedResponse.body).toEqual(expect.any(Array));
    });

    it('keeps existing search and title sorting behaviour', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();

        await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Zoo audit',
            summary: 'Last alphabetically',
            pageUrl: 'https://report-project.com/zoo',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80
        });
        await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Alpha audit',
            summary: 'First alphabetically checkout flow',
            pageUrl: 'https://report-project.com/alpha',
            accessibilityScore: 85,
            performanceScore: 90,
            seoScore: 78,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80
        });

        const response = await request(app)
            .get(`/projects/${projectId}/reports?search=checkout&sort=title&order=asc`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toBe('Alpha audit');
    });

    it('returns an owned report by id', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const createReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Single report',
            summary: 'Single report summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 81,
            performanceScore: 82,
            seoScore: 83,
            bestPracticesScore: 84,
            agenticBrowsingScore: 85
        });

        const response = await request(app)
            .get(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createReportResponse.body.id);
        expect(response.body.group.id).toBe(group.id);
    });

    it('returns null comparison for the first report in a group', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const createReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Baseline report',
            summary: 'Baseline summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 90,
            performanceScore: 70,
            seoScore: 98,
            bestPracticesScore: 88,
            agenticBrowsingScore: 80
        });

        const response = await request(app)
            .get(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.comparison).toBeNull();
    });

    it('returns score and User Timing comparisons against the previous same-group report', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const baselineResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage mobile - June baseline',
            summary: 'Baseline summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 97,
            performanceScore: 68,
            seoScore: 100,
            bestPracticesScore: 86,
            agenticBrowsingScore: 82,
            insights: buildInsightsWithUserTimings(1270, 3000)
        });
        const latestResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Homepage mobile - July snapshot',
            summary: 'Latest summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 97,
            performanceScore: 75,
            seoScore: 98,
            bestPracticesScore: 90,
            agenticBrowsingScore: 79,
            insights: buildInsightsWithUserTimings(850, 3200)
        });

        await setReportCreatedAt(baselineResponse.body.id, '2026-06-08T09:30:00.000Z');
        await setReportCreatedAt(latestResponse.body.id, '2026-07-08T09:30:00.000Z');

        const response = await request(app)
            .get(`/reports/${latestResponse.body.id}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.comparison).toEqual({
            previousReportId: baselineResponse.body.id,
            previousCreatedAt: '2026-06-08T09:30:00.000Z',
            scores: {
                performanceScore: 7,
                accessibilityScore: 0,
                seoScore: -2,
                bestPracticesScore: 4,
                agenticBrowsingScore: -3
            },
            userTimings: [
                {
                    name: 'app:hydrate',
                    entryType: 'measure',
                    currentValue: 850,
                    previousValue: 1270,
                    delta: -420,
                    unit: 'ms',
                    previousReportId: baselineResponse.body.id,
                    previousCreatedAt: '2026-06-08T09:30:00.000Z'
                },
                {
                    name: 'app:ready',
                    entryType: 'mark',
                    currentValue: 3200,
                    previousValue: 3000,
                    delta: 200,
                    unit: 'ms',
                    previousReportId: baselineResponse.body.id,
                    previousCreatedAt: '2026-06-08T09:30:00.000Z'
                }
            ]
        });
    });

    it('keeps comparisons scoped to the same group', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const secondGroupResponse = await createReportGroup({
            cookie,
            projectId,
            name: 'Homepage desktop',
            pageUrl: 'https://report-project.com/',
            strategy: 'desktop'
        });
        const otherGroupReportResponse = await createReport({
            cookie,
            projectId,
            groupId: secondGroupResponse.body.id,
            title: 'Desktop baseline',
            summary: 'Desktop baseline',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 90,
            performanceScore: 90,
            seoScore: 90,
            bestPracticesScore: 90,
            agenticBrowsingScore: 90
        });
        const firstGroupReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Mobile first report',
            summary: 'Mobile first report',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 80,
            performanceScore: 80,
            seoScore: 80,
            bestPracticesScore: 80,
            agenticBrowsingScore: 80
        });

        await setReportCreatedAt(otherGroupReportResponse.body.id, '2026-06-08T09:30:00.000Z');
        await setReportCreatedAt(firstGroupReportResponse.body.id, '2026-07-08T09:30:00.000Z');

        const response = await request(app)
            .get(`/reports/${firstGroupReportResponse.body.id}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.comparison).toBeNull();
    });

    it('compares against the true previous report outside pagination and search results', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const baselineResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'June baseline',
            summary: 'Hidden by search',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 90,
            performanceScore: 70,
            seoScore: 90,
            bestPracticesScore: 90,
            agenticBrowsingScore: 90
        });
        const latestResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'July target',
            summary: 'Visible target',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 91,
            performanceScore: 75,
            seoScore: 89,
            bestPracticesScore: 90,
            agenticBrowsingScore: 92
        });

        await setReportCreatedAt(baselineResponse.body.id, '2026-06-08T09:30:00.000Z');
        await setReportCreatedAt(latestResponse.body.id, '2026-07-08T09:30:00.000Z');

        const response = await request(app)
            .get(`/projects/${projectId}/reports?search=target&limit=1`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe(latestResponse.body.id);
        expect(response.body.data[0].comparison.previousReportId).toBe(baselineResponse.body.id);
        expect(response.body.data[0].comparison.scores).toEqual({
            performanceScore: 5,
            accessibilityScore: 1,
            seoScore: -1,
            bestPracticesScore: 0,
            agenticBrowsingScore: 2
        });
    });

    it('updates report fields without replacing stored insights', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const secondGroupResponse = await createReportGroup({
            cookie,
            projectId,
            name: 'Homepage desktop',
            pageUrl: 'https://report-project.com/',
            strategy: 'desktop'
        });
        const createReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Old report title',
            summary: 'Old summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            bestPracticesScore: 73,
            agenticBrowsingScore: 74,
            insights: validInsights
        });

        const response = await request(app)
            .patch(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie)
            .send({
                groupId: secondGroupResponse.body.id,
                title: 'New report title',
                summary: 'New summary',
                pageUrl: 'https://report-project.com/',
                accessibilityScore: 90,
                performanceScore: 95,
                seoScore: 96,
                bestPracticesScore: 97,
                agenticBrowsingScore: 88
            });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            groupId: secondGroupResponse.body.id,
            title: 'New report title',
            summary: 'New summary',
            accessibilityScore: 90,
            performanceScore: 95,
            seoScore: 96,
            bestPracticesScore: 97,
            agenticBrowsingScore: 88,
            insights: validInsights
        });
        expect(response.body.group.strategy).toBe('desktop');
        expect(response.body).not.toHaveProperty('uxScore');
    });

    it('rejects report updates that include insights', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const createReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Old report title',
            summary: 'Old summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            bestPracticesScore: 73,
            agenticBrowsingScore: 74
        });

        const response = await request(app)
            .patch(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie)
            .send({
                ...buildReportBody(group.id),
                insights: validInsights
            });

        expect(response.status).toBe(400);
    });

    it('protects report routes with authentication and shares result administration', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const createReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Owner report',
            summary: 'Owner summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            bestPracticesScore: 73,
            agenticBrowsingScore: 74
        });

        const unauthenticatedListResponse = await request(app)
            .get(`/projects/${projectId}/reports`);
        const unauthenticatedUpdateResponse = await request(app)
            .patch(`/reports/${createReportResponse.body.id}`)
            .send(buildReportBody(group.id));

        expect(unauthenticatedListResponse.status).toBe(401);
        expect(unauthenticatedUpdateResponse.status).toBe(401);

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other@example.com'
        });

        const sharedListResponse = await request(app)
            .get(`/projects/${projectId}/reports`)
            .set('Cookie', otherUserCookie);
        const sharedReadResponse = await request(app)
            .get(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', otherUserCookie);
        const sharedDeleteResponse = await request(app)
            .delete(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', otherUserCookie);

        expect(sharedListResponse.status).toBe(200);
        expect(sharedListResponse.body.data).toHaveLength(1);
        expect(sharedReadResponse.status).toBe(200);
        expect(sharedReadResponse.body.id).toBe(createReportResponse.body.id);
        expect(sharedDeleteResponse.status).toBe(204);
    });

    it('deletes a report when owned by the authenticated user', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const createReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Delete me',
            summary: 'Delete summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            bestPracticesScore: 73,
            agenticBrowsingScore: 74
        });

        const deleteResponse = await request(app)
            .delete(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie);

        expect(deleteResponse.status).toBe(204);

        const getResponse = await request(app)
            .get(`/reports/${createReportResponse.body.id}`)
            .set('Cookie', cookie);

        expect(getResponse.status).toBe(404);
    });

    it('archives and restores a report without hard deleting it', async () => {
        const { cookie, projectId, group } = await createOwnedProjectWithGroup();
        const createReportResponse = await createReport({
            cookie,
            projectId,
            groupId: group.id,
            title: 'Archive report',
            summary: 'Archive summary',
            pageUrl: 'https://report-project.com/',
            accessibilityScore: 70,
            performanceScore: 71,
            seoScore: 72,
            bestPracticesScore: 73,
            agenticBrowsingScore: 74
        });
        const reportId = createReportResponse.body.id;

        const archiveResponse = await request(app)
            .post(`/reports/${reportId}/archive`)
            .set('Cookie', cookie);

        expect(archiveResponse.status).toBe(200);
        expect(archiveResponse.body.archivedAt).toEqual(expect.any(String));

        const activeListResponse = await request(app)
            .get(`/projects/${projectId}/reports`)
            .set('Cookie', cookie);
        const archivedListResponse = await request(app)
            .get(`/projects/${projectId}/reports?status=archived`)
            .set('Cookie', cookie);
        const detailResponse = await request(app)
            .get(`/reports/${reportId}`)
            .set('Cookie', cookie);

        expect(activeListResponse.status).toBe(200);
        expect(activeListResponse.body.data).toEqual([]);
        expect(archivedListResponse.status).toBe(200);
        expect(archivedListResponse.body.data).toHaveLength(1);
        expect(archivedListResponse.body.data[0].id).toBe(reportId);
        expect(detailResponse.status).toBe(200);
        expect(detailResponse.body.archivedAt).toEqual(expect.any(String));

        const restoreResponse = await request(app)
            .post(`/reports/${reportId}/restore`)
            .set('Cookie', cookie);

        expect(restoreResponse.status).toBe(200);
        expect(restoreResponse.body.archivedAt).toBeNull();
    });
});
