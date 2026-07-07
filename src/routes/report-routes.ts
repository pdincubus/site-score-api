import { Router } from 'express';
import { env } from '../config/env.js';
import { importReportInsightsPreview } from '../controllers/report-insight-import-controller.js';
import {
    createReport,
    deleteReport,
    getProjectReports,
    getReportById,
    updateReport
} from '../controllers/report-controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { createRateLimit } from '../middleware/rate-limit.js';
import { requireAuth } from '../middleware/require-auth.js';

const reportRoutes = Router();
const reportInsightImportRateLimit = createRateLimit({
    windowMs: 5 * 60 * 1000,
    max: env.nodeEnv === 'test' ? 1000 : 20,
    message: 'Too many PageSpeed imports, please try again later',
    getKey: (req) => `${req.currentUser?.id || 'anonymous'}:${req.params.projectId || 'unknown'}`
});

/**
 * @openapi
 * /projects/{id}/reports:
 *   get:
 *     summary: Get reports for an owned project
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *           example: homepage
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - createdAt
 *             - title
 *           example: createdAt
 *       - in: query
 *         name: order
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           example: desc
 *     responses:
 *       200:
 *         description: Paginated list of reports
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
reportRoutes.get('/projects/:id/reports', asyncHandler(requireAuth), asyncHandler(getProjectReports));

/**
 * @openapi
 * /projects/{id}/reports:
 *   post:
 *     summary: Create a report for a project
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportRequest'
 *     responses:
 *       201:
 *         description: Report created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
reportRoutes.post('/projects/:id/reports', asyncHandler(requireAuth), asyncHandler(createReport));

/**
 * @openapi
 * /projects/{projectId}/report-insight-imports:
 *   post:
 *     summary: Import PageSpeed report insights for review
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportInsightImportRequest'
 *     responses:
 *       200:
 *         description: Normalised report insights
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportInsights'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many imports or PageSpeed quota issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: PageSpeed returned an unusable response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       504:
 *         description: PageSpeed timed out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
reportRoutes.post(
    '/projects/:projectId/report-insight-imports',
    asyncHandler(requireAuth),
    reportInsightImportRateLimit,
    asyncHandler(importReportInsightsPreview)
);

/**
 * @openapi
 * /reports/{id}:
 *   get:
 *     summary: Get an owned report by id
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
reportRoutes.get('/reports/:id', asyncHandler(requireAuth), asyncHandler(getReportById));

/**
 * @openapi
 * /reports/{id}:
 *   patch:
 *     summary: Update a report
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReportRequest'
 *     responses:
 *       200:
 *         description: Report updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
reportRoutes.patch('/reports/:id', asyncHandler(requireAuth), asyncHandler(updateReport));

/**
 * @openapi
 * /reports/{id}:
 *   delete:
 *     summary: Delete a report
 *     tags:
 *       - Reports
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Report deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
reportRoutes.delete('/reports/:id', asyncHandler(requireAuth), asyncHandler(deleteReport));

export { reportRoutes };
