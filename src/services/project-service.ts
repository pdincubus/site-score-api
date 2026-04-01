import crypto from 'node:crypto';
import { AppError } from '../errors/app-error.js';
import { projects } from '../data/projects.js';
import type { Project } from '../types/project.js';

type CreateProjectInput = {
    name: string;
    url: string;
};

function getAllProjects(): Project[] {
    return projects;
}

function getProjectById(id: string): Project | undefined {
    return projects.find((project) => project.id === id);
}

function createNewProject(input: CreateProjectInput): Project {
    const trimmedUrl = input.url.trim();

    const existingProject = projects.find((project) => project.url === trimmedUrl);

    if (existingProject) {
        throw new AppError('A project with this URL already exists', 409);
    }

    const newProject: Project = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        url: trimmedUrl,
        createdAt: new Date().toISOString()
    };

    projects.push(newProject);

    return newProject;
}

export { getAllProjects, getProjectById, createNewProject };