import { describe, expect, it, vi } from 'vitest';
import { buildPageSpeedRequestUrl, fetchPageSpeedInsights } from './pagespeed-client.js';

describe('buildPageSpeedRequestUrl', () => {
    it('builds the expected PageSpeed query parameters', () => {
        const requestUrl = buildPageSpeedRequestUrl({
            url: 'https://example.com/',
            strategy: 'mobile',
            apiKey: 'test-key'
        });

        expect(requestUrl.origin).toBe('https://www.googleapis.com');
        expect(requestUrl.pathname).toBe('/pagespeedonline/v5/runPagespeed');
        expect(requestUrl.searchParams.get('url')).toBe('https://example.com/');
        expect(requestUrl.searchParams.get('strategy')).toBe('mobile');
        expect(requestUrl.searchParams.get('key')).toBe('test-key');
        expect(requestUrl.searchParams.getAll('category')).toEqual([
            'performance',
            'accessibility',
            'best-practices',
            'seo'
        ]);
    });
});

describe('fetchPageSpeedInsights', () => {
    it('does not expose the API key in controlled errors', async () => {
        const fetchImpl = vi.fn(async () => new Response('upstream failed with secret-key', {
            status: 500
        }));

        const error = await fetchPageSpeedInsights(
            {
                url: 'https://example.com/',
                strategy: 'desktop'
            },
            {
                apiKey: 'secret-key',
                fetchImpl,
                now: () => new Date('2026-07-07T12:00:00.000Z')
            }
        ).catch((caughtError: unknown) => caughtError);

        expect(error).toMatchObject({
            message: 'PageSpeed is unavailable'
        });
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).not.toContain('secret-key');
    });
});
