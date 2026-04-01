import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { getUserBySessionToken } from '../services/auth-service.js';

async function requireAuth(req: Request, _res: Response, next: NextFunction) {
    const sessionToken = req.cookies.session_token;

    if (typeof sessionToken !== 'string' || sessionToken.trim() === '') {
        next(new AppError('Not authenticated', 401));
        return;
    }

    const user = await getUserBySessionToken(sessionToken);

    if (!user) {
        next(new AppError('Not authenticated', 401));
        return;
    }

    req.currentUser = user;
    req.sessionToken = sessionToken;

    next();
}

export { requireAuth };