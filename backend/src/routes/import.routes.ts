import express from 'express';
import { Request, Response } from 'express';
import { DataImportService } from '../services/dataImportService';

const router = express.Router();
const importService = new DataImportService();

// Import surveys from KoboToolbox by date range
router.post('/kobo/surveys', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    
    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: startDate and endDate are required' 
      });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Please use ISO date strings.' 
      });
    }

    console.log(`🚀 Starting KoboToolbox import for ${start.toISOString()} to ${end.toISOString()}`);
    
    // Trigger import
    const result = await importService.importSurveysByDateRange(start, end);
    
    console.log(`✅ Import completed:`, result);
    
    res.json({
      success: result.success,
      imported: result.imported,
      failed: result.failed,
      message: result.message,
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({ 
      error: 'Failed to import surveys from KoboToolbox',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Import surveys from KoboToolbox (default: last 30 days)
router.post('/kobo/surveys/recent', async (req: Request, res: Response) => {
  try {
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log(`🚀 Starting recent KoboToolbox import for last 30 days`);
    
    const result = await importService.importSurveysByDateRange(startDate, endDate);
    
    console.log(`✅ Recent import completed:`, result);
    
    res.json({
      success: result.success,
      imported: result.imported,
      failed: result.failed,
      message: result.message,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Recent import error:', error);
    res.status(500).json({ 
      error: 'Failed to import recent surveys from KoboToolbox',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get import status/history (placeholder for future implementation)
router.get('/status', async (req: Request, res: Response) => {
  try {
    // For now, return a simple status
    res.json({
      status: 'ready',
      message: 'Import service is ready to process requests',
      lastImport: null // TODO: Implement import history tracking
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to get import status'
    });
  }
});

// Health check for import service
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      service: 'DataImportService',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Import service health check failed'
    });
  }
});

// Clear existing surveys and facilities for fresh import
router.delete('/clear-surveys', async (req: Request, res: Response) => {
  try {
    console.log('🗑️ Clearing existing surveys and facilities for fresh import...');
    
    // Import models
    const { Survey, Facility } = require('../models');
    
    // Delete all surveys and facilities (cascading will handle related data)
    const deletedSurveys = await Survey.destroy({ where: {} });
    const deletedFacilities = await Facility.destroy({ where: {} });
    
    console.log(`✅ Cleared ${deletedSurveys} surveys and ${deletedFacilities} facilities`);
    
    res.json({
      success: true,
      message: `Cleared ${deletedSurveys} surveys and ${deletedFacilities} facilities`,
      deletedSurveys,
      deletedFacilities
    });
    
  } catch (error) {
    console.error('❌ Clear error:', error);
    res.status(500).json({ 
      error: 'Failed to clear existing data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
