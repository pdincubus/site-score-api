import type { NextFunction, Request, Response } from 'express';

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void> | void;

function asyncHandler(handler: AsyncHandler) {
    return async function wrappedHandler(req: Request, res: Response, next: NextFunction) {
        try {
            await handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
}

export { asyncHandler };