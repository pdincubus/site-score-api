import { Router } from 'express';
import {
    createProject,
    deleteProject,
    getProjectById,
    getProjects,
    updateProject
} from '../controllers/project-controller.js';
import { asyncHandler } from '../middleware/async-handler.js';

const projectRoutes = Router();

projectRoutes.get('/', asyncHandler(getProjects));
projectRoutes.get('/:id', asyncHandler(getProjectById));
projectRoutes.post('/', asyncHandler(createProject));
projectRoutes.delete('/:id', asyncHandler(deleteProject));
projectRoutes.patch('/:id', asyncHandler(updateProject));

export { projectRoutes };