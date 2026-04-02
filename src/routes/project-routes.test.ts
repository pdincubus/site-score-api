import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { clearTables } from '../test/test-db.js';
import { createProject, registerAndLoginAs } from '../test/test-helpers.js';

describe('Project routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('returns an empty array when there are no projects', async () => {
        const response = await request(app).get('/projects');

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

    it('gets a project by id', async () => {
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

        const response = await request(app).get(`/projects/${projectId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(projectId);
        expect(response.body.name).toBe('Find me');
    });

    it('returns 404 for a missing project', async () => {
        const response = await request(app).get(
            '/projects/22222222-2222-2222-2222-222222222222'
        );

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

        const getResponse = await request(app).get(`/projects/${projectId}`);
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

    it('rejects project update by a different authenticated user', async () => {
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
                name: 'Hacked name'
            });

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
    });

    it('rejects project deletion by a different authenticated user', async () => {
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

        expect(response.status).toBe(403);
        expect(response.body).toEqual({
            error: 'Forbidden'
        });
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
    
        const response = await request(app).get('/projects?search=site');
    
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
    
        const response = await request(app).get('/projects?sort=name&order=asc');
    
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
    
        const response = await request(app).get('/projects?page=1&limit=2');
    
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(2);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(2);
        expect(response.body.pagination.total).toBe(3);
        expect(response.body.pagination.totalPages).toBe(2);
    });
});