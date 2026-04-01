import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

import {
    createNewProject,
    deleteProjectById,
    getAllProjects,
    getProjectById as getProjectByIdFromService,
    getProjectOwnerId,
    updateProjectById
} from '../services/project-service.js';

async function getProjects(_req: Request, res: Response) {
    const allProjects = await getAllProjects();

    res.status(200).json(allProjects);
}

async function getProjectById(req: Request, res: Response) {
    const { id } = req.params;
    const project = await getProjectByIdFromService(id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    res.status(200).json(project);
}

async function deleteProject(req: Request, res: Response) {
    const { id } = req.params;

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
    const { id } = req.params;
    const { name, url } = req.body;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    if (name === undefined && url === undefined) {
        throw new AppError('At least one of name or URL is required', 400);
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        throw new AppError('Name must be a non-empty string', 400);
    }

    if (url !== undefined && (typeof url !== 'string' || url.trim() === '')) {
        throw new AppError('URL must be a non-empty string', 400);
    }

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
}

async function createProject(req: Request, res: Response) {
    const { name, url } = req.body;

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    if (typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Name is required', 400);
    }

    if (typeof url !== 'string' || url.trim() === '') {
        throw new AppError('URL is required', 400);
    }

    const newProject = await createNewProject({
        name,
        url,
        userId: req.currentUser.id
    });

    res.status(201).json(newProject);
}

export { getProjects, getProjectById, createProject, deleteProject, updateProject, createProject as createProjectForUser };