/**
 * MCDA Service
 * Frontend service for Multi-Criteria Decision Analysis API calls
 */

import { Facility, CriterionInfo, MCDAResult, MCDAAnalysisResponse, PairwiseComparison } from '../pages/mcda/MCDAPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface MCDARequest {
  selected_sites: number[];
  criteria: string[];
  method: 'TOPSIS_W' | 'TOPSIS_AHP';
  weights?: Record<string, number>;
  pairwise_comparisons?: PairwiseComparison[];
}

class MCDAService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication required. Please log in.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }

    return data.data;
  }

  /**
   * Get list of facilities available for MCDA analysis
   */
  async getFacilities(): Promise<Facility[]> {
    return this.makeRequest<Facility[]>('/api/sites/mcda/facilities');
  }

  /**
   * Get available criteria for MCDA analysis
   */
  async getCriteria(): Promise<Record<string, CriterionInfo>> {
    return this.makeRequest<Record<string, CriterionInfo>>('/api/sites/mcda/criteria');
  }

  /**
   * Get required pairwise comparison pairs for given criteria
   */
  async getComparisonPairs(criteria: string[]): Promise<{
    pairs: Array<{ criteria1: string; criteria2: string }>;
    total_comparisons: number;
    criteria: string[];
  }> {
    const params = new URLSearchParams({ criteria: criteria.join(',') });
    return this.makeRequest(`/api/sites/mcda/comparison-pairs?${params}`);
  }

  /**
   * Perform MCDA analysis
   */
  async performAnalysis(request: MCDARequest): Promise<MCDAAnalysisResponse> {
    return this.makeRequest<MCDAAnalysisResponse>('/api/sites/mcda', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Validate weights for TOPSIS_W method
   */
  validateWeights(weights: Record<string, number>, criteria: string[]): string[] {
    const errors: string[] = [];
    
    // Check if all criteria have weights
    criteria.forEach(criterion => {
      if (weights[criterion] === undefined || weights[criterion] === null) {
        errors.push(`Missing weight for criterion: ${criterion}`);
      }
    });

    // Check if weights are valid numbers
    Object.entries(weights).forEach(([criterion, weight]) => {
      if (typeof weight !== 'number' || isNaN(weight)) {
        errors.push(`Invalid weight for criterion ${criterion}: must be a number`);
      } else if (weight < 0 || weight > 1) {
        errors.push(`Weight for criterion ${criterion} must be between 0 and 1`);
      }
    });

    // Check if weights sum to 1
    const weightSum = Object.values(weights).reduce((sum, weight) => sum + (weight || 0), 0);
    if (Math.abs(weightSum - 1) > 0.001) {
      errors.push(`Weights must sum to 1.0, but sum to ${weightSum.toFixed(3)}`);
    }

    return errors;
  }

  /**
   * Validate pairwise comparisons for TOPSIS_AHP method
   */
  validatePairwiseComparisons(comparisons: PairwiseComparison[], criteria: string[]): string[] {
    const errors: string[] = [];
    
    const requiredComparisons = (criteria.length * (criteria.length - 1)) / 2;
    
    if (comparisons.length < requiredComparisons) {
      errors.push(`Missing pairwise comparisons. Expected ${requiredComparisons}, got ${comparisons.length}`);
    }

    // Check if all comparisons have valid values
    comparisons.forEach((comp, index) => {
      if (!criteria.includes(comp.criteria1)) {
        errors.push(`Unknown criterion in comparison ${index + 1}: ${comp.criteria1}`);
      }
      if (!criteria.includes(comp.criteria2)) {
        errors.push(`Unknown criterion in comparison ${index + 1}: ${comp.criteria2}`);
      }
      if (comp.value < 1/9 || comp.value > 9) {
        errors.push(`Invalid comparison value in comparison ${index + 1}: must be between 1/9 and 9`);
      }
      if (comp.criteria1 === comp.criteria2) {
        errors.push(`Cannot compare criterion with itself in comparison ${index + 1}`);
      }
    });

    return errors;
  }

  /**
   * Generate equal weights for criteria (fallback)
   */
  generateEqualWeights(criteria: string[]): Record<string, number> {
    const weight = 1 / criteria.length;
    return Object.fromEntries(criteria.map(criterion => [criterion, weight]));
  }

  /**
   * Get comparison description for AHP scale
   */
  getComparisonDescription(value: number): string {
    if (value === 1) return 'Equal importance';
    if (value === 2) return 'Weak or slight importance';
    if (value === 3) return 'Moderate importance';
    if (value === 4) return 'Moderate plus importance';
    if (value === 5) return 'Strong importance';
    if (value === 6) return 'Strong plus importance';
    if (value === 7) return 'Very strong importance';
    if (value === 8) return 'Very, very strong importance';
    if (value === 9) return 'Extreme importance';
    
    if (value < 1) {
      return `Reciprocal of ${this.getComparisonDescription(1/value)}`;
    }
    
    return 'Unknown comparison value';
  }

  /**
   * Format criterion name for display
   */
  formatCriterionName(criterion: string, availableCriteria: Record<string, CriterionInfo>): string {
    const info = availableCriteria[criterion];
    return info?.name || criterion.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * AHP Scale constants
   */
  readonly AHP_SCALE = {
    EQUAL: 1,
    MODERATE: 3,
    STRONG: 5,
    VERY_STRONG: 7,
    EXTREME: 9,
  } as const;

  /**
   * Get criterion unit for display
   */
  getCriterionUnit(criterion: string, availableCriteria: Record<string, CriterionInfo>): string {
    const info = availableCriteria[criterion];
    return info?.unit || '';
  }
}

export const mcdaService = new MCDAService();
export default mcdaService;
