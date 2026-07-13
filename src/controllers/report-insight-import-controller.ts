import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { getProjectById } from '../services/project-service.js';
import { importReportInsights } from '../services/report-insight-import-service.js';
import { reportInsightImportSchema } from '../validation/report-insight-import-schemas.js';

function getSingleParam(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

async function importReportInsightsPreview(req: Request, res: Response) {
    const projectId = getSingleParam(req.params.projectId);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const input = reportInsightImportSchema.parse(req.body);
        const project = await getProjectById(projectId);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        const insights = await importReportInsights(input);

        res.status(200).json(insights);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

export { importReportInsightsPreview };
