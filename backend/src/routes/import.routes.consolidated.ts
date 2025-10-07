import express from 'express';
import { Request, Response } from 'express';
import { DataImportService } from '../services/dataImportService';
import { authenticate } from '../middleware/auth';
import { 
  validateKoboImport, 
  validateCsvUpload, 
  validateExternalApiImport,
  validateRateLimit 
} from '../middleware/validation';
import multer from 'multer';
import { sequelize } from '../models';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('csv') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Rate limiting middleware - 30 requests per minute for import endpoints
const importRateLimit = validateRateLimit(30, 60000);

/**
 * @route POST /api/import/kobo/surveys
 * @desc Import surveys from KoboToolbox by date range
 * @access Private (requires authentication)
 */
router.post('/kobo/surveys', 
  authenticate,
  importRateLimit,
  validateKoboImport,
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { startDate, endDate } = req.body;
      
      // Default to last 30 days if no dates provided
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      
      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;
      
      console.log(`🚀 Starting KoboToolbox import for ${start.toISOString()} to ${end.toISOString()}`);
      
      // Initialize import service
      const importService = new DataImportService();
      
      // Execute import within transaction
      const result = await importService.importSurveysByDateRange(start, end);
      
      // Commit transaction on success
      await transaction.commit();
      
      console.log(`✅ KoboToolbox import completed:`, result);
      
      res.json({
        success: result.success,
        imported: result.imported,
        failed: result.failed,
        message: result.message,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      
      console.error('❌ KoboToolbox import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import surveys from KoboToolbox',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route POST /api/import/kobo/surveys/recent
 * @desc Import recent surveys from KoboToolbox (last 30 days)
 * @access Private (requires authentication)
 */
router.post('/kobo/surveys/recent',
  authenticate,
  importRateLimit,
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      console.log(`🚀 Starting recent KoboToolbox import for last 30 days`);
      
      const importService = new DataImportService();
      const result = await importService.importSurveysByDateRange(startDate, endDate);
      
      await transaction.commit();
      
      console.log(`✅ Recent import completed:`, result);
      
      res.json({
        success: result.success,
        imported: result.imported,
        failed: result.failed,
        message: result.message,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await transaction.rollback();
      
      console.error('❌ Recent import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import recent surveys from KoboToolbox',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route POST /api/import/csv
 * @desc Import data from CSV file upload
 * @access Private (requires authentication)
 */
router.post('/csv',
  authenticate,
  importRateLimit,
  upload.single('file'),
  validateCsvUpload,
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
          details: 'Please select a CSV file to upload'
        });
      }
      
      console.log(`🚀 Starting CSV import from file: ${req.file.originalname}`);
      
      const importService = new DataImportService();
      const result = await importService.importFromCsv(req.file.path, transaction);
      
      await transaction.commit();
      
      console.log(`✅ CSV import completed:`, result);
      
      res.json({
        success: result.success,
        imported: result.imported,
        failed: result.failed,
        message: result.message,
        filename: req.file.originalname,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await transaction.rollback();
      
      console.error('❌ CSV import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import CSV file',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route POST /api/import/external
 * @desc Import data from external API
 * @access Private (requires authentication)
 */
router.post('/external',
  authenticate,
  importRateLimit,
  validateExternalApiImport,
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { url, apiKey, method = 'GET' } = req.body;
      
      console.log(`🚀 Starting external API import from: ${url}`);
      
      const importService = new DataImportService();
      // For now, use a placeholder for external API import - this needs to be implemented
      const result = {
        success: false,
        imported: 0,
        failed: 1,
        message: 'External API import functionality not yet implemented in DataImportService'
      };
      
      await transaction.commit();
      
      console.log(`✅ External API import completed:`, result);
      
      res.json({
        success: result.success,
        imported: result.imported,
        failed: result.failed,
        message: result.message,
        sourceUrl: url,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await transaction.rollback();
      
      console.error('❌ External API import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import from external API',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route GET /api/import/health
 * @desc Health check for import service
 * @access Public
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      service: 'DataImportService',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'DataImportService',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/import/status
 * @desc Get import service status and statistics
 * @access Private (requires authentication)
 */
router.get('/status',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      // Get import statistics from database
      const { Survey } = require('../models');
      
      const totalSurveys = await Survey.count();
      const recentSurveys = await Survey.count({
        where: {
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
      
      res.json({
        status: 'ready',
        message: 'Import service is operational',
        statistics: {
          totalSurveys,
          recentSurveys,
          lastUpdated: new Date().toISOString()
        },
        endpoints: {
          koboSurveys: '/api/import/kobo/surveys',
          koboRecent: '/api/import/kobo/surveys/recent',
          csvUpload: '/api/import/csv',
          externalApi: '/api/import/external'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Status check error:', error);
      res.status(500).json({
        status: 'error',
        error: 'Failed to get import status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route POST /api/import/external-api
 * @desc Import data from external API
 * @access Private (requires authentication)
 */
router.post('/external-api',
  authenticate,
  importRateLimit,
  validateExternalApiImport,
  async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { apiUrl, apiKey, dataMapping } = req.body;
      
      console.log(`🌐 Starting external API import from: ${apiUrl}`);
      
      const dataImportService = new DataImportService();
      const result = await dataImportService.importFromExternalApi(
        apiUrl,
        apiKey,
        dataMapping,
        transaction
      );
      
      await transaction.commit();
      
      console.log(`✅ External API import completed:`, result);
      
      res.json({
        success: result.success,
        imported: result.imported,
        failed: result.failed,
        message: result.message,
        apiUrl,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await transaction.rollback();
      
      console.error('❌ External API import error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to import from external API',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * @route DELETE /api/import/clear-surveys
 * @desc Clear all surveys and facilities (development only)
 * @access Private (requires authentication)
 */
router.delete('/clear-surveys',
  authenticate,
  async (req: Request, res: Response) => {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Clear operation not allowed in production',
        timestamp: new Date().toISOString()
      });
    }
    
    const transaction = await sequelize.transaction();
    
    try {
      console.log('🗑️ Clearing existing surveys and facilities for fresh import...');
      
      const { Survey, Facility } = require('../models');
      
      const deletedSurveys = await Survey.destroy({ where: {}, transaction });
      const deletedFacilities = await Facility.destroy({ where: {}, transaction });
      
      await transaction.commit();
      
      console.log(`✅ Cleared ${deletedSurveys} surveys and ${deletedFacilities} facilities`);
      
      res.json({
        success: true,
        message: `Cleared ${deletedSurveys} surveys and ${deletedFacilities} facilities`,
        deletedSurveys,
        deletedFacilities,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await transaction.rollback();
      
      console.error('❌ Clear error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear existing data',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
