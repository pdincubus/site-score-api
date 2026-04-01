import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { pool } from '../db/database.js';
import { clearProjectsTable } from '../test/test-db.js';

describe('Project routes', () => {
    beforeEach(async () => {
        await clearProjectsTable();
    });

    afterAll(async () => {
        await pool.end();
    });

    it('returns an empty array when there are no projects', async () => {
        const response = await request(app).get('/projects');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('creates a project', async () => {
        const response = await request(app)
            .post('/projects')
            .send({
                name: 'Test project',
                url: 'https://example.com'
            });
    
        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Test project');
        expect(response.body.url).toBe('https://example.com');
        expect(response.body.id).toBeTypeOf('string');
    });

    it('rejects a duplicate project URL', async () => {
        await request(app)
            .post('/projects')
            .send({
                name: 'First project',
                url: 'https://example.com'
            });
    
        const response = await request(app)
            .post('/projects')
            .send({
                name: 'Second project',
                url: 'https://example.com'
            });
    
        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            error: 'A project with this URL already exists'
        });
    });

    it('rejects project creation with no name', async () => {
        const response = await request(app)
            .post('/projects')
            .send({
                url: 'https://example.com'
            });
    
        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Name is required'
        });
    });

    it('gets a project by id', async () => {
        const createResponse = await request(app)
            .post('/projects')
            .send({
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

    it('updates a project name', async () => {
        const createResponse = await request(app)
            .post('/projects')
            .send({
                name: 'Old name',
                url: 'https://old-name.com'
            });
    
        const projectId = createResponse.body.id;
    
        const response = await request(app)
            .patch(`/projects/${projectId}`)
            .send({
                name: 'New name'
            });
    
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('New name');
        expect(response.body.url).toBe('https://old-name.com');
    });

    it('deletes a project', async () => {
        const createResponse = await request(app)
            .post('/projects')
            .send({
                name: 'Delete me',
                url: 'https://delete-me.com'
            });
    
        const projectId = createResponse.body.id;
    
        const deleteResponse = await request(app).delete(`/projects/${projectId}`);
        expect(deleteResponse.status).toBe(204);
    
        const getResponse = await request(app).get(`/projects/${projectId}`);
        expect(getResponse.status).toBe(404);
    });

    it('returns 404 when deleting a missing project', async () => {
        const response = await request(app).delete(
            '/projects/22222222-2222-2222-2222-222222222222'
        );
    
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Project not found'
        });
    });
});