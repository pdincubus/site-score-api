import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { getProjectOwnerId } from '../services/project-service.js';
import { ZodError } from 'zod';
import { createReportSchema, updateReportSchema } from '../validation/report-schemas.js';

import {
    createNewReport,
    deleteReportById,
    getReportById as getReportByIdFromService,
    getReportProjectOwnerId,
    getReportsByProjectId,
    updateReportById
} from '../services/report-service.js';

async function getProjectReports(req: Request, res: Response) {
    const { id } = req.params;
    const reports = await getReportsByProjectId(id);

    res.status(200).json(reports);
}

async function getReportById(req: Request, res: Response) {
    const { id } = req.params;
    const report = await getReportByIdFromService(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    res.status(200).json(report);
}

async function createReport(req: Request, res: Response) {
    const { id: projectId } = req.params;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const {
            title,
            summary,
            accessibilityScore,
            performanceScore,
            seoScore,
            uxScore
        } = createReportSchema.parse(req.body);

        const ownerId = await getProjectOwnerId(projectId);

        if (!ownerId) {
            throw new AppError('Project not found', 404);
        }

        if (ownerId !== req.currentUser.id) {
            throw new AppError('Forbidden', 403);
        }

        const report = await createNewReport({
            projectId,
            title,
            summary,
            accessibilityScore,
            performanceScore,
            seoScore,
            uxScore
        });

        res.status(201).json(report);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function updateReport(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const {
            title,
            summary,
            accessibilityScore,
            performanceScore,
            seoScore,
            uxScore
        } = updateReportSchema.parse(req.body);

        const ownerId = await getReportProjectOwnerId(id);

        if (!ownerId) {
            throw new AppError('Report not found', 404);
        }

        if (ownerId !== req.currentUser.id) {
            throw new AppError('Forbidden', 403);
        }

        const updatedReport = await updateReportById(id, {
            title,
            summary,
            accessibilityScore,
            performanceScore,
            seoScore,
            uxScore
        });

        if (!updatedReport) {
            throw new AppError('Report not found', 404);
        }

        res.status(200).json(updatedReport);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function deleteReport(req: Request, res: Response) {
    const { id } = req.params;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const ownerId = await getReportProjectOwnerId(id);

    if (!ownerId) {
        throw new AppError('Report not found', 404);
    }

    if (ownerId !== req.currentUser.id) {
        throw new AppError('Forbidden', 403);
    }

    const wasDeleted = await deleteReportById(id);

    if (!wasDeleted) {
        throw new AppError('Report not found', 404);
    }

    res.status(204).send();
}

export {
    createReport,
    deleteReport,
    getProjectReports,
    getReportById,
    updateReport
};