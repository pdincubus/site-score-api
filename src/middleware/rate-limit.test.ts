import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createRateLimit } from './rate-limit.js';

describe('createRateLimit', () => {
    it('returns 429 when the request limit is exceeded', async () => {
        const app = express();
        let currentTime = 1000;

        app.use(createRateLimit({
            windowMs: 60_000,
            max: 2,
            getKey: () => 'test-client',
            now: () => currentTime
        }));

        app.get('/limited', (_req, res) => {
            res.status(200).json({
                ok: true
            });
        });

        expect((await request(app).get('/limited')).status).toBe(200);
        expect((await request(app).get('/limited')).status).toBe(200);

        const limitedResponse = await request(app).get('/limited');

        expect(limitedResponse.status).toBe(429);
        expect(limitedResponse.body).toEqual({
            error: 'Too many requests'
        });
        expect(limitedResponse.headers['retry-after']).toBe('60');

        currentTime += 60_001;

        expect((await request(app).get('/limited')).status).toBe(200);
    });
});
