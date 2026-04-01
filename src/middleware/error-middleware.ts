import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

function notFoundMiddleware(_req: Request, res: Response) {
    res.status(404).json({
        error: 'Not found'
    });
}

function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    console.error(err);

    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message
        });
        return;
    }

    res.status(500).json({
        error: 'Something went wrong'
    });
}

export { notFoundMiddleware, errorMiddleware };