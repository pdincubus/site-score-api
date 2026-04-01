import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

import {
    deleteSessionByToken,
    getUserBySessionToken,
    loginUser,
    registerUser
} from '../services/auth-service.js';

async function register(req: Request, res: Response) {
    const { name, email, password } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Name is required', 400);
    }

    if (typeof email !== 'string' || email.trim() === '') {
        throw new AppError('Email is required', 400);
    }

    if (typeof password !== 'string' || password.trim() === '') {
        throw new AppError('Password is required', 400);
    }

    const user = await registerUser({
        name,
        email,
        password
    });

    res.status(201).json(user);
}

async function login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (typeof email !== 'string' || email.trim() === '') {
        throw new AppError('Email is required', 400);
    }

    if (typeof password !== 'string' || password.trim() === '') {
        throw new AppError('Password is required', 400);
    }

    const { user, sessionToken } = await loginUser({
        email,
        password
    });

    res.cookie('session_token', sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json(user);
}

async function logout(req: Request, res: Response) {
    const sessionToken = req.cookies.session_token;

    if (typeof sessionToken === 'string' && sessionToken.trim() !== '') {
        await deleteSessionByToken(sessionToken);
    }

    res.clearCookie('session_token');

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