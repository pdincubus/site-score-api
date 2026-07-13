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

describe('Project routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('returns an empty array when the authenticated user has no projects', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const response = await request(app)
            .get('/projects')
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

    it('rejects project listing when not authenticated', async () => {
        const response = await request(app).get('/projects');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('rejects project creation when not authenticated', async () => {
        const response = await request(app)
            .post('/projects')
            .send({
                name: 'Blocked project',
                url: 'https://blocked-project.com'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('creates a project when authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const response = await createProject({
            cookie,
            name: 'Test project',
            url: 'https://example.com'
        });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Test project');
        expect(response.body.url).toBe('https://example.com');
        expect(response.body.id).toBeTypeOf('string');
    });

    it('rejects a duplicate project URL when authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        await createProject({
            cookie,
            name: 'First project',
            url: 'https://example.com'
        });

        const response = await createProject({
            cookie,
            name: 'Second project',
            url: 'https://example.com'
        });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            error: 'A project with this URL already exists'
        });
    });

    it('rejects project creation with no name when authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const response = await request(app)
            .post('/projects')
            .set('Cookie', cookie)
            .send({
                url: 'https://example.com'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Name is required'
        });
    });

    it('gets an owned project by id', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createResponse = await createProject({
            cookie,
            name: 'Find me',
            url: 'https://find-me.com'
        });

        const projectId = createResponse.body.id;

        const response = await request(app)
            .get(`/projects/${projectId}`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(projectId);
        expect(response.body.name).toBe('Find me');
    });

    it('rejects project lookup when not authenticated', async () => {
        const response = await request(app)
            .get('/projects/22222222-2222-2222-2222-222222222222');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('returns 404 for a missing project while authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const response = await request(app)
            .get('/projects/22222222-2222-2222-2222-222222222222')
            .set('Cookie', cookie);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Project not found'
        });
    });

    it('rejects project update when not authenticated', async () => {
        const response = await request(app)
            .patch('/projects/22222222-2222-2222-2222-222222222222')
            .send({
                name: 'Blocked update'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('updates a project name when authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createResponse = await createProject({
            cookie,
            name: 'Old name',
            url: 'https://old-name.com'
        });

        const projectId = createResponse.body.id;

        const response = await request(app)
            .patch(`/projects/${projectId}`)
            .set('Cookie', cookie)
            .send({
                name: 'New name'
            });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('New name');
        expect(response.body.url).toBe('https://old-name.com');
    });

    it('assigns a project to a workspace client', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-client-project@example.com'
        });
        const clientResponse = await createClient({
            cookie,
            name: 'Client project owner'
        });

        const createResponse = await createProject({
            cookie,
            name: 'Client site',
            url: 'https://client-site.com',
            clientId: clientResponse.body.id
        });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.clientId).toBe(clientResponse.body.id);

        const updateResponse = await request(app)
            .patch(`/projects/${createResponse.body.id}`)
            .set('Cookie', cookie)
            .send({
                clientId: null
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.clientId).toBeNull();
    });

    it('allows assigning a project to a client created by another user', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'project-client-owner@example.com'
        });
        const clientResponse = await createClient({
            cookie: ownerCookie,
            name: 'Owner client'
        });

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other',
            email: 'project-client-other@example.com'
        });

        const createResponse = await createProject({
            cookie: otherUserCookie,
            name: 'Shared client site',
            url: 'https://shared-client-site.com',
            clientId: clientResponse.body.id
        });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.clientId).toBe(clientResponse.body.id);
    });

    it('archives and restores an owned project without hard deleting it', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-archive-project@example.com'
        });
        const createResponse = await createProject({
            cookie,
            name: 'Archive me',
            url: 'https://archive-project.com'
        });
        const projectId = createResponse.body.id;

        const archiveResponse = await request(app)
            .post(`/projects/${projectId}/archive`)
            .set('Cookie', cookie);

        expect(archiveResponse.status).toBe(200);
        expect(archiveResponse.body.archivedAt).toEqual(expect.any(String));

        const activeListResponse = await request(app)
            .get('/projects')
            .set('Cookie', cookie);
        const archivedListResponse = await request(app)
            .get('/projects?status=archived')
            .set('Cookie', cookie);

        expect(activeListResponse.body.data).toEqual([]);
        expect(archivedListResponse.body.data).toHaveLength(1);
        expect(archivedListResponse.body.data[0]).toMatchObject({
            id: projectId,
            name: 'Archive me'
        });

        const restoreResponse = await request(app)
            .post(`/projects/${projectId}/restore`)
            .set('Cookie', cookie);

        expect(restoreResponse.status).toBe(200);
        expect(restoreResponse.body.archivedAt).toBeNull();
    });

    it('rejects project deletion when not authenticated', async () => {
        const response = await request(app).delete(
            '/projects/22222222-2222-2222-2222-222222222222'
        );

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('deletes a project when authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const createResponse = await createProject({
            cookie,
            name: 'Delete me',
            url: 'https://delete-me.com'
        });

        const projectId = createResponse.body.id;

        const deleteResponse = await request(app)
            .delete(`/projects/${projectId}`)
            .set('Cookie', cookie);

        expect(deleteResponse.status).toBe(204);

        const getResponse = await request(app)
            .get(`/projects/${projectId}`)
            .set('Cookie', cookie);
        expect(getResponse.status).toBe(404);
    });

    it('returns 404 when deleting a missing project while authenticated', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        const response = await request(app)
            .delete('/projects/22222222-2222-2222-2222-222222222222')
            .set('Cookie', cookie);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Project not found'
        });
    });

    it('allows project updates by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner@example.com'
        });

        const createResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner project',
            url: 'https://owner-project.com'
        });

        const projectId = createResponse.body.id;

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other@example.com'
        });

        const response = await request(app)
            .patch(`/projects/${projectId}`)
            .set('Cookie', otherUserCookie)
            .send({
                name: 'Shared project name'
            });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Shared project name');
    });

    it('allows project deletion by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner@example.com'
        });

        const createResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner project',
            url: 'https://owner-delete-project.com'
        });

        const projectId = createResponse.body.id;

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other@example.com'
        });

        const response = await request(app)
            .delete(`/projects/${projectId}`)
            .set('Cookie', otherUserCookie);

        expect(response.status).toBe(204);
    });

    it('includes all workspace projects in the project list', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner@example.com'
        });

        await createProject({
            cookie: ownerCookie,
            name: 'Owner project',
            url: 'https://owner-list-project.com'
        });

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other-list@example.com'
        });

        await createProject({
            cookie: otherUserCookie,
            name: 'Other project',
            url: 'https://other-list-project.com'
        });

        const response = await request(app)
            .get('/projects')
            .set('Cookie', ownerCookie);

        expect(response.status).toBe(200);
        expect(response.body.data.map((project: { name: string }) => project.name)).toEqual([
            'Other project',
            'Owner project'
        ]);
        expect(response.body.pagination.total).toBe(2);
    });

    it('includes an empty summary for projects without reports', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });

        await createProject({
            cookie,
            name: 'Empty project',
            url: 'https://empty-project.com'
        });

        const response = await request(app)
            .get('/projects')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].summary).toEqual({
            reportCount: 0,
            reportGroupCount: 0,
            latestReportCreatedAt: null,
            latestReportTitle: null,
            latestScores: null
        });
    });

    it('summarises report counts, group counts, and latest report scores in the project list', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-summary@example.com'
        });

        const projectResponse = await createProject({
            cookie,
            name: 'Summarised project',
            url: 'https://summarised-project.com'
        });
        const projectId = projectResponse.body.id;

        const homepageGroupResponse = await createReportGroup({
            cookie,
            projectId,
            name: 'Homepage mobile',
            pageUrl: 'https://summarised-project.com/',
            strategy: 'mobile'
        });

        const contactGroupResponse = await createReportGroup({
            cookie,
            projectId,
            name: 'Contact desktop',
            pageUrl: 'https://summarised-project.com/contact',
            strategy: 'desktop'
        });

        await createReport({
            cookie,
            projectId,
            groupId: homepageGroupResponse.body.id,
            title: 'Older homepage report',
            summary: 'Older homepage summary',
            pageUrl: 'https://summarised-project.com/',
            performanceScore: 72,
            accessibilityScore: 83,
            seoScore: 91,
            bestPracticesScore: 88,
            agenticBrowsingScore: 76
        });

        const latestReportResponse = await createReport({
            cookie,
            projectId,
            groupId: contactGroupResponse.body.id,
            title: 'Latest contact report',
            summary: 'Latest contact summary',
            pageUrl: 'https://summarised-project.com/contact',
            performanceScore: 94,
            accessibilityScore: 89,
            seoScore: 97,
            bestPracticesScore: 93,
            agenticBrowsingScore: 84
        });

        const response = await request(app)
            .get('/projects')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].summary).toEqual({
            reportCount: 2,
            reportGroupCount: 2,
            latestReportCreatedAt: latestReportResponse.body.createdAt,
            latestReportTitle: 'Latest contact report',
            latestScores: {
                performanceScore: 94,
                accessibilityScore: 89,
                seoScore: 97,
                bestPracticesScore: 93,
                agenticBrowsingScore: 84
            }
        });
    });

    it('allows project lookup by a different authenticated user', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'owner-read@example.com'
        });

        const createResponse = await createProject({
            cookie: ownerCookie,
            name: 'Owner read project',
            url: 'https://owner-read-project.com'
        });

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other user',
            email: 'other-read@example.com'
        });

        const response = await request(app)
            .get(`/projects/${createResponse.body.id}`)
            .set('Cookie', otherUserCookie);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createResponse.body.id);
    });

    it('filters projects by assigned client and unassigned status', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'project-client-filter@example.com'
        });
        const clientResponse = await createClient({
            cookie,
            name: 'Filtered client'
        });

        await createProject({
            cookie,
            name: 'Assigned project',
            url: 'https://assigned-project.com',
            clientId: clientResponse.body.id
        });
        await createProject({
            cookie,
            name: 'Unassigned project',
            url: 'https://unassigned-project.com'
        });

        const assignedResponse = await request(app)
            .get(`/projects?clientId=${clientResponse.body.id}`)
            .set('Cookie', cookie);
        const unassignedResponse = await request(app)
            .get('/projects?clientId=unassigned')
            .set('Cookie', cookie);
        const invalidResponse = await request(app)
            .get('/projects?clientId=not-an-id')
            .set('Cookie', cookie);

        expect(assignedResponse.status).toBe(200);
        expect(assignedResponse.body.data.map((project: { name: string }) => project.name)).toEqual([
            'Assigned project'
        ]);
        expect(unassignedResponse.status).toBe(200);
        expect(unassignedResponse.body.data.map((project: { name: string }) => project.name)).toEqual([
            'Unassigned project'
        ]);
        expect(invalidResponse.status).toBe(400);
        expect(invalidResponse.body.error).toBe('Invalid client filter');
    });

    it('filters projects by search term', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });
    
        await createProject({
            cookie,
            name: 'Site Score',
            url: 'https://site-score.com'
        });
    
        await createProject({
            cookie,
            name: 'Another Project',
            url: 'https://another-project.com'
        });
    
        const response = await request(app)
            .get('/projects?search=site')
            .set('Cookie', cookie);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].name).toBe('Site Score');
        expect(response.body.pagination.total).toBe(1);
    });

    it('sorts projects by name ascending', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });
    
        await createProject({
            cookie,
            name: 'Zoo Project',
            url: 'https://zoo-project.com'
        });
    
        await createProject({
            cookie,
            name: 'Alpha Project',
            url: 'https://alpha-project.com'
        });
    
        const response = await request(app)
            .get('/projects?sort=name&order=asc')
            .set('Cookie', cookie);
    
        expect(response.status).toBe(200);
        expect(response.body.data[0].name).toBe('Alpha Project');
        expect(response.body.data[1].name).toBe('Zoo Project');
    });

    it('paginates projects with page and limit', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil@example.com'
        });
    
        await createProject({
            cookie,
            name: 'Project One',
            url: 'https://project-one.com'
        });
    
        await createProject({
            cookie,
            name: 'Project Two',
            url: 'https://project-two.com'
        });
    
        await createProject({
            cookie,
            name: 'Project Three',
            url: 'https://project-three.com'
        });
    
        const response = await request(app)
            .get('/projects?page=1&limit=2')
            .set('Cookie', cookie);
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(2);
        expect(response.body.pagination.total).toBe(3);
        expect(response.body.pagination.totalPages).toBe(2);
    });
});
