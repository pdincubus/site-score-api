import type { Request, RequestHandler } from 'express';

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

type RateLimitOptions = {
    windowMs: number;
    max: number;
    message?: string;
    getKey?: (req: Request) => string;
    now?: () => number;
};

function createRateLimit(options: RateLimitOptions): RequestHandler {
    const hits = new Map<string, RateLimitEntry>();
    const message = options.message || 'Too many requests';
    const now = options.now || Date.now;
    const getKey = options.getKey || ((req) => req.ip || req.socket.remoteAddress || 'unknown');

    return function rateLimit(req, res, next) {
        const currentTime = now();
        const key = getKey(req);
        const currentEntry = hits.get(key);

        const entry =
            currentEntry && currentEntry.resetAt > currentTime
                ? currentEntry
                : { count: 0, resetAt: currentTime + options.windowMs };

        if (entry.count >= options.max) {
            const retryAfterSeconds = Math.ceil((entry.resetAt - currentTime) / 1000);

            res.setHeader('RateLimit-Limit', String(options.max));
            res.setHeader('RateLimit-Remaining', '0');
            res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
            res.setHeader('Retry-After', String(retryAfterSeconds));
            res.status(429).json({
                error: message
            });
            return;
        }

        entry.count += 1;
        hits.set(key, entry);

        res.setHeader('RateLimit-Limit', String(options.max));
        res.setHeader('RateLimit-Remaining', String(Math.max(options.max - entry.count, 0)));
        res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

        next();
    };
}

export { createRateLimit };
