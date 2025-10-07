import { Request, Response } from 'express';
import { Survey, Facility } from '../models';
import { Op } from 'sequelize';

/**
 * Controller for metrics-related endpoints
 * Provides aggregated data for dashboard and section-specific metrics
 */
export class MetricsController {
  /**
   * Get all aggregated metrics for main dashboard
   */
  public async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      // Combine metrics from all sections into a single response
      const [dataMetrics, designMetrics, pvSiteMetrics, maintenanceMetrics, reportMetrics] = 
        await Promise.all([
          this.fetchDataMetrics(),
          this.fetchDesignMetrics(),
          this.fetchPVSiteMetrics(),
          this.fetchMaintenanceMetrics(),
          this.fetchReportMetrics()
        ]);
      
      res.status(200).json({
        success: true,
        data: {
          dataMetrics,
          designMetrics,
          pvSiteMetrics,
          maintenanceMetrics,
          reportMetrics,
          settings: {
            userAccounts: 5, // Placeholder - would come from user service
            activeIntegrations: 2, // Placeholder - would come from integration service
            lastConfiguration: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get metrics related to data section
   */
  public async getDataMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.fetchDataMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching data metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch data metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get metrics related to design section
   */
  public async getDesignMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.fetchDesignMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching design metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch design metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get metrics related to PV Sites section
   */
  public async getPVSiteMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.fetchPVSiteMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching PV site metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch PV site metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get metrics related to maintenance section
   */
  public async getMaintenanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.fetchMaintenanceMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching maintenance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch maintenance metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get metrics related to reports section
   */
  public async getReportMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.fetchReportMetrics();
      res.status(200).json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching report metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch report metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Helper method to fetch data section metrics
   * @private
   */
  private async fetchDataMetrics(): Promise<any> {
    // Count surveys
    const surveyCount = await Survey.count();
    
    // Get last import date from the most recent survey
    const latestSurvey = await Survey.findOne({
      order: [['createdAt', 'DESC']]
    });

    // Calculate data completeness (placeholder implementation)
    // In a real implementation, this would analyze survey responses for completeness
    const completenessPercentage = Math.min(95, Math.floor(Math.random() * 20) + 75);

    return {
      surveysImported: surveyCount,
      dataCompleteness: `${completenessPercentage}%`,
      lastImport: latestSurvey ? latestSurvey.createdAt : 'No imports yet'
    };
  }

  /**
   * Helper method to fetch design section metrics
   * @private
   */
  private async fetchDesignMetrics(): Promise<any> {
    // Placeholder for design metrics
    // In a real implementation, this would query the designs table
    return {
      designsCreated: Math.floor(Math.random() * 30) + 5,
      designOptimizations: Math.floor(Math.random() * 20) + 10,
      averageEfficiency: `${(Math.random() * 10 + 85).toFixed(1)}%`
    };
  }

  /**
   * Helper method to fetch PV site metrics
   * @private
   */
  private async fetchPVSiteMetrics(): Promise<any> {
    // Count facilities (PV sites)
    const facilityCount = await Facility.count();
    
    // Count active sites (placeholder implementation)
    const activeSites = await Facility.count({
      where: {
        status: 'active' // Assuming a status field exists
      }
    });

    return {
      totalSites: facilityCount,
      activeSites: activeSites || Math.floor(facilityCount * 0.8), // Fallback if status field doesn't exist
      avgGeneration: `${(Math.random() * 100 + 150).toFixed(1)} kWh`
    };
  }

  /**
   * Helper method to fetch maintenance metrics
   * @private
   */
  private async fetchMaintenanceMetrics(): Promise<any> {
    // Placeholder for maintenance metrics
    // In a real implementation, this would query the maintenance tickets table
    return {
      openTickets: Math.floor(Math.random() * 15),
      scheduledVisits: Math.floor(Math.random() * 10) + 2,
      systemHealth: `${Math.floor(Math.random() * 15) + 85}%`
    };
  }

  /**
   * Helper method to fetch report metrics
   * @private
   */
  private async fetchReportMetrics(): Promise<any> {
    // Placeholder for report metrics
    // In a real implementation, this would query the reports table
    return {
      generatedThisMonth: Math.floor(Math.random() * 20) + 5,
      availableTemplates: Math.floor(Math.random() * 10) + 5,
      lastGenerated: '1 day ago'
    };
  }

  /**
   * Get summary metrics for overview
   */
  public async getSummaryMetrics(req: Request, res: Response): Promise<void> {
    try {
      const summaryData = {
        totalSites: Math.floor(Math.random() * 50) + 10,
        totalCapacity: `${(Math.random() * 500 + 100).toFixed(1)} MW`,
        activeAlerts: Math.floor(Math.random() * 5),
        systemEfficiency: `${(Math.random() * 10 + 85).toFixed(1)}%`,
        monthlyGeneration: `${(Math.random() * 1000 + 500).toFixed(0)} MWh`,
        lastUpdated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: summaryData
      });
    } catch (error) {
      console.error('Error fetching summary metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch summary metrics'
      });
    }
  }

  /**
   * Get solar-specific metrics
   */
  public async getSolarMetrics(req: Request, res: Response): Promise<void> {
    try {
      const solarData = {
        currentGeneration: `${(Math.random() * 100 + 50).toFixed(1)} MW`,
        dailyPeak: `${(Math.random() * 150 + 100).toFixed(1)} MW`,
        weatherConditions: 'Sunny',
        irradiance: `${(Math.random() * 200 + 800).toFixed(0)} W/m²`,
        temperature: `${(Math.random() * 10 + 25).toFixed(1)}°C`,
        performanceRatio: `${(Math.random() * 5 + 90).toFixed(1)}%`,
        lastUpdated: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: solarData
      });
    } catch (error) {
      console.error('Error fetching solar metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch solar metrics'
      });
    }
  }
}
