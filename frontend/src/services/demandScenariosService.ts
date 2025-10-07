/**
 * Demand-Driven Scenario Analysis Service
 * Creates technology and economic scenarios based on user-defined energy demand patterns
 */

import { API_CONFIG } from '../config/api';

// Interfaces for demand scenario analysis
export interface DayNightShareRequest {
  day_share_percent: number;    // Percentage of total daily energy consumed during day hours (0-100%)
  night_share_percent: number;  // Percentage of total daily energy consumed during night hours (0-100%)
  transition_hours: number;     // Transition hours (0-4)
}

export interface FutureGrowthRequest {
  selected_equipment_ids: string[];
  growth_factor: number;
  new_equipment?: Array<{
    name: string;
    category: string;
    power_rating: number;
    quantity: number;
    hours_per_day: number;
    efficiency: number;
    priority: string;
  }>;
  timeline_years: number;
}

export interface DemandScenariosRequest {
  facility_id: number;
  day_night_share: DayNightShareRequest;
  future_growth: FutureGrowthRequest;
}

export interface DemandScenarioResponse {
  scenario_type: string;
  name: string;
  description: string;
  annual_kwh: number;
  peak_demand_kw: number;
  load_factor: number;
  equipment_breakdown: Record<string, number>;
  cost_implications: Record<string, number>;
}

export interface TechnologyScenarioResponse {
  pv_size_kw: number;
  description: string;
  coverage_ratio: number;
  storage_options: Record<string, Record<string, number>>;
}

export interface EconomicScenarioResponse {
  conservative: Record<string, any>;
  moderate: Record<string, any>;
  optimistic: Record<string, any>;
}

export interface ComprehensiveAnalysisResponse {
  facility_id: number;
  analysis_date: string;
  demand_scenarios: Record<string, DemandScenarioResponse>;
  technology_scenarios: Record<string, Record<string, TechnologyScenarioResponse>>;
  economic_scenarios: Record<string, EconomicScenarioResponse>;
  recommendations: string[];
  summary: Record<string, any>;
}

export interface REoptOptimizationRequest {
  facility_id: number;
  selected_demand_scenarios: string[];
  optimization_options?: Record<string, any>;
}

export interface REoptOptimizationResponse {
  facility_id: number;
  optimization_runs: Record<string, string>;
  estimated_completion_minutes: number;
  access_level: string;
}

export interface FacilityEquipmentSummary {
  total_equipment: number;
  equipment_by_category: Record<string, number>;
  equipment_by_priority: Record<string, number>;
  total_power_kw: number;
  equipment_list: Array<{
    name: string;
    category: string;
    power_rating_w: number;
    quantity: number;
    priority: string;
    hours_per_day: number;
  }>;
}

export interface ScenarioTemplate {
  day_night_share: DayNightShareRequest;
  future_growth: Partial<FutureGrowthRequest>;
  description: string;
}

export interface ScenarioTemplatesResponse {
  templates: Record<string, ScenarioTemplate>;
  usage_instructions: string[];
}

// Demand scenario types enum
export enum DemandScenarioType {
  CURRENT_ALL = 'current_all_equipment',
  CURRENT_CRITICAL = 'current_critical_equipment',
  CURRENT_ALL_DAY_NIGHT = 'current_all_with_day_night_variation',
  CURRENT_CRITICAL_DAY_NIGHT = 'current_critical_with_day_night_variation',
  FUTURE_ALL = 'future_all_equipment',
  FUTURE_CRITICAL = 'future_critical_equipment',
  FUTURE_ALL_DAY_NIGHT = 'future_all_with_day_night_variation',
  FUTURE_CRITICAL_DAY_NIGHT = 'future_critical_with_day_night_variation'
}

class DemandScenariosService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/demand-scenarios`;
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
   * Create all 7 demand scenarios based on user-defined parameters
   */
  async createDemandScenarios(request: DemandScenariosRequest): Promise<Record<string, DemandScenarioResponse>> {
    return this.makeRequest<Record<string, DemandScenarioResponse>>('/create-demand-scenarios', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Complete demand-driven analysis including demand, technology, and economic scenarios
   */
  async comprehensiveAnalysis(request: DemandScenariosRequest): Promise<ComprehensiveAnalysisResponse> {
    return this.makeRequest<ComprehensiveAnalysisResponse>('/comprehensive-analysis', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * REopt optimization for selected demand scenarios (Technical users only)
   */
  async reoptOptimization(request: REoptOptimizationRequest): Promise<REoptOptimizationResponse> {
    return this.makeRequest<REoptOptimizationResponse>('/reopt-optimization', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get facility equipment summary for scenario planning
   */
  async getFacilityEquipmentSummary(facilityId: number): Promise<FacilityEquipmentSummary> {
    return this.makeRequest<FacilityEquipmentSummary>(`/facility/${facilityId}/equipment`);
  }

  /**
   * Get predefined scenario templates for common use cases
   */
  async getScenarioTemplates(): Promise<ScenarioTemplatesResponse> {
    return this.makeRequest<ScenarioTemplatesResponse>('/scenario-templates');
  }

  /**
   * Health check for the demand scenarios service
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    version: string;
    features: string[];
  }> {
    return this.makeRequest<{
      status: string;
      service: string;
      version: string;
      features: string[];
    }>('/health');
  }

  /**
   * Validate day/night percentage shares
   */
  validateDayNightShares(shares: DayNightShareRequest): string[] {
    const errors: string[] = [];
    
    if (shares.day_share_percent < 0 || shares.day_share_percent > 100) {
      errors.push('Day share must be between 0% and 100%');
    }
    
    if (shares.night_share_percent < 0 || shares.night_share_percent > 100) {
      errors.push('Night share must be between 0% and 100%');
    }
    
    const total = shares.day_share_percent + shares.night_share_percent;
    if (Math.abs(total - 100) > 0.1) {
      errors.push(`Day and night shares must add up to 100%, got ${total.toFixed(1)}%`);
    }
    
    if (shares.transition_hours < 0 || shares.transition_hours > 4) {
      errors.push('Transition hours must be between 0 and 4');
    }
    
    return errors;
  }

  /**
   * Validate future growth parameters
   */
  validateFutureGrowth(growth: FutureGrowthRequest): string[] {
    const errors: string[] = [];
    
    if (growth.growth_factor < 0.5 || growth.growth_factor > 5.0) {
      errors.push('Growth factor must be between 0.5 and 5.0');
    }
    
    if (growth.timeline_years < 1 || growth.timeline_years > 20) {
      errors.push('Timeline must be between 1 and 20 years');
    }
    
    if (!growth.selected_equipment_ids || growth.selected_equipment_ids.length === 0) {
      errors.push('At least one equipment must be selected for future growth');
    }
    
    return errors;
  }

  /**
   * Create default scenario parameters for a facility type
   */
  createDefaultScenarioParameters(facilityType: 'healthcare' | 'clinic' | 'hospital' | 'emergency'): DemandScenariosRequest {
    const templates: Record<string, Partial<DemandScenariosRequest>> = {
      healthcare: {
        day_night_share: {
          day_share_percent: 60.0,
          night_share_percent: 40.0,
          transition_hours: 2
        },
        future_growth: {
          selected_equipment_ids: [],
          growth_factor: 1.3,
          timeline_years: 5
        }
      },
      clinic: {
        day_night_share: {
          day_share_percent: 80.0,
          night_share_percent: 20.0,
          transition_hours: 1
        },
        future_growth: {
          selected_equipment_ids: [],
          growth_factor: 1.2,
          timeline_years: 3
        }
      },
      hospital: {
        day_night_share: {
          day_share_percent: 55.0,
          night_share_percent: 45.0,
          transition_hours: 2
        },
        future_growth: {
          selected_equipment_ids: [],
          growth_factor: 1.4,
          timeline_years: 7
        }
      },
      emergency: {
        day_night_share: {
          day_share_percent: 50.0,
          night_share_percent: 50.0,
          transition_hours: 0
        },
        future_growth: {
          selected_equipment_ids: [],
          growth_factor: 1.1,
          timeline_years: 10
        }
      }
    };

    const template = templates[facilityType];
    
    return {
      facility_id: 0, // To be set by caller
      day_night_share: template.day_night_share!,
      future_growth: template.future_growth as FutureGrowthRequest
    };
  }

  /**
   * Calculate scenario comparison metrics
   */
  calculateScenarioComparisons(scenarios: Record<string, DemandScenarioResponse>): {
    demand_range: {
      min: { scenario: string; value: number };
      max: { scenario: string; value: number };
    };
    peak_range: {
      min: { scenario: string; value: number };
      max: { scenario: string; value: number };
    };
    load_factor_range: {
      min: { scenario: string; value: number };
      max: { scenario: string; value: number };
    };
    cost_range: {
      min: { scenario: string; value: number };
      max: { scenario: string; value: number };
    };
  } {
    const scenarioEntries = Object.entries(scenarios);
    
    // Annual demand comparison
    const demandSorted = scenarioEntries.sort((a, b) => a[1].annual_kwh - b[1].annual_kwh);
    const demandMin = demandSorted[0];
    const demandMax = demandSorted[demandSorted.length - 1];
    
    // Peak demand comparison
    const peakSorted = scenarioEntries.sort((a, b) => a[1].peak_demand_kw - b[1].peak_demand_kw);
    const peakMin = peakSorted[0];
    const peakMax = peakSorted[peakSorted.length - 1];
    
    // Load factor comparison
    const loadFactorSorted = scenarioEntries.sort((a, b) => a[1].load_factor - b[1].load_factor);
    const loadFactorMin = loadFactorSorted[0];
    const loadFactorMax = loadFactorSorted[loadFactorSorted.length - 1];
    
    // Cost comparison
    const costSorted = scenarioEntries.sort((a, b) => 
      a[1].cost_implications.total_annual_cost - b[1].cost_implications.total_annual_cost
    );
    const costMin = costSorted[0];
    const costMax = costSorted[costSorted.length - 1];
    
    return {
      demand_range: {
        min: { scenario: demandMin[0], value: demandMin[1].annual_kwh },
        max: { scenario: demandMax[0], value: demandMax[1].annual_kwh }
      },
      peak_range: {
        min: { scenario: peakMin[0], value: peakMin[1].peak_demand_kw },
        max: { scenario: peakMax[0], value: peakMax[1].peak_demand_kw }
      },
      load_factor_range: {
        min: { scenario: loadFactorMin[0], value: loadFactorMin[1].load_factor },
        max: { scenario: loadFactorMax[0], value: loadFactorMax[1].load_factor }
      },
      cost_range: {
        min: { scenario: costMin[0], value: costMin[1].cost_implications.total_annual_cost },
        max: { scenario: costMax[0], value: costMax[1].cost_implications.total_annual_cost }
      }
    };
  }

  /**
   * Generate scenario recommendations based on analysis
   */
  generateScenarioRecommendations(
    scenarios: Record<string, DemandScenarioResponse>,
    equipmentSummary: FacilityEquipmentSummary
  ): string[] {
    const recommendations: string[] = [];
    const comparisons = this.calculateScenarioComparisons(scenarios);
    
    // Demand growth analysis
    const currentAll = scenarios['current_all'];
    const futureAll = scenarios['future_all'];
    
    if (futureAll && currentAll) {
      const growthRatio = futureAll.annual_kwh / currentAll.annual_kwh;
      if (growthRatio > 1.5) {
        recommendations.push(`High energy growth expected (${((growthRatio - 1) * 100).toFixed(0)}%). Consider phased solar installation.`);
      } else if (growthRatio > 1.2) {
        recommendations.push(`Moderate energy growth expected (${((growthRatio - 1) * 100).toFixed(0)}%). Plan for system expansion.`);
      }
    }
    
    // Critical load analysis
    const currentCritical = scenarios['current_critical'];
    if (currentCritical && currentAll) {
      const criticalRatio = currentCritical.peak_demand_kw / currentAll.peak_demand_kw;
      if (criticalRatio > 0.7) {
        recommendations.push(`High critical load ratio (${(criticalRatio * 100).toFixed(0)}%). Battery backup essential for resilience.`);
      } else if (criticalRatio > 0.4) {
        recommendations.push(`Moderate critical load ratio (${(criticalRatio * 100).toFixed(0)}%). Consider right-sized battery storage.`);
      }
    }
    
    // Day/night variation analysis
    const dayNightScenario = scenarios['current_day_night'];
    if (dayNightScenario && dayNightScenario.load_factor < 0.4) {
      recommendations.push('Low load factor detected. Battery storage recommended for load shifting and cost optimization.');
    }
    
    // Equipment-based recommendations
    const criticalEquipmentCount = equipmentSummary.equipment_by_priority['critical'] || 0;
    const totalEquipment = equipmentSummary.total_equipment;
    
    if (criticalEquipmentCount / totalEquipment > 0.3) {
      recommendations.push('High proportion of critical equipment. Prioritize backup power solutions.');
    }
    
    // Cost optimization recommendations
    const costRange = comparisons.cost_range;
    const costVariation = (costRange.max.value - costRange.min.value) / costRange.min.value;
    
    if (costVariation > 0.5) {
      recommendations.push(`Significant cost variation between scenarios (${(costVariation * 100).toFixed(0)}%). Scenario selection critical for economics.`);
    }
    
    return recommendations;
  }

  /**
   * Export scenario analysis results
   */
  async exportScenarioAnalysis(
    analysis: ComprehensiveAnalysisResponse,
    format: 'json' | 'csv' | 'summary' = 'json'
  ): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2);
      
      case 'csv':
        const csvHeaders = [
          'Scenario', 'Type', 'Annual kWh', 'Peak kW', 'Load Factor', 'Annual Cost ($)'
        ];
        
        const csvRows = Object.entries(analysis.demand_scenarios).map(([key, scenario]) => [
          scenario.name,
          scenario.scenario_type,
          scenario.annual_kwh.toFixed(0),
          scenario.peak_demand_kw.toFixed(1),
          scenario.load_factor.toFixed(3),
          scenario.cost_implications.total_annual_cost.toFixed(0)
        ]);
        
        return [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      case 'summary':
        const summary = [
          `DREAM Tool Demand Scenario Analysis`,
          `Facility ID: ${analysis.facility_id}`,
          `Analysis Date: ${analysis.analysis_date}`,
          ``,
          `Scenarios Analyzed: ${Object.keys(analysis.demand_scenarios).length}`,
          ``,
          `Key Findings:`,
          ...analysis.recommendations.map(rec => `- ${rec}`),
          ``,
          `Demand Range: ${analysis.summary.demand_range.lowest.annual_kwh.toFixed(0)} - ${analysis.summary.demand_range.highest.annual_kwh.toFixed(0)} kWh/year`,
          `Peak Range: ${analysis.summary.demand_range.lowest.peak_kw.toFixed(1)} - ${analysis.summary.demand_range.highest.peak_kw.toFixed(1)} kW`,
          `Growth Factor: ${analysis.summary.growth_factor.toFixed(2)}x`
        ];
        
        return summary.join('\n');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

// Export singleton instance
export const demandScenariosService = new DemandScenariosService();
export default demandScenariosService;
