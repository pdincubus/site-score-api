import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { getProjectOwnerId } from '../services/project-service.js';
import { getReportGroupProjectId } from '../services/report-group-service.js';
import {
    archiveReportById,
    createNewReport,
    deleteReportById,
    getPaginatedReportsByProjectId,
    getReportById as getReportByIdFromService,
    getReportProjectAccess,
    getReportProjectOwnerId,
    restoreReportById,
    updateReportById
} from '../services/report-service.js';
import { getReportListQuery } from '../utils/pagination.js';
import {
    createReportSchema,
    reportGroupIdSchema,
    updateReportSchema
} from '../validation/report-schemas.js';

function getSingleParam(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

async function assertReportGroupBelongsToProject(projectId: string, groupId: string) {
    const groupProjectId = await getReportGroupProjectId(groupId);

    if (!groupProjectId || groupProjectId !== projectId) {
        throw new AppError('Report group not found', 404);
    }
}

async function getProjectReports(req: Request, res: Response) {
    const projectId = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const ownerId = await getProjectOwnerId(projectId);

    if (!ownerId) {
        throw new AppError('Project not found', 404);
    }

    if (ownerId !== req.currentUser.id) {
        throw new AppError('Forbidden', 403);
    }

    const query = getReportListQuery(req.query as Record<string, unknown>);

    try {
        if (query.groupId !== '') {
            reportGroupIdSchema.parse(query.groupId);
            await assertReportGroupBelongsToProject(projectId, query.groupId);
        }
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid query parameter', 400);
        }

        throw error;
    }

    const reports = await getPaginatedReportsByProjectId(projectId, query);

    res.status(200).json(reports);
}

async function getReportById(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

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

    const report = await getReportByIdFromService(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    res.status(200).json(report);
}

async function createReport(req: Request, res: Response) {
    const projectId = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const {
            groupId,
            title,
            summary,
            pageUrl,
            accessibilityScore,
            performanceScore,
            seoScore,
            bestPracticesScore,
            agenticBrowsingScore,
            insights
        } = createReportSchema.parse(req.body);

        const ownerId = await getProjectOwnerId(projectId);

        if (!ownerId) {
            throw new AppError('Project not found', 404);
        }

        if (ownerId !== req.currentUser.id) {
            throw new AppError('Forbidden', 403);
        }

        await assertReportGroupBelongsToProject(projectId, groupId);

        const report = await createNewReport({
            projectId,
            groupId,
            title,
            summary,
            pageUrl,
            accessibilityScore,
            performanceScore,
            seoScore,
            bestPracticesScore,
            agenticBrowsingScore,
            insights
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
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const {
            groupId,
            title,
            summary,
            pageUrl,
            accessibilityScore,
            performanceScore,
            seoScore,
            bestPracticesScore,
            agenticBrowsingScore
        } = updateReportSchema.parse(req.body);

        const reportAccess = await getReportProjectAccess(id);

        if (!reportAccess) {
            throw new AppError('Report not found', 404);
        }

        if (reportAccess.ownerId !== req.currentUser.id) {
            throw new AppError('Forbidden', 403);
        }

        await assertReportGroupBelongsToProject(reportAccess.projectId, groupId);

        const updatedReport = await updateReportById(id, {
            groupId,
            title,
            summary,
            pageUrl,
            accessibilityScore,
            performanceScore,
            seoScore,
            bestPracticesScore,
            agenticBrowsingScore
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
    const id = getSingleParam(req.params.id);

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

async function archiveReport(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

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

    const report = await archiveReportById(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    res.status(200).json(report);
}

async function restoreReport(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

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

    const report = await restoreReportById(id);

    if (!report) {
        throw new AppError('Report not found', 404);
    }

    res.status(200).json(report);
}

export {
    archiveReport,
    createReport,
    deleteReport,
    getProjectReports,
    getReportById,
    restoreReport,
    updateReport
};
