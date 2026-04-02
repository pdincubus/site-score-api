import type { CookieOptions } from 'express';
import { env } from './env.js';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function getSessionCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        sameSite: env.isProduction ? 'none' : 'lax',
        secure: env.isProduction,
        maxAge: SESSION_COOKIE_MAX_AGE
    };
}

export {
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_MAX_AGE,
    getSessionCookieOptions
};