import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';

import {
    createNewProject,
    deleteProjectById,
    getAllProjects,
    getProjectById as getProjectByIdFromService,
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

async function createProject(req: Request, res: Response) {
    const { name, url } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Name is required', 400);
    }

    if (typeof url !== 'string' || url.trim() === '') {
        throw new AppError('URL is required', 400);
    }

    const newProject = await createNewProject({
        name,
        url
    });

    res.status(201).json(newProject);
}

async function deleteProject(req: Request, res: Response) {
    const { id } = req.params;
    const wasDeleted = await deleteProjectById(id);

    if (!wasDeleted) {
        throw new AppError('Project not found', 404);
    }

    res.status(204).send();
}

async function updateProject(req: Request, res: Response) {
    const { id } = req.params;
    const { name, url } = req.body;

    if (name === undefined && url === undefined) {
        throw new AppError('At least one of name or URL is required', 400);
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        throw new AppError('Name must be a non-empty string', 400);
    }

    if (url !== undefined && (typeof url !== 'string' || url.trim() === '')) {
        throw new AppError('URL must be a non-empty string', 400);
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

export { getProjects, getProjectById, createProject, deleteProject, updateProject };