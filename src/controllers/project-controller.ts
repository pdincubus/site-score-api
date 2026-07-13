import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { getProjectListQuery } from '../utils/pagination.js';

import { getClientById } from '../services/client-service.js';
import {
    archiveProjectById,
    createNewProject,
    deleteProjectById,
    getPaginatedProjects,
    getProjectById as getProjectByIdFromService,
    restoreProjectById,
    updateProjectById
} from '../services/project-service.js';

import { createProjectSchema, updateProjectSchema } from '../validation/project-schemas.js';

function getSingleParam(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function assertClientExists(clientId: string | null | undefined) {
    if (!clientId) {
        return;
    }

    const client = await getClientById(clientId);

    if (!client) {
        throw new AppError('Client not found', 404);
    }
}

async function getProjects(req: Request, res: Response) {
    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const rawClientId = typeof req.query.clientId === 'string' ? req.query.clientId.trim() : '';

    if (rawClientId && rawClientId !== 'unassigned' && !UUID_PATTERN.test(rawClientId)) {
        throw new AppError('Invalid client filter', 400);
    }

    const query = getProjectListQuery(req.query as Record<string, unknown>);
    const projects = await getPaginatedProjects(query);

    res.status(200).json(projects);
}

async function getProjectById(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const project = await getProjectByIdFromService(id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    res.status(200).json(project);
}

async function createProject(req: Request, res: Response) {
    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const { name, url, clientId } = createProjectSchema.parse(req.body);

        await assertClientExists(clientId);

        const newProject = await createNewProject({
            name,
            url,
            userId: req.currentUser.id,
            clientId
        });

        res.status(201).json(newProject);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function updateProject(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const { name, url, clientId } = updateProjectSchema.parse(req.body);

        await assertClientExists(clientId);

        const updatedProject = await updateProjectById(id, {
            name,
            url,
            clientId
        });

        if (!updatedProject) {
            throw new AppError('Project not found', 404);
        }

        res.status(200).json(updatedProject);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function deleteProject(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const wasDeleted = await deleteProjectById(id);

    if (!wasDeleted) {
        throw new AppError('Project not found', 404);
    }

    res.status(204).send();
}

async function archiveProject(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const project = await archiveProjectById(id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    res.status(200).json(project);
}

async function restoreProject(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const project = await restoreProjectById(id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    res.status(200).json(project);
}

export {
    archiveProject,
    createProject,
    deleteProject,
    getProjectById,
    getProjects,
    restoreProject,
    updateProject
};
