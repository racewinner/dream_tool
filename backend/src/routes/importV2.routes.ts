import express from 'express';
import importController from '../controllers/importController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Imports
 *   description: Data import management
 */

/**
 * @swagger
 * /api/v2/imports/kobo:
 *   post:
 *     summary: Import data from KoboToolbox
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 description: Raw data from KoboToolbox
 *     responses:
 *       202:
 *         description: Import started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 importId:
 *                   type: string
 *                 status:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/kobo', authenticate, importController.importFromKobo);

/**
 * @swagger
 * /api/v2/imports/{id}:
 *   get:
 *     summary: Get import status by ID
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Import ID
 *     responses:
 *       200:
 *         description: Import status
 *       404:
 *         description: Import not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, importController.getImportStatus);

/**
 * @swagger
 * /api/v2/imports:
 *   get:
 *     summary: List all imports with optional filtering
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, processed, failed]
 *         description: Filter by status
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [kobo, csv, api]
 *         description: Filter by source
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of imports
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, importController.listImports);

/**
 * @swagger
 * /api/v2/imports/{id}/retry:
 *   post:
 *     summary: Retry a failed import
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Import ID
 *     responses:
 *       200:
 *         description: Retry started successfully
 *       400:
 *         description: Invalid request (e.g., import not failed)
 *       404:
 *         description: Import not found
 *       500:
 *         description: Server error
 */
router.post('/:id/retry', authenticate, importController.retryImport);

export default router;
