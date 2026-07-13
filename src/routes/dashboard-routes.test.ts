import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { clearTables } from '../test/test-db.js';
import {
    createClient,
    createProject,
    createReport,
    createReportGroup,
    registerAndLoginAs
} from '../test/test-helpers.js';

describe('Dashboard routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('returns recent shared workspace activity with navigation context', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'dashboard-owner@example.com'
        });
        const clientResponse = await createClient({
            cookie: ownerCookie,
            name: 'Dashboard client'
        });
        const projectResponse = await createProject({
            cookie: ownerCookie,
            name: 'Dashboard project',
            url: 'https://dashboard-project.example',
            clientId: clientResponse.body.id
        });
        const groupResponse = await createReportGroup({
            cookie: ownerCookie,
            projectId: projectResponse.body.id,
            name: 'Homepage mobile',
            pageUrl: 'https://dashboard-project.example/',
            strategy: 'mobile'
        });
        const reportResponse = await createReport({
            cookie: ownerCookie,
            projectId: projectResponse.body.id,
            groupId: groupResponse.body.id,
            title: 'Dashboard result',
            summary: 'Dashboard result summary',
            pageUrl: 'https://dashboard-project.example/',
            accessibilityScore: 96,
            performanceScore: 91,
            seoScore: 98,
            bestPracticesScore: 94,
            agenticBrowsingScore: 88
        });
        const adminCookie = await registerAndLoginAs({
            name: 'Admin',
            email: 'dashboard-admin@example.com'
        });

        const response = await request(app)
            .get('/dashboard')
            .set('Cookie', adminCookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            clients: [
                {
                    id: clientResponse.body.id,
                    name: 'Dashboard client',
                    createdAt: clientResponse.body.createdAt
                }
            ],
            projects: [
                {
                    id: projectResponse.body.id,
                    name: 'Dashboard project',
                    clientId: clientResponse.body.id,
                    clientName: 'Dashboard client',
                    createdAt: projectResponse.body.createdAt
                }
            ],
            results: [
                {
                    id: reportResponse.body.id,
                    title: 'Dashboard result',
                    projectId: projectResponse.body.id,
                    projectName: 'Dashboard project',
                    clientId: clientResponse.body.id,
                    clientName: 'Dashboard client',
                    createdAt: reportResponse.body.createdAt
                }
            ]
        });
    });

    it('returns empty activity collections for an empty workspace', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Admin',
            email: 'empty-dashboard@example.com'
        });

        const response = await request(app)
            .get('/dashboard')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            clients: [],
            projects: [],
            results: []
        });
    });

    it('rejects unauthenticated dashboard access', async () => {
        const response = await request(app).get('/dashboard');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });
});
