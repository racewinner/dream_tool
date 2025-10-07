/**
 * Python Techno-Economic Service Client for DREAM Tool
 * Enhanced financial modeling with advanced analytics capabilities
 */

import { API_CONFIG } from '../config/api';

export interface TechnoEconomicRequest {
  facility_id: number;
  daily_usage: number;
  peak_hours: number;
  stage?: 'prefeasibility' | 'tendering';
  costing_method?: 'perWatt' | 'fixedVariable' | 'componentBased';
  
  // System configuration
  battery_autonomy_factor?: number;
  battery_depth_of_discharge?: number;
  battery_type?: 'lithium' | 'lead_acid';
  inverter_efficiency?: number;
  
  // Costing parameters
  panel_cost_per_watt?: number;
  panel_cost_per_kw?: number;
  battery_cost_per_kwh?: number;
  inverter_cost_per_kw?: number;
  structure_cost_per_kw?: number;
  fixed_costs?: number;
  num_panels?: number;
  panel_rating?: number;
  
  // Financial parameters
  discount_rate?: number;
  project_lifetime?: number;
  diesel_fuel_cost?: number;
}

export interface TechnoEconomicResults {
  pv_analysis: {
    initial_cost: number;
    pv_cost: number;
    battery_cost: number;
    system_size: number;
    battery_capacity: number;
    annual_maintenance: number;
    lifecycle_cost: number;
    npv: number;
    irr: number;
    lcoe: number;
  };
  diesel_analysis: {
    initial_cost: number;
    annual_fuel_cost: number;
    annual_maintenance: number;
    daily_fuel_consumption: number;
    lifecycle_cost: number;
    npv: number;
    irr: number;
    lcoe: number;
  };
  comparison_metrics: {
    npv_difference: number;
    irr_difference: number;
    lcoe_difference: number;
    payback_period: number;
    cost_savings_20_years: number;
  };
  environmental_impact: {
    co2_reduction_kg: number;
    co2_reduction_tons: number;
    equivalent_trees_planted: number;
    diesel_offset_liters: number;
  };
}

export interface SensitivityAnalysisRequest {
  base_analysis: TechnoEconomicRequest;
  parameters: Record<string, number[]>;
}

export interface MonteCarloRequest {
  base_analysis: TechnoEconomicRequest;
  uncertainty_ranges: Record<string, [number, number]>;
  num_simulations?: number;
}

export interface TechnoEconomicResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  processing_time?: number;
}

export interface CostBenchmarks {
  region: string;
  benchmarks: {
    pv_costs: {
      panel_cost_per_watt: { min: number; typical: number; max: number };
      battery_cost_per_kwh: { min: number; typical: number; max: number };
      inverter_cost_per_kw: { min: number; typical: number; max: number };
    };
    diesel_costs: {
      fuel_cost_per_liter: { min: number; typical: number; max: number };
      generator_cost_per_kw: { min: number; typical: number; max: number };
    };
    financial_parameters: {
      discount_rate: { min: number; typical: number; max: number };
      inflation_rate: { min: number; typical: number; max: number };
    };
    solar_resource: {
      peak_sun_hours: { min: number; typical: number; max: number };
      seasonal_variation: number;
    };
  };
  last_updated: string;
  currency: string;
}

export interface FinancialMetricDefinition {
  name: string;
  definition: string;
  interpretation: string;
  formula: string;
  units: string;
}

class PythonTechnoEconomicService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/techno-economic`;
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
   * Perform comprehensive techno-economic analysis
   */
  async analyzeFacility(request: TechnoEconomicRequest): Promise<TechnoEconomicResponse<TechnoEconomicResults>> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze/${request.facility_id}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<TechnoEconomicResponse<TechnoEconomicResults>>(response);
    } catch (error) {
      console.error('Failed to analyze facility:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform techno-economic analysis'
      };
    }
  }

  /**
   * Perform sensitivity analysis
   */
  async performSensitivityAnalysis(request: SensitivityAnalysisRequest): Promise<TechnoEconomicResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/sensitivity-analysis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<TechnoEconomicResponse>(response);
    } catch (error) {
      console.error('Failed to perform sensitivity analysis:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform sensitivity analysis'
      };
    }
  }

  /**
   * Perform Monte Carlo risk analysis
   */
  async performMonteCarloAnalysis(request: MonteCarloRequest): Promise<TechnoEconomicResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/monte-carlo-analysis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return this.handleResponse<TechnoEconomicResponse>(response);
    } catch (error) {
      console.error('Failed to perform Monte Carlo analysis:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform Monte Carlo analysis'
      };
    }
  }

  /**
   * Quick techno-economic analysis with default parameters
   */
  async quickAnalysis(
    facilityId: number,
    panelRating: number = 400,
    numPanels: number = 50
  ): Promise<TechnoEconomicResponse<TechnoEconomicResults>> {
    try {
      const params = new URLSearchParams({
        panel_rating: panelRating.toString(),
        num_panels: numPanels.toString()
      });

      const response = await fetch(`${this.baseUrl}/facility/${facilityId}/quick-analysis?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<TechnoEconomicResponse<TechnoEconomicResults>>(response);
    } catch (error) {
      console.error('Failed to perform quick analysis:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform quick analysis'
      };
    }
  }

  /**
   * Get regional cost benchmarks
   */
  async getCostBenchmarks(region: string = 'somalia'): Promise<TechnoEconomicResponse<CostBenchmarks>> {
    try {
      const params = new URLSearchParams({ region });

      const response = await fetch(`${this.baseUrl}/cost-benchmarks?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<TechnoEconomicResponse<CostBenchmarks>>(response);
    } catch (error) {
      console.error('Failed to get cost benchmarks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get cost benchmarks'
      };
    }
  }

  /**
   * Get financial metrics definitions
   */
  async getFinancialMetricsDefinitions(): Promise<TechnoEconomicResponse<{
    financial_metrics: Record<string, FinancialMetricDefinition>;
    calculation_notes: string[];
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/financial-metrics/definitions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<TechnoEconomicResponse>(response);
    } catch (error) {
      console.error('Failed to get financial metrics definitions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get financial metrics definitions'
      };
    }
  }

  /**
   * Validate techno-economic request parameters
   */
  validateRequest(request: TechnoEconomicRequest): string[] {
    const errors: string[] = [];

    if (request.daily_usage <= 0) {
      errors.push('Daily usage must be greater than 0');
    }

    if (request.peak_hours <= 0 || request.peak_hours > 12) {
      errors.push('Peak hours must be between 0 and 12');
    }

    if (request.battery_autonomy_factor && (request.battery_autonomy_factor < 0.5 || request.battery_autonomy_factor > 3)) {
      errors.push('Battery autonomy factor must be between 0.5 and 3');
    }

    if (request.battery_depth_of_discharge && (request.battery_depth_of_discharge < 0.3 || request.battery_depth_of_discharge > 0.9)) {
      errors.push('Battery depth of discharge must be between 30% and 90%');
    }

    if (request.inverter_efficiency && (request.inverter_efficiency < 0.8 || request.inverter_efficiency > 0.98)) {
      errors.push('Inverter efficiency must be between 80% and 98%');
    }

    if (request.stage === 'prefeasibility' && request.costing_method === 'componentBased') {
      errors.push('Component-based costing is only available for tendering stage');
    }

    if (request.stage === 'tendering' && request.costing_method !== 'componentBased') {
      errors.push('Only component-based costing is available for tendering stage');
    }

    return errors;
  }

  /**
   * Format financial results for display
   */
  formatFinancialResults(results: TechnoEconomicResults): {
    pv: {
      initialCost: string;
      systemSize: string;
      batteryCapacity: string;
      npv: string;
      irr: string;
      lcoe: string;
      paybackPeriod: string;
    };
    diesel: {
      initialCost: string;
      annualFuelCost: string;
      npv: string;
      irr: string;
      lcoe: string;
    };
    comparison: {
      costSavings: string;
      npvDifference: string;
      co2Reduction: string;
      treesEquivalent: string;
    };
  } {
    return {
      pv: {
        initialCost: `$${Math.round(results.pv_analysis.initial_cost).toLocaleString()}`,
        systemSize: `${results.pv_analysis.system_size.toFixed(1)} kW`,
        batteryCapacity: `${results.pv_analysis.battery_capacity.toFixed(1)} kWh`,
        npv: `$${Math.round(results.pv_analysis.npv).toLocaleString()}`,
        irr: `${(results.pv_analysis.irr * 100).toFixed(1)}%`,
        lcoe: `$${results.pv_analysis.lcoe.toFixed(3)}/kWh`,
        paybackPeriod: `${results.comparison_metrics.payback_period.toFixed(1)} years`
      },
      diesel: {
        initialCost: `$${Math.round(results.diesel_analysis.initial_cost).toLocaleString()}`,
        annualFuelCost: `$${Math.round(results.diesel_analysis.annual_fuel_cost).toLocaleString()}`,
        npv: `$${Math.round(results.diesel_analysis.npv).toLocaleString()}`,
        irr: `${(results.diesel_analysis.irr * 100).toFixed(1)}%`,
        lcoe: `$${results.diesel_analysis.lcoe.toFixed(3)}/kWh`
      },
      comparison: {
        costSavings: `$${Math.round(results.comparison_metrics.cost_savings_20_years).toLocaleString()}`,
        npvDifference: `$${Math.round(results.comparison_metrics.npv_difference).toLocaleString()}`,
        co2Reduction: `${results.environmental_impact.co2_reduction_tons.toFixed(1)} tons`,
        treesEquivalent: `${Math.round(results.environmental_impact.equivalent_trees_planted).toLocaleString()} trees`
      }
    };
  }

  /**
   * Calculate system sizing recommendations
   */
  calculateSystemSizing(dailyUsage: number, peakHours: number, batteryAutonomy: number = 1.0): {
    recommendedPvSize: number;
    recommendedBatteryCapacity: number;
    estimatedPanels400W: number;
    estimatedPanels500W: number;
  } {
    const pvSize = dailyUsage / (peakHours * 0.85 * 0.94); // 85% system efficiency, 94% inverter efficiency
    const batteryCapacity = dailyUsage * batteryAutonomy / 0.8; // 80% depth of discharge

    return {
      recommendedPvSize: Math.ceil(pvSize * 10) / 10, // Round to 0.1 kW
      recommendedBatteryCapacity: Math.ceil(batteryCapacity * 10) / 10, // Round to 0.1 kWh
      estimatedPanels400W: Math.ceil(pvSize * 1000 / 400),
      estimatedPanels500W: Math.ceil(pvSize * 1000 / 500)
    };
  }

  /**
   * Generate sensitivity analysis parameters
   */
  generateSensitivityParameters(baseRequest: TechnoEconomicRequest): Record<string, number[]> {
    const baseValues = {
      panel_cost_per_watt: baseRequest.panel_cost_per_watt || 0.4,
      battery_cost_per_kwh: baseRequest.battery_cost_per_kwh || 300,
      diesel_fuel_cost: baseRequest.diesel_fuel_cost || 1.5,
      discount_rate: baseRequest.discount_rate || 0.08
    };

    return {
      panel_cost_per_watt: [
        baseValues.panel_cost_per_watt * 0.8,
        baseValues.panel_cost_per_watt * 0.9,
        baseValues.panel_cost_per_watt,
        baseValues.panel_cost_per_watt * 1.1,
        baseValues.panel_cost_per_watt * 1.2
      ],
      battery_cost_per_kwh: [
        baseValues.battery_cost_per_kwh * 0.7,
        baseValues.battery_cost_per_kwh * 0.85,
        baseValues.battery_cost_per_kwh,
        baseValues.battery_cost_per_kwh * 1.15,
        baseValues.battery_cost_per_kwh * 1.3
      ],
      diesel_fuel_cost: [
        baseValues.diesel_fuel_cost * 0.8,
        baseValues.diesel_fuel_cost * 0.9,
        baseValues.diesel_fuel_cost,
        baseValues.diesel_fuel_cost * 1.1,
        baseValues.diesel_fuel_cost * 1.2
      ],
      discount_rate: [
        baseValues.discount_rate * 0.75,
        baseValues.discount_rate * 0.875,
        baseValues.discount_rate,
        baseValues.discount_rate * 1.125,
        baseValues.discount_rate * 1.25
      ]
    };
  }

  /**
   * Generate Monte Carlo uncertainty ranges
   */
  generateMonteCarloRanges(baseRequest: TechnoEconomicRequest): Record<string, [number, number]> {
    const baseValues = {
      panel_cost_per_watt: baseRequest.panel_cost_per_watt || 0.4,
      battery_cost_per_kwh: baseRequest.battery_cost_per_kwh || 300,
      diesel_fuel_cost: baseRequest.diesel_fuel_cost || 1.5,
      discount_rate: baseRequest.discount_rate || 0.08
    };

    return {
      panel_cost_per_watt: [baseValues.panel_cost_per_watt * 0.7, baseValues.panel_cost_per_watt * 1.3],
      battery_cost_per_kwh: [baseValues.battery_cost_per_kwh * 0.6, baseValues.battery_cost_per_kwh * 1.4],
      diesel_fuel_cost: [baseValues.diesel_fuel_cost * 0.7, baseValues.diesel_fuel_cost * 1.3],
      discount_rate: [baseValues.discount_rate * 0.5, baseValues.discount_rate * 1.5]
    };
  }
}

// Export singleton instance
export const pythonTechnoEconomicService = new PythonTechnoEconomicService();
export default pythonTechnoEconomicService;
