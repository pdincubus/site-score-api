import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { clearTables } from '../test/test-db.js';

async function registerAndLogin() {
    await request(app)
        .post('/auth/register')
        .send({
            name: 'Phil',
            email: 'phil@example.com',
            password: 'secret123'
        });

    const loginResponse = await request(app)
        .post('/auth/login')
        .send({
            email: 'phil@example.com',
            password: 'secret123'
        });

    return loginResponse.headers['set-cookie'];
}

describe('Auth routes', () => {
    beforeEach(async () => {
        await clearTables();
    });

    it('registers a user', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                name: 'Phil',
                email: 'phil@example.com',
                password: 'secret123'
            });

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Phil');
        expect(response.body.email).toBe('phil@example.com');
        expect(response.body.id).toBeTypeOf('string');
        expect(response.body.passwordHash).toBeUndefined();
    });

    it('rejects duplicate email registration', async () => {
        await request(app)
            .post('/auth/register')
            .send({
                name: 'Phil',
                email: 'phil@example.com',
                password: 'secret123'
            });

        const response = await request(app)
            .post('/auth/register')
            .send({
                name: 'Phil again',
                email: 'phil@example.com',
                password: 'secret123'
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            error: 'A user with this email already exists'
        });
    });

    it('rejects registration with no name', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                email: 'phil@example.com',
                password: 'secret123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Name is required'
        });
    });

    it('rejects registration with no email', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                name: 'Phil',
                password: 'secret123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Email is required'
        });
    });

    it('rejects registration with no password', async () => {
        const response = await request(app)
            .post('/auth/register')
            .send({
                name: 'Phil',
                email: 'phil@example.com'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Password is required'
        });
    });

    it('logs in a registered user', async () => {
        await request(app)
            .post('/auth/register')
            .send({
                name: 'Phil',
                email: 'phil@example.com',
                password: 'secret123'
            });

        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'phil@example.com',
                password: 'secret123'
            });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Phil');
        expect(response.body.email).toBe('phil@example.com');
        expect(response.headers['set-cookie']).toBeDefined();
    });

    it('rejects login with wrong password', async () => {
        await request(app)
            .post('/auth/register')
            .send({
                name: 'Phil',
                email: 'phil@example.com',
                password: 'secret123'
            });

        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'phil@example.com',
                password: 'wrong-password'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Invalid email or password'
        });
    });

    it('rejects login for unknown email', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'nobody@example.com',
                password: 'secret123'
            });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Invalid email or password'
        });
    });

    it('rejects login with no email', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                password: 'secret123'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Email is required'
        });
    });

    it('rejects login with no password', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'phil@example.com'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Password is required'
        });
    });

    it('returns the current user when authenticated', async () => {
        const cookie = await registerAndLogin();

        const response = await request(app)
            .get('/auth/me')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Phil');
        expect(response.body.email).toBe('phil@example.com');
    });

    it('rejects current user lookup when not authenticated', async () => {
        const response = await request(app).get('/auth/me');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });

    it('logs out an authenticated user', async () => {
        const cookie = await registerAndLogin();

        const logoutResponse = await request(app)
            .post('/auth/logout')
            .set('Cookie', cookie);

        expect(logoutResponse.status).toBe(204);
    });

    it('rejects current user lookup after logout', async () => {
        const cookie = await registerAndLogin();

        await request(app)
            .post('/auth/logout')
            .set('Cookie', cookie);

        const response = await request(app)
            .get('/auth/me')
            .set('Cookie', cookie);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Not authenticated'
        });
    });
});