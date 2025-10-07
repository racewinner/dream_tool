import { Router } from 'express';
import { visualizationController } from '../controllers/visualizationController';

const router = Router();

// Visualization routes for survey analysis data

/**
 * @route   GET /api/visualizations/surveys
 * @desc    Get all survey visualization data
 * @access  Private
 */
router.get('/surveys', visualizationController.getSurveyVisualizations);

/**
 * @route   GET /api/visualizations/facilities
 * @desc    Get facility distribution visualization data
 * @access  Private
 */
router.get('/facilities', visualizationController.getFacilityDistribution);

/**
 * @route   GET /api/visualizations/timeline
 * @desc    Get quality timeline visualization data
 * @access  Private
 */
router.get('/timeline', visualizationController.getDataQualityTimeline);

/**
 * @route   GET /api/visualizations/geo
 * @desc    Get geographical distribution visualization data
 * @access  Private
 */
router.get('/geo', visualizationController.getGeoDistribution);

/**
 * @route   GET /api/visualizations/repeat-groups
 * @desc    Get repeat group analysis visualization data
 * @access  Private
 */
router.get('/repeat-groups', visualizationController.getRepeatGroupAnalysis);

export default router;
