import { Router } from 'express';

import {
    createProject,
    deleteProject,
    getProjectById,
    getProjects,
    updateProject
} from '../controllers/project-controller.js';

import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';

const projectRoutes = Router();

projectRoutes.get('/', asyncHandler(getProjects));
projectRoutes.get('/:id', asyncHandler(getProjectById));

projectRoutes.post('/', asyncHandler(requireAuth), asyncHandler(createProject));
projectRoutes.patch('/:id', asyncHandler(requireAuth), asyncHandler(updateProject));
projectRoutes.delete('/:id', asyncHandler(requireAuth), asyncHandler(deleteProject));

export { projectRoutes };