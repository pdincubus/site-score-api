import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { clearTables } from '../test/test-db.js';
import { createClient, registerAndLoginAs } from '../test/test-helpers.js';

describe('Client routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('creates, lists, updates, archives, restores, and deletes owned clients', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Phil',
            email: 'phil-clients@example.com'
        });

        const createResponse = await createClient({
            cookie,
            name: 'Crayons & Code'
        });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toMatchObject({
            name: 'Crayons & Code',
            archivedAt: null
        });

        const clientId = createResponse.body.id;
        const updateResponse = await request(app)
            .patch(`/clients/${clientId}`)
            .set('Cookie', cookie)
            .send({
                name: 'Crayons and Code'
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.name).toBe('Crayons and Code');

        const archiveResponse = await request(app)
            .post(`/clients/${clientId}/archive`)
            .set('Cookie', cookie);

        expect(archiveResponse.status).toBe(200);
        expect(archiveResponse.body.archivedAt).toEqual(expect.any(String));

        const activeListResponse = await request(app)
            .get('/clients')
            .set('Cookie', cookie);
        const archivedListResponse = await request(app)
            .get('/clients?status=archived')
            .set('Cookie', cookie);

        expect(activeListResponse.status).toBe(200);
        expect(activeListResponse.body.data).toEqual([]);
        expect(archivedListResponse.status).toBe(200);
        expect(archivedListResponse.body.data[0]).toMatchObject({
            id: clientId,
            name: 'Crayons and Code'
        });

        const restoreResponse = await request(app)
            .post(`/clients/${clientId}/restore`)
            .set('Cookie', cookie);

        expect(restoreResponse.status).toBe(200);
        expect(restoreResponse.body.archivedAt).toBeNull();

        const deleteResponse = await request(app)
            .delete(`/clients/${clientId}`)
            .set('Cookie', cookie);

        expect(deleteResponse.status).toBe(204);

        const getResponse = await request(app)
            .get(`/clients/${clientId}`)
            .set('Cookie', cookie);

        expect(getResponse.status).toBe(404);
    });

    it('shares client administration between authenticated users', async () => {
        const ownerCookie = await registerAndLoginAs({
            name: 'Owner',
            email: 'client-owner@example.com'
        });
        const createResponse = await createClient({
            cookie: ownerCookie,
            name: 'Owner client'
        });

        const otherUserCookie = await registerAndLoginAs({
            name: 'Other',
            email: 'client-other@example.com'
        });

        const listResponse = await request(app)
            .get('/clients?status=all')
            .set('Cookie', otherUserCookie);
        const readResponse = await request(app)
            .get(`/clients/${createResponse.body.id}`)
            .set('Cookie', otherUserCookie);
        const archiveResponse = await request(app)
            .post(`/clients/${createResponse.body.id}/archive`)
            .set('Cookie', otherUserCookie);
        const restoreResponse = await request(app)
            .post(`/clients/${createResponse.body.id}/restore`)
            .set('Cookie', ownerCookie);

        expect(listResponse.status).toBe(200);
        expect(listResponse.body.data).toEqual([
            expect.objectContaining({
                id: createResponse.body.id,
                name: 'Owner client'
            })
        ]);
        expect(readResponse.status).toBe(200);
        expect(archiveResponse.status).toBe(200);
        expect(archiveResponse.body.archivedAt).toEqual(expect.any(String));
        expect(restoreResponse.status).toBe(200);
        expect(restoreResponse.body.archivedAt).toBeNull();
    });

    it('rejects invalid client create payloads with 400 responses', async () => {
        const cookie = await registerAndLoginAs({
            name: 'Validator',
            email: 'client-validation@example.com'
        });

        const missingNameResponse = await request(app)
            .post('/clients')
            .set('Cookie', cookie)
            .send({});
        const emptyNameResponse = await request(app)
            .post('/clients')
            .set('Cookie', cookie)
            .send({
                name: '   '
            });

        expect(missingNameResponse.status).toBe(400);
        expect(missingNameResponse.body.error).toBe('Name is required');
        expect(emptyNameResponse.status).toBe(400);
        expect(emptyNameResponse.body.error).toBe('Name is required');
    });

    it('rejects unauthenticated client access', async () => {
        const listResponse = await request(app).get('/clients');
        const createResponse = await request(app)
            .post('/clients')
            .send({
                name: 'Blocked client'
            });

        expect(listResponse.status).toBe(401);
        expect(createResponse.status).toBe(401);
    });
});
