import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { ZodError } from 'zod';
import { createProjectSchema, updateProjectSchema } from '../validation/project-schemas.js';

import {
    createNewProject,
    deleteProjectById,
    getAllProjects,
    getProjectById as getProjectByIdFromService,
    getProjectOwnerId,
    updateProjectById
} from '../services/project-service.js';

function getSingleParam(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

async function getProjects(_req: Request, res: Response) {
    const allProjects = await getAllProjects();

    res.status(200).json(allProjects);
}

async function getProjectById(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);
    const project = await getProjectByIdFromService(id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    res.status(200).json(project);
}

async function deleteProject(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const ownerId = await getProjectOwnerId(id);

    if (!ownerId) {
        throw new AppError('Project not found', 404);
    }

    if (ownerId !== req.currentUser.id) {
        throw new AppError('Forbidden', 403);
    }

    const wasDeleted = await deleteProjectById(id);

    if (!wasDeleted) {
        throw new AppError('Project not found', 404);
    }

    res.status(204).send();
}

async function updateProject(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const { name, url } = updateProjectSchema.parse(req.body);

        const ownerId = await getProjectOwnerId(id);

        if (!ownerId) {
            throw new AppError('Project not found', 404);
        }

        if (ownerId !== req.currentUser.id) {
            throw new AppError('Forbidden', 403);
        }

        const updatedProject = await updateProjectById(id, {
            name,
            url
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

async function createProject(req: Request, res: Response) {
    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const { name, url } = createProjectSchema.parse(req.body);

        const newProject = await createNewProject({
            name,
            url,
            userId: req.currentUser.id
        });

        res.status(201).json(newProject);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

export { getProjects, getProjectById, createProject, deleteProject, updateProject, createProject as createProjectForUser };