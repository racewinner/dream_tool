import { Router } from 'express';
// Force TypeScript to recognize the controller
import { MetricsController } from '../controllers/metrics.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const metricsController = new MetricsController();

/**
 * @route GET /api/metrics/dashboard
 * @description Get aggregated metrics for the main dashboard
 * @access Private - Requires authentication
 */
router.get('/dashboard', authenticate, (req, res) => metricsController.getDashboardMetrics(req, res));

/**
 * @route GET /api/metrics/data
 * @description Get metrics related to data section
 * @access Private - Requires authentication
 */
router.get('/data', authenticate, (req, res) => metricsController.getDataMetrics(req, res));

/**
 * @route GET /api/metrics/design
 * @description Get metrics related to design section
 * @access Private - Requires authentication
 */
router.get('/design', authenticate, (req, res) => metricsController.getDesignMetrics(req, res));

/**
 * @route GET /api/metrics/pv-sites
 * @description Get metrics related to PV Sites section
 * @access Private - Requires authentication
 */
router.get('/pv-sites', authenticate, (req, res) => metricsController.getPVSiteMetrics(req, res));

/**
 * @route GET /api/metrics/maintenance
 * @description Get metrics related to maintenance section
 * @access Private - Requires authentication
 */
router.get('/maintenance', authenticate, (req, res) => metricsController.getMaintenanceMetrics(req, res));

/**
 * @route GET /api/metrics/reports
 * @description Get metrics related to reports section
 * @access Private - Requires authentication & admin role
 */
router.get('/reports', authenticate, requireRole(['admin', 'manager']), (req, res) => metricsController.getReportMetrics(req, res));

/**
 * @route GET /api/metrics/summary
 * @description Get summary metrics for overview
 * @access Private - Requires authentication
 */
router.get('/summary', authenticate, (req, res) => metricsController.getSummaryMetrics(req, res));

/**
 * @route GET /api/metrics/solar
 * @description Get solar-specific metrics
 * @access Private - Requires authentication
 */
router.get('/solar', authenticate, (req, res) => metricsController.getSolarMetrics(req, res));

export default router;
