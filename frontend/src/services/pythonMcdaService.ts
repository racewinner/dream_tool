/**
 * Python MCDA Service Integration
 * Advanced Multi-Criteria Decision Analysis using Python scientific libraries
 */

// Python API Configuration
const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000/api/python';

// Enhanced interfaces for Python MCDA services
export interface PythonMCDAAlternative {
  id: string;
  name: string;
  criteria_values: { [criterion: string]: number };
  metadata?: { [key: string]: any };
}

export interface EnhancedTOPSISRequest {
  alternatives: PythonMCDAAlternative[];
  criteria_weights: { [criterion: string]: number };
  criteria_types: { [criterion: string]: 'benefit' | 'cost' };
  uncertainty_analysis?: boolean;
  sensitivity_analysis?: boolean;
}

export interface MonteCarloMCDARequest {
  alternatives: PythonMCDAAlternative[];
  criteria_weights: { [criterion: string]: number };
  criteria_types: { [criterion: string]: 'benefit' | 'cost' };
  weight_uncertainty?: number; // 0-1
  data_uncertainty?: number; // 0-1
  n_simulations?: number; // 100-10000
}

export interface FuzzyTOPSISRequest {
  alternatives: PythonMCDAAlternative[];
  fuzzy_weights: { [criterion: string]: [number, number, number] }; // [low, medium, high]
  criteria_types: { [criterion: string]: 'benefit' | 'cost' };
}

export interface EnhancedTOPSISResponse {
  alternatives: string[];
  topsis_scores: number[];
  ranking: number[];
  normalized_matrix: number[][];
  weighted_matrix: number[][];
  ideal_solution: number[];
  anti_ideal_solution: number[];
  uncertainty_analysis?: {
    coefficient_of_variation: { [criterion: string]: number };
    most_uncertain_criterion: { name: string; cv: number };
    least_uncertain_criterion: { name: string; cv: number };
    overall_uncertainty: number;
  };
  sensitivity_analysis?: {
    [criterion: string]: {
      weight_variations: number[];
      score_changes: number[];
      ranking_changes: number[];
    };
  };
  statistical_validation: {
    correlations_with_criteria: { [criterion: string]: number };
    score_statistics: {
      mean: number;
      std: number;
      min: number;
      max: number;
      range: number;
    };
    discrimination_power: number;
  };
  analysis_metadata: {
    user_email: string;
    analysis_type: string;
    n_alternatives: number;
    n_criteria: number;
    features_enabled: {
      uncertainty_analysis: boolean;
      sensitivity_analysis: boolean;
    };
  };
}

export interface MonteCarloMCDAResponse {
  mean_scores: number[];
  std_scores: number[];
  confidence_intervals: {
    lower: number[];
    upper: number[];
  };
  ranking_stability: {
    rank_probabilities: number[][];
    stability_scores: number[];
    most_stable_alternative: number;
    least_stable_alternative: number;
  };
  simulation_parameters: {
    n_simulations: number;
    weight_uncertainty: number;
    data_uncertainty: number;
  };
  robust_ranking: number[];
  analysis_metadata: {
    user_email: string;
    analysis_type: string;
    n_alternatives: number;
    n_criteria: number;
    simulation_parameters: {
      n_simulations: number;
      weight_uncertainty: number;
      data_uncertainty: number;
    };
  };
}

export interface FuzzyTOPSISResponse {
  fuzzy_scores: number[];
  crisp_ranking: number[];
  score_ranges: { [alternative: string]: [number, number] };
  fuzzy_weights: { [criterion: string]: [number, number, number] };
  crisp_weights: { [criterion: string]: number };
  analysis_metadata: {
    user_email: string;
    analysis_type: string;
    n_alternatives: number;
    n_criteria: number;
  };
}

export interface MethodComparisonResponse {
  method_results: {
    enhanced_topsis: {
      scores: number[];
      ranking: number[];
    };
    monte_carlo: {
      mean_scores: number[];
      ranking: number[];
      confidence_intervals: {
        lower: number[];
        upper: number[];
      };
    };
    fuzzy_topsis: {
      scores: number[];
      ranking: number[];
      score_ranges: { [alternative: string]: [number, number] };
    };
  };
  ranking_correlations: {
    topsis_vs_monte_carlo: number;
    topsis_vs_fuzzy: number;
    monte_carlo_vs_fuzzy: number;
  };
  consensus_ranking: number[];
  analysis_metadata: {
    user_email: string;
    analysis_type: string;
    methods_compared: string[];
    n_alternatives: number;
  };
}

class PythonMCDAService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Enhanced TOPSIS analysis with uncertainty and sensitivity analysis
   */
  static async performEnhancedTOPSIS(request: EnhancedTOPSISRequest): Promise<EnhancedTOPSISResponse> {
    try {
      console.log('🐍 Requesting enhanced TOPSIS analysis from Python services...');
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/mcda/enhanced-topsis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await this.handleResponse<EnhancedTOPSISResponse>(response);
      
      console.log(`✅ Enhanced TOPSIS analysis completed for ${request.alternatives.length} alternatives`);
      return result;

    } catch (error) {
      console.error('❌ Enhanced TOPSIS analysis failed:', error);
      throw error;
    }
  }

  /**
   * Monte Carlo MCDA analysis for robust decision making
   */
  static async performMonteCarloMCDA(request: MonteCarloMCDARequest): Promise<MonteCarloMCDAResponse> {
    try {
      console.log('🐍 Requesting Monte Carlo MCDA analysis from Python services...');
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/mcda/monte-carlo-analysis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await this.handleResponse<MonteCarloMCDAResponse>(response);
      
      console.log(`✅ Monte Carlo MCDA completed with ${request.n_simulations || 1000} simulations`);
      return result;

    } catch (error) {
      console.error('❌ Monte Carlo MCDA analysis failed:', error);
      throw error;
    }
  }

  /**
   * Fuzzy TOPSIS analysis for handling uncertain criteria weights
   */
  static async performFuzzyTOPSIS(request: FuzzyTOPSISRequest): Promise<FuzzyTOPSISResponse> {
    try {
      console.log('🐍 Requesting Fuzzy TOPSIS analysis from Python services...');
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/mcda/fuzzy-topsis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await this.handleResponse<FuzzyTOPSISResponse>(response);
      
      console.log(`✅ Fuzzy TOPSIS analysis completed for ${request.alternatives.length} alternatives`);
      return result;

    } catch (error) {
      console.error('❌ Fuzzy TOPSIS analysis failed:', error);
      throw error;
    }
  }

  /**
   * Compare results from different MCDA methods
   */
  static async compareMCDAMethods(
    alternatives: PythonMCDAAlternative[],
    criteria_weights: { [criterion: string]: number },
    criteria_types: { [criterion: string]: 'benefit' | 'cost' }
  ): Promise<MethodComparisonResponse> {
    try {
      console.log('🐍 Requesting MCDA methods comparison from Python services...');
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/mcda/compare-methods`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          alternatives,
          criteria_weights,
          criteria_types
        })
      });

      const result = await this.handleResponse<MethodComparisonResponse>(response);
      
      console.log(`✅ MCDA methods comparison completed for ${alternatives.length} alternatives`);
      return result;

    } catch (error) {
      console.error('❌ MCDA methods comparison failed:', error);
      throw error;
    }
  }

  /**
   * Convert TypeScript MCDA data to Python format
   */
  static convertToPythonMCDAFormat(
    facilities: any[],
    selectedCriteria: string[],
    criteriaTypes: { [key: string]: 'benefit' | 'cost' }
  ): PythonMCDAAlternative[] {
    return facilities.map(facility => ({
      id: facility.id.toString(),
      name: facility.name,
      criteria_values: selectedCriteria.reduce((values, criterion) => {
        // Map TypeScript criteria to Python format
        const value = this.extractCriterionValue(facility, criterion);
        if (value !== null && value !== undefined) {
          values[criterion] = value;
        }
        return values;
      }, {} as { [key: string]: number }),
      metadata: {
        facility_type: facility.facilityType,
        has_survey: facility.has_survey,
        has_techno_economic: facility.has_techno_economic,
        latitude: facility.latitude,
        longitude: facility.longitude
      }
    }));
  }

  /**
   * Extract criterion value from facility data
   */
  private static extractCriterionValue(facility: any, criterion: string): number | null {
    // Map common criteria to facility properties
    const criteriaMapping: { [key: string]: (facility: any) => number | null } = {
      'latitude': (f) => f.latitude || null,
      'longitude': (f) => f.longitude || null,
      'operational_hours': (f) => f.operationalHours || f.operational_hours || null,
      'staff_count': (f) => f.staffCount || f.staff_count || null,
      'equipment_count': (f) => f.equipment?.length || null,
      'population_served': (f) => f.populationServed || f.population_served || null,
      'reliability_score': (f) => f.reliabilityScore || f.reliability_score || null,
      'maintenance_cost': (f) => f.maintenanceCost || f.maintenance_cost || null,
      'pv_system_cost': (f) => f.pvSystemCost || f.pv_system_cost || null,
      'npv': (f) => f.npv || null,
      'irr': (f) => f.irr || null,
      'payback_period': (f) => f.paybackPeriod || f.payback_period || null,
      'daily_energy_usage': (f) => f.dailyEnergyUsage || f.daily_energy_usage || null,
      'peak_hours': (f) => f.peakHours || f.peak_hours || null
    };

    const extractor = criteriaMapping[criterion];
    if (extractor) {
      return extractor(facility);
    }

    // Fallback: try direct property access
    return facility[criterion] || null;
  }

  /**
   * Create fuzzy weights from crisp weights with uncertainty
   */
  static createFuzzyWeights(
    crispWeights: { [criterion: string]: number },
    uncertainty: number = 0.2
  ): { [criterion: string]: [number, number, number] } {
    const fuzzyWeights: { [criterion: string]: [number, number, number] } = {};
    
    for (const [criterion, weight] of Object.entries(crispWeights)) {
      const low = Math.max(0, weight * (1 - uncertainty));
      const high = Math.min(1, weight * (1 + uncertainty));
      fuzzyWeights[criterion] = [low, weight, high];
    }
    
    return fuzzyWeights;
  }

  /**
   * Calculate ranking similarity between two rankings
   */
  static calculateRankingSimilarity(ranking1: number[], ranking2: number[]): number {
    if (ranking1.length !== ranking2.length) {
      throw new Error('Rankings must have the same length');
    }

    // Calculate Spearman correlation coefficient
    const n = ranking1.length;
    let sumD2 = 0;

    for (let i = 0; i < n; i++) {
      const d = ranking1[i] - ranking2[i];
      sumD2 += d * d;
    }

    const correlation = 1 - (6 * sumD2) / (n * (n * n - 1));
    return correlation;
  }

  /**
   * Health check for Python MCDA services
   */
  static async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${PYTHON_API_BASE_URL}/mcda/health`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<any>(response);

    } catch (error) {
      console.error('❌ Python MCDA services health check failed:', error);
      throw error;
    }
  }
}

export default PythonMCDAService;
