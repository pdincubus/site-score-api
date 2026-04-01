import { Router } from 'express';
import {
    createProject,
    getProjectById,
    getProjects
} from '../controllers/project-controller.js';
import { asyncHandler } from '../middleware/async-handler.js';

const projectRoutes = Router();

projectRoutes.get('/', asyncHandler(getProjects));
projectRoutes.get('/:id', asyncHandler(getProjectById));
projectRoutes.post('/', asyncHandler(createProject));

export { projectRoutes };