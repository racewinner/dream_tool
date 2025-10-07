/**
 * REopt Energy System Optimization Service Client
 * Advanced energy system optimization using NREL REopt API integration
 */

import { API_CONFIG } from '../config/api';

// Enhanced interfaces for REopt optimization
export interface OptimizationRequest {
  facility_id: number;
  pv_options?: {
    min_kw?: number;
    max_kw?: number;
    installed_cost_us_dollars_per_kw?: number;
    om_cost_us_dollars_per_kw?: number;
    can_net_meter?: boolean;
  };
  storage_options?: {
    min_kw?: number;
    max_kw?: number;
    min_kwh?: number;
    max_kwh?: number;
    installed_cost_us_dollars_per_kw?: number;
    installed_cost_us_dollars_per_kwh?: number;
    can_grid_charge?: boolean;
  };
  generator_options?: {
    min_kw?: number;
    max_kw?: number;
    installed_cost_us_dollars_per_kw?: number;
    fuel_cost_us_dollars_per_gallon?: number;
  };
  financial_options?: {
    analysis_years?: number;
    escalation_pct?: number;
    discount_pct?: number;
    tax_pct?: number;
  };
}

export interface OptimizationResponse {
  run_uuid: string;
  facility_id: number;
  status: string;
  submitted_at: string;
  estimated_completion_minutes: number;
}

export interface OptimizationResults {
  run_uuid: string;
  facility_id: number;
  status: string;
  
  // Optimization results
  optimal_pv_size_kw?: number;
  optimal_battery_size_kw?: number;
  optimal_battery_size_kwh?: number;
  
  // Financial metrics
  net_present_value?: number;
  payback_period_years?: number;
  lcoe_dollars_per_kwh?: number;
  year_one_savings_dollars?: number;
  lifecycle_cost_dollars?: number;
  
  // Performance metrics
  renewable_electricity_fraction?: number;
  resilience_hours?: number;
  emissions_reduction_tons_co2?: number;
  peak_demand_reduction_kw?: number;
  
  // Analysis metadata
  completed_at?: string;
  analysis_years: number;
}

export interface SystemComparisonRequest {
  facility_id: number;
  scenarios: Record<string, Record<string, any>>;
}

export interface SystemComparisonResults {
  facility_id: number;
  comparison_date: string;
  scenarios: Record<string, OptimizationResults>;
  recommendations: string[];
  best_scenario: string;
  savings_comparison: Record<string, number>;
}

export interface SensitivityAnalysisRequest {
  facility_id: number;
  base_scenario: Record<string, any>;
  sensitivity_parameters: Record<string, Record<string, any>>;
}

export interface SensitivityAnalysisResults {
  facility_id: number;
  analysis_date: string;
  base_case: OptimizationResults;
  sensitivity_results: Record<string, Record<string, number>>;
  most_sensitive_parameters: string[];
  recommendations: string[];
}

export interface OptimizationPotential {
  facility_id: number;
  assessment_date: string;
  energy_profile: {
    annual_consumption_kwh: number;
    peak_demand_kw: number;
    load_factor: number;
    demand_pattern: string;
  };
  solar_resource: {
    annual_ghi_kwh_per_m2: number;
    solar_quality_rating: string;
    estimated_capacity_factor: number;
    shading_assessment: string;
  };
  preliminary_sizing: {
    recommended_pv_size_kw: number;
    recommended_battery_size_kwh: number;
    roof_utilization_pct: number;
    land_area_required_acres: number;
  };
  economic_indicators: {
    estimated_annual_savings: number;
    rough_payback_years: number;
    investment_range_low: number;
    investment_range_high: number;
    financing_options: string[];
  };
  feasibility_score: number;
  key_benefits: string[];
  potential_challenges: string[];
  recommended_next_steps: string[];
}

export interface REoptHealthCheck {
  status: string;
  service: string;
  version: string;
  nrel_api_configured: boolean;
  features: string[];
}

class REoptOptimizationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/reopt-optimization`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Submit facility for comprehensive energy system optimization using REopt
   */
  async optimizeFacilityEnergySystem(request: OptimizationRequest): Promise<OptimizationResponse> {
    return this.makeRequest<OptimizationResponse>('/optimize-facility', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get results for a submitted optimization
   */
  async getOptimizationResults(runUuid: string): Promise<OptimizationResults> {
    return this.makeRequest<OptimizationResults>(`/optimization/${runUuid}/results`);
  }

  /**
   * Compare multiple energy system scenarios for a facility
   */
  async compareEnergyScenarios(request: SystemComparisonRequest): Promise<SystemComparisonResults> {
    return this.makeRequest<SystemComparisonResults>('/compare-scenarios', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Perform sensitivity analysis on key optimization parameters
   */
  async performSensitivityAnalysis(request: SensitivityAnalysisRequest): Promise<SensitivityAnalysisResults> {
    return this.makeRequest<SensitivityAnalysisResults>('/sensitivity-analysis', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Quick assessment of energy optimization potential for a facility
   */
  async assessOptimizationPotential(facilityId: number): Promise<OptimizationPotential> {
    return this.makeRequest<OptimizationPotential>(`/facility/${facilityId}/optimization-potential`);
  }

  /**
   * Health check for the REopt optimization service
   */
  async healthCheck(): Promise<REoptHealthCheck> {
    return this.makeRequest<REoptHealthCheck>('/health');
  }

  /**
   * Poll optimization results until completion
   */
  async pollOptimizationResults(
    runUuid: string, 
    maxWaitMinutes: number = 30,
    pollIntervalSeconds: number = 30
  ): Promise<OptimizationResults> {
    const startTime = Date.now();
    const maxWaitMs = maxWaitMinutes * 60 * 1000;
    const pollIntervalMs = pollIntervalSeconds * 1000;

    while ((Date.now() - startTime) < maxWaitMs) {
      try {
        const results = await this.getOptimizationResults(runUuid);
        
        if (results.status === 'completed') {
          return results;
        } else if (results.status === 'failed') {
          throw new Error('Optimization failed');
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          // Results not ready yet, continue polling
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Optimization timed out');
  }

  /**
   * Create predefined scenario configurations
   */
  createScenarioConfigurations(facilityId: number): Record<string, OptimizationRequest> {
    const baseConfig = { facility_id: facilityId };
    
    return {
      baseline: {
        ...baseConfig,
        pv_options: { max_kw: 0 },
        storage_options: { max_kw: 0, max_kwh: 0 },
        generator_options: { max_kw: 0 }
      },
      pv_only: {
        ...baseConfig,
        pv_options: { 
          max_kw: 200,
          installed_cost_us_dollars_per_kw: 2000,
          can_net_meter: true
        },
        storage_options: { max_kw: 0, max_kwh: 0 },
        generator_options: { max_kw: 0 }
      },
      pv_storage: {
        ...baseConfig,
        pv_options: { 
          max_kw: 200,
          installed_cost_us_dollars_per_kw: 2000,
          can_net_meter: true
        },
        storage_options: { 
          max_kw: 100,
          max_kwh: 400,
          installed_cost_us_dollars_per_kw: 1000,
          installed_cost_us_dollars_per_kwh: 500,
          can_grid_charge: true
        },
        generator_options: { max_kw: 0 }
      },
      pv_storage_generator: {
        ...baseConfig,
        pv_options: { 
          max_kw: 200,
          installed_cost_us_dollars_per_kw: 2000,
          can_net_meter: true
        },
        storage_options: { 
          max_kw: 100,
          max_kwh: 400,
          installed_cost_us_dollars_per_kw: 1000,
          installed_cost_us_dollars_per_kwh: 500,
          can_grid_charge: true
        },
        generator_options: { 
          max_kw: 50,
          installed_cost_us_dollars_per_kw: 800,
          fuel_cost_us_dollars_per_gallon: 3.5
        }
      }
    };
  }

  /**
   * Generate comprehensive optimization report
   */
  async generateOptimizationReport(facilityId: number): Promise<{
    facility_id: number;
    report_date: string;
    potential_assessment: OptimizationPotential;
    scenario_comparison: SystemComparisonResults;
    sensitivity_analysis: SensitivityAnalysisResults;
    recommendations: string[];
    executive_summary: {
      recommended_system: string;
      total_investment: number;
      annual_savings: number;
      payback_period: number;
      environmental_benefit: string;
    };
  }> {
    try {
      // Run all analyses in parallel
      const scenarios = this.createScenarioConfigurations(facilityId);
      
      const [potential, comparison, sensitivity] = await Promise.all([
        this.assessOptimizationPotential(facilityId),
        this.compareEnergyScenarios({
          facility_id: facilityId,
          scenarios: scenarios
        }),
        this.performSensitivityAnalysis({
          facility_id: facilityId,
          base_scenario: scenarios.pv_storage,
          sensitivity_parameters: {
            'electricity_rate': { 'variation_pct': 20 },
            'pv_cost': { 'variation_pct': 30 },
            'battery_cost': { 'variation_pct': 30 },
            'load_growth': { 'variation_pct': 15 }
          }
        })
      ]);

      // Generate executive summary
      const bestScenario = comparison.best_scenario;
      const bestResults = comparison.scenarios[bestScenario];
      
      const executiveSummary = {
        recommended_system: bestScenario.replace('_', ' + ').toUpperCase(),
        total_investment: potential.economic_indicators.investment_range_high,
        annual_savings: potential.economic_indicators.estimated_annual_savings,
        payback_period: bestResults.payback_period_years || potential.economic_indicators.rough_payback_years,
        environmental_benefit: `${bestResults.emissions_reduction_tons_co2?.toFixed(1) || '15'} tons CO2 reduction annually`
      };

      const recommendations = [
        ...comparison.recommendations,
        ...sensitivity.recommendations,
        ...potential.recommended_next_steps
      ].filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates

      return {
        facility_id: facilityId,
        report_date: new Date().toISOString(),
        potential_assessment: potential,
        scenario_comparison: comparison,
        sensitivity_analysis: sensitivity,
        recommendations,
        executive_summary: executiveSummary
      };

    } catch (error) {
      console.error('Error generating optimization report:', error);
      throw error;
    }
  }

  /**
   * Export optimization results to different formats
   */
  async exportOptimizationResults(
    results: OptimizationResults, 
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      
      case 'csv':
        const csvHeaders = [
          'Metric', 'Value', 'Unit'
        ];
        
        const csvRows = [
          ['PV Size', results.optimal_pv_size_kw?.toString() || '0', 'kW'],
          ['Battery Power', results.optimal_battery_size_kw?.toString() || '0', 'kW'],
          ['Battery Energy', results.optimal_battery_size_kwh?.toString() || '0', 'kWh'],
          ['Net Present Value', results.net_present_value?.toString() || '0', '$'],
          ['Payback Period', results.payback_period_years?.toString() || '0', 'years'],
          ['LCOE', results.lcoe_dollars_per_kwh?.toString() || '0', '$/kWh'],
          ['Renewable Fraction', (results.renewable_electricity_fraction || 0 * 100).toString(), '%'],
          ['Resilience Hours', results.resilience_hours?.toString() || '0', 'hours'],
          ['CO2 Reduction', results.emissions_reduction_tons_co2?.toString() || '0', 'tons/year']
        ];
        
        return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      case 'pdf':
        // In a real implementation, this would generate a PDF
        return 'PDF export not implemented in this demo';
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

// Export singleton instance
export const reoptOptimizationService = new REoptOptimizationService();
export default reoptOptimizationService;
