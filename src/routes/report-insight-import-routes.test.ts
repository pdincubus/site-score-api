import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app.js';
import { clearPageSpeedImportCache } from '../services/report-insight-import-service.js';
import { clearTables } from '../test/test-db.js';
import {
    createProject,
    registerAndLoginAs
} from '../test/test-helpers.js';

function createPageSpeedResponse() {
    return {
        lighthouseResult: {
            finalDisplayedUrl: 'https://example.com/',
            finalUrl: 'https://example.com/',
            lighthouseVersion: '13.0.0',
            categories: {
                performance: {
                    score: 0.94,
                    auditRefs: [
                        {
                            id: 'uses-long-cache-ttl'
                        }
                    ]
                },
                accessibility: {
                    score: 0.98
                },
                'best-practices': {
                    score: 0.92
                },
                seo: {
                    score: 1,
                    auditRefs: [
                        {
                            id: 'tap-targets'
                        }
                    ]
                }
            },
            audits: {
                'total-byte-weight': {
                    numericValue: 1837056,
                    displayValue: '1,794 KiB'
                },
                'largest-contentful-paint': {
                    numericValue: 1800,
                    displayValue: '1.8 s'
                },
                'cumulative-layout-shift': {
                    numericValue: 0.02,
                    displayValue: '0.02'
                },
                'render-blocking-resources': {
                    id: 'render-blocking-resources',
                    title: 'Eliminate render-blocking resources',
                    displayValue: 'Potential savings of 520 ms',
                    score: 0.71,
                    details: {
                        type: 'opportunity',
                        overallSavingsMs: 520
                    }
                },
                'uses-long-cache-ttl': {
                    id: 'uses-long-cache-ttl',
                    title: 'Uses efficient cache policy on static assets',
                    displayValue: '4 resources found',
                    score: 0.5
                },
                'tap-targets': {
                    id: 'tap-targets',
                    title: 'Tap targets are not sized appropriately',
                    score: 0
                },
                'user-timings': {
                    details: {
                        type: 'table',
                        items: [
                            {
                                name: 'app:hydrate',
                                timingType: 'Measure',
                                startTime: 690,
                                duration: 850
                            }
                        ]
                    }
                }
            }
        }
    };
}

describe('Report insight import routes', () => {
    beforeEach(async () => {
        clearPageSpeedImportCache();
        vi.unstubAllGlobals();
        await clearTables();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        clearPageSpeedImportCache();
    });

    it('imports PageSpeed insights for an owned project without creating a report', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(createPageSpeedResponse()), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-import@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Import project',
            url: 'https://import-project.com'
        });

        const projectId = createProjectResponse.body.id;

        const response = await request(app)
            .post(`/projects/${projectId}/report-insight-imports`)
            .set('Cookie', cookie)
            .send({
                source: 'PAGESPEED',
                url: ' https://example.com/ ',
                strategy: 'mobile'
            });

        expect(response.status).toBe(200);
        expect(response.body.source).toBe('PAGESPEED');
        expect(response.body.strategy).toBe('mobile');
        expect(response.body.testedUrl).toBe('https://example.com/');
        expect(response.body.scores.performance).toBe(94);
        expect(response.body.scores.agenticBrowsing).toBeNull();
        expect(response.body.metrics.pageWeight).toEqual({
            value: 1837056,
            unit: 'bytes',
            displayValue: '1,794 KiB',
            category: 'performance'
        });
        expect(response.body.metrics.largestContentfulPaint).toEqual({
            value: 1800,
            unit: 'ms',
            displayValue: '1.8 s',
            category: 'performance'
        });
        expect(response.body.opportunities).toHaveLength(1);
        expect(response.body.auditRefs).toEqual([
            {
                id: 'uses-long-cache-ttl',
                title: 'Uses efficient cache policy on static assets',
                category: 'performance',
                severity: 'warning',
                displayValue: '4 resources found',
                score: 0.5
            },
            {
                id: 'tap-targets',
                title: 'Tap targets are not sized appropriately',
                category: 'seo',
                severity: 'fail',
                displayValue: null,
                score: 0
            }
        ]);
        expect(response.body.userTimings).toEqual([
            {
                name: 'app:hydrate',
                entryType: 'measure',
                startTime: 690,
                duration: 850,
                displayValue: '850 ms'
            }
        ]);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        const reportsResponse = await request(app)
            .get(`/projects/${projectId}/reports`)
            .set('Cookie', cookie);

        expect(reportsResponse.status).toBe(200);
        expect(reportsResponse.body.data).toEqual([]);
    });

    it('caches repeated PageSpeed imports for the same URL and strategy', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(createPageSpeedResponse()), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-import-cache@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Import cache project',
            url: 'https://import-cache-project.com'
        });

        const requestBody = {
            source: 'PAGESPEED',
            url: 'https://example.com/',
            strategy: 'desktop'
        };

        const firstResponse = await request(app)
            .post(`/projects/${createProjectResponse.body.id}/report-insight-imports`)
            .set('Cookie', cookie)
            .send(requestBody);

        const secondResponse = await request(app)
            .post(`/projects/${createProjectResponse.body.id}/report-insight-imports`)
            .set('Cookie', cookie)
            .send(requestBody);

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);
        expect(secondResponse.body).toEqual(firstResponse.body);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects import requests when not authenticated', async () => {
        const response = await request(app)
            .post('/projects/11111111-1111-1111-1111-111111111111/report-insight-imports')
            .send({
                source: 'PAGESPEED',
                url: 'https://example.com/',
                strategy: 'mobile'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('allows imports for a project created by another user', async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify(createPageSpeedResponse()), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        }));
        vi.stubGlobal('fetch', fetchMock);

        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner-import@example.com'
        });

        const createProjectResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner import project',
            url: 'https://owner-import-project.com'
        });

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other',
            email: 'other-import@example.com'
        });

        const response = await request(app)
            .post(`/projects/${createProjectResponse.body.id}/report-insight-imports`)
            .set('Cookie', otherUserCookie)
            .send({
                source: 'PAGESPEED',
                url: 'https://example.com/',
                strategy: 'mobile'
            });

        expect(response.status).toBe(200);
        expect(response.body.source).toBe('PAGESPEED');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns 404 when the import project does not exist', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'missing-import-project@example.com'
        });

        const response = await request(app)
            .post('/projects/11111111-1111-1111-1111-111111111111/report-insight-imports')
            .set('Cookie', cookie)
            .send({
                source: 'PAGESPEED',
                url: 'https://example.com/',
                strategy: 'mobile'
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Project not found'
        });
    });

    it('rejects invalid import request bodies', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'invalid-import-body@example.com'
        });

        const createProjectResponse = await createProject({
            cookie,
            name: 'Invalid import project',
            url: 'https://invalid-import-project.com'
        });

        const testCases = [
            {
                source: 'CRUX',
                url: 'https://example.com/',
                strategy: 'mobile'
            },
            {
                source: 'PAGESPEED',
                url: 'not-a-url',
                strategy: 'mobile'
            },
            {
                source: 'PAGESPEED',
                url: 'https://example.com/',
                strategy: 'tablet'
            },
            {
                source: 'PAGESPEED',
                url: `https://example.com/${'a'.repeat(2049)}`,
                strategy: 'mobile'
            },
            {
                source: 'PAGESPEED',
                url: 'http://localhost:3000/',
                strategy: 'mobile'
            }
        ];

        for (const requestBody of testCases) {
            const response = await request(app)
                .post(`/projects/${createProjectResponse.body.id}/report-insight-imports`)
                .set('Cookie', cookie)
                .send(requestBody);

            expect(response.status).toBe(400);
        }
    });
});
