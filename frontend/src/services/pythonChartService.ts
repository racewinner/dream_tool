/**
 * Python Chart Data Service Client for DREAM Tool
 * Enhanced data visualization API client with comprehensive chart data generation
 */

import { API_CONFIG } from '../config/api';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  series?: string;
}

export interface GeoDataPoint {
  latitude: number;
  longitude: number;
  label: string;
  value: number;
  color?: string;
  popup_data?: Record<string, any>;
}

export interface RepeatGroupChartData {
  group_path: string;
  instance_count: number;
  completeness_data: ChartDataPoint[];
  consistency_score: number;
  field_distribution?: ChartDataPoint[];
}

export interface SurveyVisualizationData {
  completeness_chart: ChartDataPoint[];
  quality_chart: ChartDataPoint[];
  facility_distribution_chart: ChartDataPoint[];
  date_distribution_chart: TimeSeriesDataPoint[];
  repeat_groups_chart: RepeatGroupChartData[];
  missing_fields_chart: ChartDataPoint[];
  geo_distribution_chart: GeoDataPoint[];
  statistical_summary: Record<string, any>;
  data_quality_metrics: Record<string, number>;
}

export interface EnergyVisualizationData {
  load_profile_chart: TimeSeriesDataPoint[];
  equipment_breakdown_chart: ChartDataPoint[];
  monthly_consumption_chart: TimeSeriesDataPoint[];
  efficiency_metrics_chart: ChartDataPoint[];
  cost_comparison_chart: ChartDataPoint[];
}

export interface SolarVisualizationData {
  monthly_production_chart: TimeSeriesDataPoint[];
  irradiation_heatmap: Array<Record<string, any>>;
  performance_metrics_chart: ChartDataPoint[];
  system_efficiency_chart: TimeSeriesDataPoint[];
}

export interface ChartDataRequest {
  start_date: string;
  end_date: string;
  facility_ids?: number[];
}

export interface EnergyChartRequest {
  facility_id: number;
  analysis_period?: string;
}

export interface SolarChartRequest {
  facility_id: number;
  system_config: Record<string, any>;
}

export interface ChartDataResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  chart_count?: number;
}

export interface ChartTemplate {
  type: string;
  options: Record<string, any>;
  colors?: string[];
  marker_styles?: Record<string, any>;
}

export interface ColorPalettes {
  palettes: Record<string, string[]>;
  usage_guidelines: Record<string, string>;
}

class PythonChartService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/chart-data`;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Generate comprehensive survey visualization data
   */
  async generateSurveyVisualizationData(request: ChartDataRequest): Promise<ChartDataResponse<SurveyVisualizationData>> {
    try {
      const response = await fetch(`${this.baseUrl}/survey-visualization`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<ChartDataResponse<SurveyVisualizationData>>(response);
    } catch (error) {
      console.error('Failed to generate survey visualization data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate survey visualization data'
      };
    }
  }

  /**
   * Generate energy analysis visualization data
   */
  async generateEnergyVisualizationData(request: EnergyChartRequest): Promise<ChartDataResponse<EnergyVisualizationData>> {
    try {
      const response = await fetch(`${this.baseUrl}/energy-visualization`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<ChartDataResponse<EnergyVisualizationData>>(response);
    } catch (error) {
      console.error('Failed to generate energy visualization data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate energy visualization data'
      };
    }
  }

  /**
   * Generate solar analysis visualization data
   */
  async generateSolarVisualizationData(request: SolarChartRequest): Promise<ChartDataResponse<SolarVisualizationData>> {
    try {
      const response = await fetch(`${this.baseUrl}/solar-visualization`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<ChartDataResponse<SolarVisualizationData>>(response);
    } catch (error) {
      console.error('Failed to generate solar visualization data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate solar visualization data'
      };
    }
  }

  /**
   * Get quick survey summary charts for dashboard
   */
  async getSurveySummaryCharts(
    days: number = 30,
    facilityId?: number
  ): Promise<ChartDataResponse<{
    completeness_overview: Record<string, any>;
    quality_overview: Record<string, any>;
    facility_distribution: ChartDataPoint[];
    recent_trends: TimeSeriesDataPoint[];
  }>> {
    try {
      const params = new URLSearchParams({
        days: days.toString(),
        ...(facilityId && { facility_id: facilityId.toString() })
      });

      const response = await fetch(`${this.baseUrl}/survey-summary?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<ChartDataResponse>(response);
    } catch (error) {
      console.error('Failed to get survey summary charts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get survey summary charts'
      };
    }
  }

  /**
   * Get energy summary charts for a specific facility
   */
  async getEnergySummaryCharts(facilityId: number): Promise<ChartDataResponse<{
    consumption_overview: Record<string, any>;
    equipment_breakdown: ChartDataPoint[];
    efficiency_metrics: ChartDataPoint[];
    cost_analysis: ChartDataPoint[];
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/energy-summary/${facilityId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<ChartDataResponse>(response);
    } catch (error) {
      console.error('Failed to get energy summary charts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get energy summary charts'
      };
    }
  }

  /**
   * Get chart configuration templates
   */
  async getChartTemplates(): Promise<ChartDataResponse<Record<string, ChartTemplate>>> {
    try {
      const response = await fetch(`${this.baseUrl}/chart-templates`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<ChartDataResponse<Record<string, ChartTemplate>>>(response);
    } catch (error) {
      console.error('Failed to get chart templates:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get chart templates'
      };
    }
  }

  /**
   * Get available color palettes for charts
   */
  async getColorPalettes(): Promise<ChartDataResponse<ColorPalettes>> {
    try {
      const response = await fetch(`${this.baseUrl}/color-palettes`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<ChartDataResponse<ColorPalettes>>(response);
    } catch (error) {
      console.error('Failed to get color palettes:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get color palettes'
      };
    }
  }

  /**
   * Prepare chart.js configuration for pie charts
   */
  prepareChartJsPieConfig(data: ChartDataPoint[], title?: string) {
    return {
      type: 'pie' as const,
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          data: data.map(item => item.value),
          backgroundColor: data.map(item => item.color || '#1f77b4'),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'right' as const
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
  }

  /**
   * Prepare chart.js configuration for bar charts
   */
  prepareChartJsBarConfig(data: ChartDataPoint[], title?: string) {
    return {
      type: 'bar' as const,
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          label: title || 'Values',
          data: data.map(item => item.value),
          backgroundColor: data.map(item => item.color || '#1f77b4'),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  /**
   * Prepare chart.js configuration for line charts
   */
  prepareChartJsLineConfig(data: TimeSeriesDataPoint[], title?: string) {
    return {
      type: 'line' as const,
      data: {
        labels: data.map(item => item.date),
        datasets: [{
          label: title || 'Values',
          data: data.map(item => item.value),
          borderColor: '#1f77b4',
          backgroundColor: 'rgba(31, 119, 180, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!title,
            text: title
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  /**
   * Convert chart data to CSV format
   */
  convertToCSV(data: ChartDataPoint[], filename: string = 'chart_data.csv'): void {
    const headers = ['Label', 'Value', 'Color'];
    const rows = data.map(item => [
      item.label,
      item.value.toString(),
      item.color || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Convert time series data to CSV format
   */
  convertTimeSeriesToCSV(data: TimeSeriesDataPoint[], filename: string = 'timeseries_data.csv'): void {
    const headers = ['Date', 'Value', 'Series'];
    const rows = data.map(item => [
      item.date,
      item.value.toString(),
      item.series || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Validate date range for chart requests
   */
  validateDateRange(startDate: string, endDate: string): string[] {
    const errors: string[] = [];
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime())) {
        errors.push('Invalid start date format');
      }
      
      if (isNaN(end.getTime())) {
        errors.push('Invalid end date format');
      }
      
      if (start > end) {
        errors.push('Start date must be before end date');
      }
      
      if (end > new Date()) {
        errors.push('End date cannot be in the future');
      }
      
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        errors.push('Date range cannot exceed 365 days');
      }
    } catch (error) {
      errors.push('Invalid date format');
    }
    
    return errors;
  }

  /**
   * Get default color palette
   */
  getDefaultColors(): string[] {
    return [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
  }

  /**
   * Generate color palette for data series
   */
  generateColorPalette(count: number, paletteType: 'primary' | 'quality' | 'temperature' | 'energy' = 'primary'): string[] {
    const palettes = {
      primary: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
      quality: ['#4CAF50', '#FFC107', '#FF5722'],
      temperature: ['#2196F3', '#03DAC6', '#FF9800', '#F44336'],
      energy: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107']
    };

    const basePalette = palettes[paletteType];
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      colors.push(basePalette[i % basePalette.length]);
    }

    return colors;
  }
}

// Export singleton instance
export const pythonChartService = new PythonChartService();
export default pythonChartService;
