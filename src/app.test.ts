import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('App security headers', () => {
    it('sets baseline security headers', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.headers['x-powered-by']).toBeUndefined();
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['referrer-policy']).toBe('no-referrer');
        expect(response.headers['permissions-policy']).toBe(
            'camera=(), geolocation=(), microphone=()'
        );
        expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    });
});
