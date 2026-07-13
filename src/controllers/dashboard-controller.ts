import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { getDashboard as getDashboardFromService } from '../services/dashboard-service.js';

async function getDashboard(req: Request, res: Response) {
    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const dashboard = await getDashboardFromService();

    res.status(200).json(dashboard);
}

export { getDashboard };
