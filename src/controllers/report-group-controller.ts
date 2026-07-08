import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { getProjectOwnerId } from '../services/project-service.js';
import {
    createNewReportGroup,
    getReportGroupTrendsByProjectId,
    getReportGroupsByProjectId
} from '../services/report-group-service.js';
import { createReportGroupSchema } from '../validation/report-group-schemas.js';
import { reportGroupIdSchema } from '../validation/report-schemas.js';

function getSingleParam(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

async function ensureProjectIsAccessible(projectId: string, userId: string) {
    const ownerId = await getProjectOwnerId(projectId);

    if (!ownerId) {
        throw new AppError('Project not found', 404);
    }

    if (ownerId !== userId) {
        throw new AppError('Forbidden', 403);
    }
}

async function getProjectReportGroups(req: Request, res: Response) {
    const projectId = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    await ensureProjectIsAccessible(projectId, req.currentUser.id);

    const groups = await getReportGroupsByProjectId(projectId);

    res.status(200).json(groups);
}

async function getProjectReportGroupTrends(req: Request, res: Response) {
    const projectId = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    await ensureProjectIsAccessible(projectId, req.currentUser.id);

    try {
        const groupId =
            typeof req.query.groupId === 'string'
                ? req.query.groupId.trim()
                : '';

        if (groupId !== '') {
            reportGroupIdSchema.parse(groupId);
        }

        const trends = await getReportGroupTrendsByProjectId(projectId, groupId);

        if (groupId !== '' && trends.length === 0) {
            throw new AppError('Report group not found', 404);
        }

        res.status(200).json(trends);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid query parameter', 400);
        }

        throw error;
    }
}

async function createReportGroup(req: Request, res: Response) {
    const projectId = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const input = createReportGroupSchema.parse(req.body);

        await ensureProjectIsAccessible(projectId, req.currentUser.id);

        const group = await createNewReportGroup({
            projectId,
            name: input.name,
            pageUrl: input.pageUrl,
            strategy: input.strategy
        });

        res.status(201).json(group);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

export {
    createReportGroup,
    getProjectReportGroupTrends,
    getProjectReportGroups
};
