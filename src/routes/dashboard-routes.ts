import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard-controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';

const dashboardRoutes = Router();

/**
 * @openapi
 * /dashboard:
 *   get:
 *     summary: Get recent shared workspace activity
 *     tags:
 *       - Dashboard
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Recent active clients, projects, and results
 *       401:
 *         description: Not authenticated
 */
dashboardRoutes.get('/', asyncHandler(requireAuth), asyncHandler(getDashboard));

export { dashboardRoutes };
