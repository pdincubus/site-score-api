import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { env } from '../config/env.js';

function notFoundMiddleware(_req: Request, res: Response) {
    res.status(404).json({
        error: 'Not found'
    });
}

function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        if (env.nodeEnv !== 'test') {
            console.error(err);
        }

        res.status(err.statusCode).json({
            error: err.message
        });
        return;
    }

    console.error(err);

    res.status(500).json({
        error: 'Something went wrong'
    });
}

export { notFoundMiddleware, errorMiddleware };