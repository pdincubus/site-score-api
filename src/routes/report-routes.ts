import { Router } from 'express';

import {
    createReport,
    deleteReport,
    getProjectReports,
    getReportById,
    updateReport
} from '../controllers/report-controller.js';

import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';

const reportRoutes = Router();

reportRoutes.get('/projects/:id/reports', asyncHandler(getProjectReports));
reportRoutes.post('/projects/:id/reports', asyncHandler(requireAuth), asyncHandler(createReport));

reportRoutes.get('/reports/:id', asyncHandler(getReportById));
reportRoutes.patch('/reports/:id', asyncHandler(requireAuth), asyncHandler(updateReport));
reportRoutes.delete('/reports/:id', asyncHandler(requireAuth), asyncHandler(deleteReport));

export { reportRoutes };