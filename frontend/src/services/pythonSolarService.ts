/**
 * Python Solar Analysis Service Client for DREAM Tool
 * Enhanced solar potential analysis with advanced PV system modeling
 */

import { API_CONFIG } from '../config/api';

export interface PVSystemConfig {
  panel_rating: number;
  num_panels: number;
  system_losses?: number;
  inverter_efficiency?: number;
  module_efficiency?: number;
  temperature_coefficient?: number;
  tilt_angle?: number;
  azimuth_angle?: number;
}

export interface SolarAnalysisRequest {
  facility_id: number;
  latitude: number;
  longitude: number;
  pv_system: PVSystemConfig;
  analysis_period_days?: number;
}

export interface SolarAnalysisResult {
  success: boolean;
  data?: {
    facility_id: number;
    location: {
      latitude: number;
      longitude: number;
    };
    system_configuration: {
      panel_rating_w: number;
      num_panels: number;
      total_capacity_kw: number;
      system_losses_percent: number;
      inverter_efficiency_percent: number;
      tilt_angle_degrees: number;
      orientation: string;
    };
    energy_production: {
      daily_average_kwh: number;
      monthly_production_kwh: number[];
      yearly_total_kwh: number;
      specific_yield_kwh_per_kwp: number;
    };
    performance_metrics: {
      system_efficiency_percent: number;
      performance_ratio_percent: number;
      capacity_factor_percent: number;
      temperature_impact_percent: number;
      shading_impact_factor: number;
    };
    solar_resource: {
      irradiation_data: {
        daily_average: number;
        yearly_total: number;
        peak_sun_hours: number;
      };
      weather_summary: {
        average_temperature: number;
        average_irradiation: number;
        total_days: number;
        analysis_period: number;
      };
    };
    environmental_impact: {
      co2_reduction_tons_per_year: number;
      equivalent_trees_planted: number;
      diesel_offset_liters_per_year: number;
    };
    financial_overview: {
      estimated_annual_savings_usd: number;
      payback_period_years: number;
      lifetime_generation_kwh: number;
    };
  };
  message?: string;
  processing_time?: number;
}

export interface SystemOptimizationRequest {
  latitude: number;
  longitude: number;
  available_area: number;
  budget_constraints?: Record<string, number>;
}

export interface SystemOptimizationResult {
  success: boolean;
  data?: {
    optimized_configuration: {
      panel_rating: number;
      num_panels: number;
      system_capacity_kw: number;
      estimated_daily_production: number;
      area_utilization: number;
    };
    location: {
      latitude: number;
      longitude: number;
    };
    constraints: {
      available_area_m2: number;
      budget_constraints?: Record<string, number>;
    };
    recommendations: {
      install_capacity_kw: number;
      estimated_annual_production: number;
      area_utilization_percent: number;
    };
  };
  message?: string;
}

export interface IrradianceData {
  success: boolean;
  data?: {
    location: {
      latitude: number;
      longitude: number;
    };
    panel_orientation: {
      tilt_angle_degrees: number;
      azimuth_angle_degrees: number;
    };
    irradiance_data: {
      global_horizontal_irradiance_kwh_m2_day: number;
      direct_normal_irradiance_kwh_m2_day: number;
      diffuse_horizontal_irradiance_kwh_m2_day: number;
      plane_of_array_irradiance_kwh_m2_day: number;
    };
    solar_metrics: {
      peak_sun_hours: number;
      annual_irradiance_kwh_m2: number;
      solar_resource_quality: string;
    };
  };
  message?: string;
}

export interface SystemComparison {
  success: boolean;
  data?: {
    location: {
      latitude: number;
      longitude: number;
    };
    systems_compared: number;
    comparison_results: Array<{
      configuration_id: string;
      system_specs: {
        panel_rating_w: number;
        num_panels: number;
        total_capacity_kw: number;
      };
      performance_estimate: {
        daily_production_kwh: number;
        yearly_production_kwh: number;
        specific_yield_kwh_per_kwp: number;
        capacity_factor_percent: number;
      };
    }>;
    recommended_system: {
      configuration_id: string;
      system_specs: {
        panel_rating_w: number;
        num_panels: number;
        total_capacity_kw: number;
      };
      performance_estimate: {
        daily_production_kwh: number;
        yearly_production_kwh: number;
        specific_yield_kwh_per_kwp: number;
        capacity_factor_percent: number;
      };
    };
    summary: {
      best_yearly_production_kwh: number;
      best_configuration: string;
    };
  };
  message?: string;
}

export interface OptimalTiltResult {
  success: boolean;
  data?: {
    latitude: number;
    optimal_tilt_angle_degrees: number;
    seasonal_adjustments: {
      winter_tilt_degrees: number;
      summer_tilt_degrees: number;
      seasonal_benefit_percent: number;
    };
    orientation_recommendation: {
      azimuth_degrees: number;
      direction: string;
    };
    installation_notes: string[];
  };
  message?: string;
}

class PythonSolarService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/solar`;
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
   * Perform comprehensive solar potential analysis
   */
  async analyzeSolarPotential(request: SolarAnalysisRequest): Promise<SolarAnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<SolarAnalysisResult>(response);
    } catch (error) {
      console.error('Failed to analyze solar potential:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze solar potential'
      };
    }
  }

  /**
   * Quick solar analysis for an existing facility
   */
  async analyzeFacilitySolarPotential(
    facilityId: number,
    panelRating: number = 400,
    numPanels: number = 50
  ): Promise<SolarAnalysisResult> {
    try {
      const params = new URLSearchParams({
        panel_rating: panelRating.toString(),
        num_panels: numPanels.toString()
      });

      const response = await fetch(`${this.baseUrl}/analyze/${facilityId}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<SolarAnalysisResult>(response);
    } catch (error) {
      console.error('Failed to analyze facility solar potential:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze facility solar potential'
      };
    }
  }

  /**
   * Optimize PV system configuration for given constraints
   */
  async optimizeSystemConfiguration(request: SystemOptimizationRequest): Promise<SystemOptimizationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/optimize`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<SystemOptimizationResult>(response);
    } catch (error) {
      console.error('Failed to optimize system configuration:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to optimize system configuration'
      };
    }
  }

  /**
   * Get solar irradiance data for a specific location and panel orientation
   */
  async getSolarIrradianceData(
    latitude: number,
    longitude: number,
    tiltAngle: number = 30,
    azimuthAngle: number = 180
  ): Promise<IrradianceData> {
    try {
      const params = new URLSearchParams({
        tilt_angle: tiltAngle.toString(),
        azimuth_angle: azimuthAngle.toString()
      });

      const response = await fetch(
        `${this.baseUrl}/irradiance/${latitude}/${longitude}?${params}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse<IrradianceData>(response);
    } catch (error) {
      console.error('Failed to get solar irradiance data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get solar irradiance data'
      };
    }
  }

  /**
   * Compare performance of different PV system configurations
   */
  async compareSystemPerformance(
    latitude: number,
    longitude: number,
    systems: string
  ): Promise<SystemComparison> {
    try {
      const params = new URLSearchParams({
        systems
      });

      const response = await fetch(
        `${this.baseUrl}/performance/comparison?latitude=${latitude}&longitude=${longitude}&${params}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      return this.handleResponse<SystemComparison>(response);
    } catch (error) {
      console.error('Failed to compare system performance:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to compare system performance'
      };
    }
  }

  /**
   * Calculate optimal tilt angle for a given latitude
   */
  async getOptimalTiltAngle(latitude: number): Promise<OptimalTiltResult> {
    try {
      const response = await fetch(`${this.baseUrl}/optimal-tilt/${latitude}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<OptimalTiltResult>(response);
    } catch (error) {
      console.error('Failed to get optimal tilt angle:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get optimal tilt angle'
      };
    }
  }

  /**
   * Validate PV system configuration
   */
  validatePVSystemConfig(config: PVSystemConfig): string[] {
    const errors: string[] = [];

    if (config.panel_rating <= 0) {
      errors.push('Panel rating must be greater than 0');
    }

    if (config.num_panels <= 0) {
      errors.push('Number of panels must be greater than 0');
    }

    if (config.system_losses !== undefined && (config.system_losses < 0 || config.system_losses > 50)) {
      errors.push('System losses must be between 0% and 50%');
    }

    if (config.inverter_efficiency !== undefined && (config.inverter_efficiency < 50 || config.inverter_efficiency > 100)) {
      errors.push('Inverter efficiency must be between 50% and 100%');
    }

    if (config.tilt_angle !== undefined && (config.tilt_angle < 0 || config.tilt_angle > 90)) {
      errors.push('Tilt angle must be between 0° and 90°');
    }

    if (config.azimuth_angle !== undefined && (config.azimuth_angle < 0 || config.azimuth_angle > 360)) {
      errors.push('Azimuth angle must be between 0° and 360°');
    }

    return errors;
  }

  /**
   * Calculate system capacity in kW
   */
  calculateSystemCapacity(panelRating: number, numPanels: number): number {
    return (panelRating * numPanels) / 1000;
  }

  /**
   * Calculate estimated annual production (rough estimate)
   */
  estimateAnnualProduction(
    systemCapacityKw: number,
    latitude: number,
    peakSunHours?: number
  ): number {
    // Simple estimation based on latitude and typical solar resource
    const defaultPeakSunHours = peakSunHours || this.estimatePeakSunHours(latitude);
    return systemCapacityKw * defaultPeakSunHours * 365;
  }

  /**
   * Estimate peak sun hours based on latitude (rough approximation)
   */
  private estimatePeakSunHours(latitude: number): number {
    const absLat = Math.abs(latitude);
    
    if (absLat < 10) return 5.5; // Equatorial regions
    if (absLat < 20) return 5.0; // Tropical regions
    if (absLat < 30) return 4.5; // Subtropical regions
    if (absLat < 40) return 4.0; // Temperate regions
    if (absLat < 50) return 3.5; // Higher latitude regions
    return 3.0; // Very high latitude regions
  }

  /**
   * Format solar analysis results for display
   */
  formatSolarAnalysisResults(data: SolarAnalysisResult['data']): {
    production: {
      dailyAverage: string;
      yearlyTotal: string;
      specificYield: string;
    };
    performance: {
      systemEfficiency: string;
      performanceRatio: string;
      capacityFactor: string;
    };
    environmental: {
      co2Reduction: string;
      treesEquivalent: string;
      dieselOffset: string;
    };
    financial: {
      annualSavings: string;
      paybackPeriod: string;
    };
  } | null {
    if (!data) return null;

    return {
      production: {
        dailyAverage: `${data.energy_production.daily_average_kwh.toFixed(1)} kWh`,
        yearlyTotal: `${Math.round(data.energy_production.yearly_total_kwh).toLocaleString()} kWh`,
        specificYield: `${Math.round(data.energy_production.specific_yield_kwh_per_kwp)} kWh/kWp/year`
      },
      performance: {
        systemEfficiency: `${data.performance_metrics.system_efficiency_percent.toFixed(1)}%`,
        performanceRatio: `${data.performance_metrics.performance_ratio_percent.toFixed(1)}%`,
        capacityFactor: `${data.performance_metrics.capacity_factor_percent.toFixed(1)}%`
      },
      environmental: {
        co2Reduction: `${data.environmental_impact.co2_reduction_tons_per_year.toFixed(1)} tons/year`,
        treesEquivalent: `${data.environmental_impact.equivalent_trees_planted.toLocaleString()} trees`,
        dieselOffset: `${Math.round(data.environmental_impact.diesel_offset_liters_per_year).toLocaleString()} L/year`
      },
      financial: {
        annualSavings: `$${Math.round(data.financial_overview.estimated_annual_savings_usd).toLocaleString()}`,
        paybackPeriod: `${data.financial_overview.payback_period_years.toFixed(1)} years`
      }
    };
  }

  /**
   * Generate system configuration string for comparison
   */
  generateSystemConfigString(configs: Array<{ panelRating: number; numPanels: number }>): string {
    return configs.map(config => `${config.panelRating}x${config.numPanels}`).join(',');
  }
}

// Export singleton instance
export const pythonSolarService = new PythonSolarService();
export default pythonSolarService;
