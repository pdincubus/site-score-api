import type { Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../errors/app-error.js';

import {
    deleteSessionByToken,
    getUserBySessionToken,
    loginUser,
    registerUser
} from '../services/auth-service.js';

import { loginSchema, registerSchema } from '../validation/auth-schemas.js';

import {
    getSessionCookieOptions,
    SESSION_COOKIE_NAME
} from '../config/cookies.js';

async function register(req: Request, res: Response) {
    try {
        const { name, email, password } = registerSchema.parse(req.body);

        const user = await registerUser({
            name,
            email,
            password
        });

        res.status(201).json(user);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function login(req: Request, res: Response) {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const { user, sessionToken } = await loginUser({
            email,
            password
        });

        res.cookie(
            SESSION_COOKIE_NAME,
            sessionToken,
            getSessionCookieOptions()
        );

        res.status(200).json(user);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function logout(req: Request, res: Response) {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];

    if (typeof sessionToken === 'string' && sessionToken.trim() !== '') {
        await deleteSessionByToken(sessionToken);
    }

    res.clearCookie(
        SESSION_COOKIE_NAME,
        getSessionCookieOptions()
    );

    res.status(204).send();
}

async function getCurrentUser(req: Request, res: Response) {
    const sessionToken = req.cookies.session_token;

    if (typeof sessionToken !== 'string' || sessionToken.trim() === '') {
        throw new AppError('Not authenticated', 401);
    }

    const user = await getUserBySessionToken(sessionToken);

    if (!user) {
        throw new AppError('Not authenticated', 401);
    }

    res.status(200).json(user);
}

export { register, login, logout, getCurrentUser };