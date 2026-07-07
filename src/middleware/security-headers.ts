import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

const apiContentSecurityPolicy = [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
].join('; ');

const docsContentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'"
].join('; ');

function securityHeaders(req: Request, res: Response, next: NextFunction) {
    const contentSecurityPolicy = req.path.startsWith('/docs')
        ? docsContentSecurityPolicy
        : apiContentSecurityPolicy;

    res.setHeader('Content-Security-Policy', contentSecurityPolicy);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');

    if (env.isProduction) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
}

export { securityHeaders };
