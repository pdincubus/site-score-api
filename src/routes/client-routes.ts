import { Router } from 'express';
import {
    archiveClient,
    createClient,
    deleteClient,
    getClientById,
    getClients,
    restoreClient,
    updateClient
} from '../controllers/client-controller.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireAuth } from '../middleware/require-auth.js';

const clientRoutes = Router();

/**
 * @openapi
 * /clients:
 *   get:
 *     summary: Get current user's clients
 *     tags:
 *       - Clients
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - archived
 *             - all
 *     responses:
 *       200:
 *         description: Paginated list of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClientListItem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                   required:
 *                     - page
 *                     - limit
 *                     - total
 *                     - totalPages
 *               required:
 *                 - data
 *                 - pagination
 */
clientRoutes.get('/', asyncHandler(requireAuth), asyncHandler(getClients));

/**
 * @openapi
 * /clients:
 *   post:
 *     summary: Create a client
 *     tags:
 *       - Clients
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *     responses:
 *       201:
 *         description: Client created
 */
clientRoutes.post('/', asyncHandler(requireAuth), asyncHandler(createClient));

/**
 * @openapi
 * /clients/{id}:
 *   get:
 *     summary: Get owned client by id
 *     tags:
 *       - Clients
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
 *         description: Client found
 */
clientRoutes.get('/:id', asyncHandler(requireAuth), asyncHandler(getClientById));

/**
 * @openapi
 * /clients/{id}:
 *   patch:
 *     summary: Update an owned client
 *     tags:
 *       - Clients
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
 *             $ref: '#/components/schemas/UpdateClientRequest'
 *     responses:
 *       200:
 *         description: Client updated
 */
clientRoutes.patch('/:id', asyncHandler(requireAuth), asyncHandler(updateClient));

/**
 * @openapi
 * /clients/{id}/archive:
 *   post:
 *     summary: Archive an owned client
 *     tags:
 *       - Clients
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
 *         description: Client archived
 */
clientRoutes.post('/:id/archive', asyncHandler(requireAuth), asyncHandler(archiveClient));

/**
 * @openapi
 * /clients/{id}/restore:
 *   post:
 *     summary: Restore an archived client
 *     tags:
 *       - Clients
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
 *         description: Client restored
 */
clientRoutes.post('/:id/restore', asyncHandler(requireAuth), asyncHandler(restoreClient));

/**
 * @openapi
 * /clients/{id}:
 *   delete:
 *     summary: Delete an owned client
 *     tags:
 *       - Clients
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
 *         description: Client deleted
 */
clientRoutes.delete('/:id', asyncHandler(requireAuth), asyncHandler(deleteClient));

export { clientRoutes };
