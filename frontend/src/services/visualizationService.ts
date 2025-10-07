import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Interface for chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * Interface for time series data
 */
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

/**
 * Interface for geographical data points
 */
export interface GeoDataPoint {
  latitude: number;
  longitude: number;
  label: string;
  value: number;
  color?: string;
}

/**
 * Interface for repeatable group visualization data
 */
export interface RepeatGroupChartData {
  groupPath: string;
  instanceCount: number;
  completenessData: ChartDataPoint[];
  consistencyScore: number;
}

/**
 * Chart data collection for visualizing survey analysis
 */
export interface SurveyVisualizationData {
  completenessChart: ChartDataPoint[];
  qualityChart: ChartDataPoint[];
  facilityDistributionChart: ChartDataPoint[];
  dateDistributionChart: TimeSeriesDataPoint[];
  repeatGroupsChart: RepeatGroupChartData[];
  missingFieldsChart: ChartDataPoint[];
  geoDistributionChart: GeoDataPoint[];
}

/**
 * Response interface for visualization API calls
 */
interface VisualizationResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  message?: string;
  error?: string;
}

/**
 * Service for fetching visualization data from API
 */
export const visualizationService = {
  /**
   * Get all survey visualizations
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Promise with visualization data
   */
  async getSurveyVisualizations(
    startDate?: Date, 
    endDate?: Date
  ): Promise<SurveyVisualizationData> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      params.append('endDate', endDate.toISOString().split('T')[0]);
    }
    
    const response = await axios.get<VisualizationResponse<SurveyVisualizationData>>(
      `${API_BASE_URL}/visualizations/surveys${params.toString() ? `?${params.toString()}` : ''}`,
      { withCredentials: true }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch visualization data');
    }
    
    return response.data.data;
  },
  
  /**
   * Get facility distribution chart data
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Promise with chart data
   */
  async getFacilityDistribution(
    startDate?: Date, 
    endDate?: Date
  ): Promise<ChartDataPoint[]> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      params.append('endDate', endDate.toISOString().split('T')[0]);
    }
    
    const response = await axios.get<VisualizationResponse<ChartDataPoint[]>>(
      `${API_BASE_URL}/visualizations/facilities${params.toString() ? `?${params.toString()}` : ''}`,
      { withCredentials: true }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch facility distribution');
    }
    
    return response.data.data;
  },
  
  /**
   * Get data quality timeline
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Promise with chart data
   */
  async getDataQualityTimeline(
    startDate?: Date, 
    endDate?: Date
  ): Promise<TimeSeriesDataPoint[]> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      params.append('endDate', endDate.toISOString().split('T')[0]);
    }
    
    const response = await axios.get<VisualizationResponse<TimeSeriesDataPoint[]>>(
      `${API_BASE_URL}/visualizations/timeline${params.toString() ? `?${params.toString()}` : ''}`,
      { withCredentials: true }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch quality timeline');
    }
    
    return response.data.data;
  },
  
  /**
   * Get geographical distribution data
   * @returns Promise with geo chart data
   */
  async getGeoDistribution(): Promise<GeoDataPoint[]> {
    const response = await axios.get<VisualizationResponse<GeoDataPoint[]>>(
      `${API_BASE_URL}/visualizations/geo`,
      { withCredentials: true }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch geo distribution');
    }
    
    return response.data.data;
  },
  
  /**
   * Get repeat group analysis data
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns Promise with repeat group chart data
   */
  async getRepeatGroupAnalysis(
    startDate?: Date, 
    endDate?: Date
  ): Promise<RepeatGroupChartData[]> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }
    
    if (endDate) {
      params.append('endDate', endDate.toISOString().split('T')[0]);
    }
    
    const response = await axios.get<VisualizationResponse<RepeatGroupChartData[]>>(
      `${API_BASE_URL}/visualizations/repeat-groups${params.toString() ? `?${params.toString()}` : ''}`,
      { withCredentials: true }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch repeat group analysis');
    }
    
    return response.data.data;
  }
};
