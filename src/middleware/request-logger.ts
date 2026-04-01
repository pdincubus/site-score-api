import type { NextFunction, Request, Response } from 'express';

function requestLogger(req: Request, _res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.path}`);
    next();
}

export { requestLogger };