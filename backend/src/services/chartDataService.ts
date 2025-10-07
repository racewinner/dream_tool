import { surveyAnalysis } from './surveyAnalysisService';
import { sequelize } from '../models';
import { QueryTypes } from 'sequelize';

/**
 * Interface for chart data point
 */
interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * Interface for line/time series data
 */
interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

/**
 * Interface for multi-series chart data
 */
interface MultiSeriesData {
  series: string;
  label: string;
  value: number;
}

/**
 * Interface for geographical data points
 */
interface GeoDataPoint {
  latitude: number;
  longitude: number;
  label: string;
  value: number;
  color?: string;
}

/**
 * Interface for repeatable group visualization data
 */
interface RepeatGroupChartData {
  groupPath: string;
  instanceCount: number;
  completenessData: ChartDataPoint[];
  consistencyScore: number;
}

/**
 * Chart data collection for visualizing survey analysis
 */
interface SurveyVisualizationData {
  completenessChart: ChartDataPoint[];
  qualityChart: ChartDataPoint[];
  facilityDistributionChart: ChartDataPoint[];
  dateDistributionChart: TimeSeriesDataPoint[];
  repeatGroupsChart: RepeatGroupChartData[];
  missingFieldsChart: ChartDataPoint[];
  geoDistributionChart: GeoDataPoint[];
}

/**
 * Service for generating chart-ready data from survey analysis
 */
export class ChartDataService {
  private static instance: ChartDataService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ChartDataService {
    if (!ChartDataService.instance) {
      ChartDataService.instance = new ChartDataService();
    }
    return ChartDataService.instance;
  }

  /**
   * Generate visualization data for surveys in a date range
   * @param startDate Beginning of date range
   * @param endDate End of date range
   * @returns Visualization data ready for charting
   */
  public async generateVisualizationData(
    startDate: Date, 
    endDate: Date
  ): Promise<SurveyVisualizationData> {
    // Get analysis results first
    const analysisResult = await surveyAnalysis.analyzeRecentImports(startDate, endDate);
    
    return {
      completenessChart: this.generateCompletenessChart(analysisResult),
      qualityChart: this.generateQualityChart(analysisResult),
      facilityDistributionChart: this.generateFacilityDistributionChart(analysisResult),
      dateDistributionChart: this.generateDateDistributionChart(analysisResult),
      repeatGroupsChart: this.generateRepeatGroupsChart(analysisResult),
      missingFieldsChart: this.generateMissingFieldsChart(analysisResult),
      geoDistributionChart: await this.generateGeoDistributionChart()
    };
  }

  /**
   * Generate completeness score chart data
   * @param analysisResult Analysis result
   * @returns Chart data for completeness visualization
   */
  private generateCompletenessChart(analysisResult: any): ChartDataPoint[] {
    return [
      {
        label: 'Complete',
        value: analysisResult.completenessScore
      },
      {
        label: 'Incomplete',
        value: 100 - analysisResult.completenessScore
      }
    ];
  }

  /**
   * Generate quality score chart data
   * @param analysisResult Analysis result
   * @returns Chart data for quality visualization
   */
  private generateQualityChart(analysisResult: any): ChartDataPoint[] {
    return [
      {
        label: 'High Quality',
        value: analysisResult.dataQualityScore
      },
      {
        label: 'Quality Issues',
        value: 100 - analysisResult.dataQualityScore
      }
    ];
  }

  /**
   * Generate facility distribution chart data
   * @param analysisResult Analysis result
   * @returns Chart data for facility distribution
   */
  private generateFacilityDistributionChart(analysisResult: any): ChartDataPoint[] {
    return Object.entries(analysisResult.facilityDistribution)
      .map(([facility, count]) => ({
        label: facility,
        value: count as number
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Generate date distribution chart data
   * @param analysisResult Analysis result
   * @returns Chart data for time-series visualization
   */
  private generateDateDistributionChart(analysisResult: any): TimeSeriesDataPoint[] {
    return Object.entries(analysisResult.dateDistribution)
      .map(([date, count]) => ({
        date,
        value: count as number
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate repeat groups chart data
   * @param analysisResult Analysis result
   * @returns Chart data for repeat groups visualization
   */
  private generateRepeatGroupsChart(analysisResult: any): RepeatGroupChartData[] {
    if (!analysisResult.repeatGroups || !Array.isArray(analysisResult.repeatGroups)) {
      return [];
    }

    return analysisResult.repeatGroups.map((group: any) => {
      // Convert per-instance completeness to chart data points
      const completenessData = [];
      const fieldsPerInstance = group.fieldsPerInstance || [];
      
      // Create data points for min/max/avg completeness
      completenessData.push({ 
        label: 'Minimum', 
        value: Math.round(group.minCompleteness || 0) 
      });
      completenessData.push({ 
        label: 'Average', 
        value: Math.round(group.avgCompleteness || 0) 
      });
      completenessData.push({ 
        label: 'Maximum', 
        value: Math.round(group.maxCompleteness || 0) 
      });
      
      return {
        groupPath: group.path,
        instanceCount: group.instances,
        completenessData,
        consistencyScore: Math.round(group.consistencyScore || 0)
      };
    });
  }

  /**
   * Generate missing fields chart data
   * @param analysisResult Analysis result
   * @returns Chart data for missing fields visualization
   */
  private generateMissingFieldsChart(analysisResult: any): ChartDataPoint[] {
    if (!analysisResult.missingFields || !Array.isArray(analysisResult.missingFields)) {
      return [];
    }
    
    // Count occurrences of each missing field path
    const fieldCounts: Record<string, number> = {};
    analysisResult.missingFields.forEach((field: string) => {
      const simplifiedField = field.split('.').pop() || field;
      fieldCounts[simplifiedField] = (fieldCounts[simplifiedField] || 0) + 1;
    });
    
    return Object.entries(fieldCounts)
      .map(([field, count]) => ({
        label: field,
        value: count as number
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Generate geographical distribution chart data
   * @returns Chart data for geo visualization
   */
  private async generateGeoDistributionChart(): Promise<GeoDataPoint[]> {
    try {
      // Get facilities with coordinates
      const facilities = await sequelize.query(`
        SELECT name, latitude, longitude, COUNT(s.id) as survey_count
        FROM facilities f
        LEFT JOIN surveys s ON f.id = s.facility_id
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY name, latitude, longitude
      `, { type: QueryTypes.SELECT });
      
      return facilities.map((f: any) => {
        // Generate color based on survey count (more surveys = darker color)
        const intensity = Math.min(255, Math.max(100, 255 - (f.survey_count * 20)));
        const color = `rgb(65, ${intensity}, 244)`;
        
        return {
          latitude: f.latitude,
          longitude: f.longitude,
          label: f.name,
          value: f.survey_count,
          color
        };
      });
    } catch (error) {
      console.error('Error generating geo data:', error);
      return [];
    }
  }
}

// Export singleton instance
export const chartDataService = ChartDataService.getInstance();
