import { Request, Response } from 'express';
import { chartDataService } from '../services/chartDataService';

/**
 * Controller for survey visualization endpoints
 */
export class VisualizationController {
  /**
   * Get visualization data for surveys in a date range
   * @param req Express request
   * @param res Express response
   */
  public async getSurveyVisualizations(req: Request, res: Response): Promise<void> {
    try {
      // Parse date parameters, defaulting to last 30 days if not provided
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days prior
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid date format. Use ISO format (YYYY-MM-DD)'
        });
        return;
      }
      
      // Get visualization data
      const visualizationData = await chartDataService.generateVisualizationData(
        startDate, 
        endDate
      );
      
      res.json({
        success: true,
        data: visualizationData,
        meta: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    } catch (error: unknown) {
      console.error('Error generating visualization data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate visualization data',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get facility distribution chart data
   * @param req Express request
   * @param res Express response
   */
  public async getFacilityDistribution(req: Request, res: Response): Promise<void> {
    try {
      // Parse date parameters, defaulting to last 30 days if not provided
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days prior
      
      // Get full visualization data then extract just the facility distribution
      const visualizationData = await chartDataService.generateVisualizationData(
        startDate, 
        endDate
      );
      
      res.json({
        success: true,
        data: visualizationData.facilityDistributionChart,
        meta: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          chartType: 'bar'
        }
      });
    } catch (error: unknown) {
      console.error('Error generating facility distribution chart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate facility distribution chart',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get data quality timeline chart data
   * @param req Express request
   * @param res Express response
   */
  public async getDataQualityTimeline(req: Request, res: Response): Promise<void> {
    try {
      // Parse date parameters, defaulting to last 90 days if not provided
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(endDate.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days prior
      
      // Get full visualization data then extract just the date distribution
      const visualizationData = await chartDataService.generateVisualizationData(
        startDate, 
        endDate
      );
      
      res.json({
        success: true,
        data: visualizationData.dateDistributionChart,
        meta: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          chartType: 'line'
        }
      });
    } catch (error: unknown) {
      console.error('Error generating quality timeline chart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate quality timeline chart',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get geographical distribution of facilities
   * @param req Express request
   * @param res Express response
   */
  public async getGeoDistribution(req: Request, res: Response): Promise<void> {
    try {
      // Get full visualization data then extract just the geo distribution
      const visualizationData = await chartDataService.generateVisualizationData(
        new Date(Date.now() - (365 * 24 * 60 * 60 * 1000)), // Last year
        new Date()
      );
      
      res.json({
        success: true,
        data: visualizationData.geoDistributionChart,
        meta: {
          chartType: 'map'
        }
      });
    } catch (error: unknown) {
      console.error('Error generating geo distribution chart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate geo distribution chart',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get repeat group analysis visualization data
   * @param req Express request
   * @param res Express response
   */
  public async getRepeatGroupAnalysis(req: Request, res: Response): Promise<void> {
    try {
      // Parse date parameters, defaulting to last 30 days if not provided
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days prior
      
      // Get full visualization data then extract just the repeat groups
      const visualizationData = await chartDataService.generateVisualizationData(
        startDate, 
        endDate
      );
      
      res.json({
        success: true,
        data: visualizationData.repeatGroupsChart,
        meta: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    } catch (error: unknown) {
      console.error('Error generating repeat group analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate repeat group analysis',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Export controller instance
export const visualizationController = new VisualizationController();
