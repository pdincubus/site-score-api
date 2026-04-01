import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import {
    createNewProject,
    getAllProjects,
    getProjectById as getProjectByIdFromService
} from '../services/project-service.js';

function getProjects(_req: Request, res: Response) {
    const allProjects = getAllProjects();

    res.status(200).json(allProjects);
}

function getProjectById(req: Request, res: Response) {
    const { id } = req.params;
    const project = getProjectByIdFromService(id);

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    res.status(200).json(project);
}

function createProject(req: Request, res: Response) {
    const { name, url } = req.body;

    if (typeof name !== 'string' || name.trim() === '') {
        throw new AppError('Name is required', 400);
    }

    if (typeof url !== 'string' || url.trim() === '') {
        throw new AppError('URL is required', 400);
    }

    const newProject = createNewProject({
        name,
        url
    });

    res.status(201).json(newProject);
}

export { getProjects, getProjectById, createProject };