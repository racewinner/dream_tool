/**
 * Multi-Criteria Decision Analysis (MCDA) Service
 * Integrates survey data and techno-economic analysis for site comparison
 */

import { Alternative, CriteriaInfo, runTOPSIS, TOPSISResult, validateTOPSISInput } from '../utils/topsis';
import { PairwiseComparison, runAHP, generateComparisonPairs, AHPResult } from '../utils/ahp';
import { SurveyInstance } from '../models/survey';
import { TechnoEconomicAnalysisInstance } from '../models/technoEconomicAnalysis';
import { FacilityInstance } from '../models/facility';
import { FacilityData } from '../models/survey';

export interface MCDARequest {
  selected_sites: number[]; // Facility IDs
  criteria: string[];
  method: 'TOPSIS_W' | 'TOPSIS_AHP'; // Method 1: Weighted TOPSIS, Method 2: AHP + TOPSIS
  weights?: Record<string, number>; // For Method 1
  pairwise_comparisons?: PairwiseComparison[]; // For Method 2
}

export interface MCDAResponse {
  method: string;
  results: TOPSISResult[];
  ahp_result?: AHPResult; // Only for Method 2
  criteria_info: CriteriaInfo[];
  alternatives: Alternative[];
  validation_errors?: string[];
}

export interface SiteData {
  facility: FacilityInstance;
  survey?: SurveyInstance;
  technoEconomic?: TechnoEconomicAnalysisInstance;
}

/**
 * Available criteria for MCDA analysis with their properties
 */
export const AVAILABLE_CRITERIA: Record<string, { 
  name: string; 
  description: string; 
  type: 'benefit' | 'cost';
  source: 'survey' | 'techno_economic' | 'facility';
  unit?: string;
}> = {
  // Survey-based criteria
  'operational_hours_day': {
    name: 'Daily Operational Hours',
    description: 'Average operational hours during day',
    type: 'benefit',
    source: 'survey',
    unit: 'hours'
  },
  'operational_hours_night': {
    name: 'Night Operational Hours', 
    description: 'Average operational hours during night',
    type: 'benefit',
    source: 'survey',
    unit: 'hours'
  },
  'staff_total': {
    name: 'Total Staff Count',
    description: 'Total number of support and technical staff',
    type: 'benefit',
    source: 'survey',
    unit: 'people'
  },
  'equipment_count': {
    name: 'Equipment Count',
    description: 'Number of electrical equipment items',
    type: 'benefit',
    source: 'survey',
    unit: 'items'
  },
  'catchment_population': {
    name: 'Catchment Population',
    description: 'Population served by the facility',
    type: 'benefit',
    source: 'survey',
    unit: 'people'
  },
  'monthly_diesel_cost': {
    name: 'Monthly Diesel Cost',
    description: 'Monthly cost of diesel fuel',
    type: 'cost',
    source: 'survey',
    unit: 'USD'
  },
  'electricity_reliability_score': {
    name: 'Electricity Reliability Score',
    description: 'Reliability of current electricity source (1-5 scale)',
    type: 'benefit',
    source: 'survey',
    unit: 'score'
  },
  
  // Techno-economic criteria
  'pv_initial_cost': {
    name: 'PV Initial Cost',
    description: 'Initial investment cost for PV system',
    type: 'cost',
    source: 'techno_economic',
    unit: 'USD'
  },
  'pv_lifecycle_cost': {
    name: 'PV Lifecycle Cost',
    description: 'Total lifecycle cost of PV system',
    type: 'cost',
    source: 'techno_economic',
    unit: 'USD'
  },
  'pv_npv': {
    name: 'PV Net Present Value',
    description: 'Net present value of PV investment',
    type: 'benefit',
    source: 'techno_economic',
    unit: 'USD'
  },
  'pv_irr': {
    name: 'PV Internal Rate of Return',
    description: 'Internal rate of return for PV investment',
    type: 'benefit',
    source: 'techno_economic',
    unit: '%'
  },
  'daily_usage': {
    name: 'Daily Energy Usage',
    description: 'Estimated daily energy consumption',
    type: 'benefit',
    source: 'techno_economic',
    unit: 'kWh'
  },
  'peak_hours': {
    name: 'Peak Hours',
    description: 'Peak power demand hours',
    type: 'benefit',
    source: 'techno_economic',
    unit: 'hours'
  },

  // Location-based criteria
  'latitude': {
    name: 'Latitude',
    description: 'Geographic latitude (solar resource indicator)',
    type: 'benefit',
    source: 'facility',
    unit: 'degrees'
  }
};

/**
 * Extract criterion value from site data
 */
function extractCriterionValue(siteData: SiteData, criterion: string): number {
  const criterionInfo = AVAILABLE_CRITERIA[criterion];
  if (!criterionInfo) return 0;

  const { facility, survey, technoEconomic } = siteData;
  const facilityData = survey?.facilityData;

  switch (criterion) {
    // Survey criteria
    case 'operational_hours_day':
      return facilityData?.operationalHours?.day || 0;
    case 'operational_hours_night':
      return facilityData?.operationalHours?.night || 0;
    case 'staff_total':
      return (facilityData?.supportStaff || 0) + (facilityData?.technicalStaff || 0);
    case 'equipment_count':
      return facilityData?.equipment?.length || 0;
    case 'catchment_population':
      return facilityData?.catchmentPopulation || 0;
    case 'monthly_diesel_cost':
      return facilityData?.monthlyDieselCost || 0;
    case 'electricity_reliability_score':
      // Convert reliability text to numeric score
      const reliability = facilityData?.electricityReliability?.toLowerCase();
      if (reliability?.includes('very reliable') || reliability?.includes('excellent')) return 5;
      if (reliability?.includes('reliable') || reliability?.includes('good')) return 4;
      if (reliability?.includes('moderate') || reliability?.includes('fair')) return 3;
      if (reliability?.includes('poor') || reliability?.includes('unreliable')) return 2;
      if (reliability?.includes('very poor') || reliability?.includes('none')) return 1;
      return 3; // Default moderate

    // Techno-economic criteria
    case 'pv_initial_cost':
      return technoEconomic?.pvInitialCost || 0;
    case 'pv_lifecycle_cost':
      return technoEconomic?.pvLifecycleCost || 0;
    case 'pv_npv':
      return technoEconomic?.pvNpv || 0;
    case 'pv_irr':
      return technoEconomic?.pvIrr || 0;
    case 'daily_usage':
      return technoEconomic?.dailyUsage || 0;
    case 'peak_hours':
      return technoEconomic?.peakHours || 0;

    // Location criteria
    case 'latitude':
      return Math.abs(facility.latitude); // Absolute value for solar resource

    default:
      return 0;
  }
}

/**
 * Convert site data to MCDA alternatives
 */
function buildAlternatives(sitesData: SiteData[], criteria: string[]): Alternative[] {
  return sitesData.map(siteData => {
    const criteriaValues: Record<string, number> = {};
    
    criteria.forEach(criterion => {
      criteriaValues[criterion] = extractCriterionValue(siteData, criterion);
    });

    return {
      id: siteData.facility.id,
      name: siteData.facility.name,
      criteria: criteriaValues
    };
  });
}

/**
 * Build criteria info from selected criteria and weights
 */
function buildCriteriaInfo(criteria: string[], weights: Record<string, number>): CriteriaInfo[] {
  return criteria.map(criterion => {
    const info = AVAILABLE_CRITERIA[criterion];
    return {
      name: criterion,
      weight: weights[criterion] || 0,
      type: info?.type || 'benefit'
    };
  });
}

/**
 * Validate MCDA request
 */
function validateMCDARequest(request: MCDARequest): string[] {
  const errors: string[] = [];

  if (request.selected_sites.length < 2) {
    errors.push('At least 2 sites are required for comparison');
  }

  if (request.criteria.length === 0) {
    errors.push('At least 1 criterion must be selected');
  }

  // Check if all criteria are valid
  request.criteria.forEach(criterion => {
    if (!AVAILABLE_CRITERIA[criterion]) {
      errors.push(`Unknown criterion: ${criterion}`);
    }
  });

  if (request.method === 'TOPSIS_W') {
    if (!request.weights) {
      errors.push('Weights are required for TOPSIS_W method');
    } else {
      // Check if weights are provided for all criteria
      request.criteria.forEach(criterion => {
        if (request.weights![criterion] === undefined) {
          errors.push(`Weight missing for criterion: ${criterion}`);
        }
      });

      // Check if weights sum to 1
      const weightSum = Object.values(request.weights).reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(weightSum - 1) > 0.001) {
        errors.push(`Weights must sum to 1, but sum to ${weightSum.toFixed(3)}`);
      }
    }
  }

  if (request.method === 'TOPSIS_AHP') {
    if (!request.pairwise_comparisons) {
      errors.push('Pairwise comparisons are required for TOPSIS_AHP method');
    } else {
      const requiredComparisons = (request.criteria.length * (request.criteria.length - 1)) / 2;
      if (request.pairwise_comparisons.length < requiredComparisons) {
        errors.push(`Insufficient pairwise comparisons. Expected ${requiredComparisons}, got ${request.pairwise_comparisons.length}`);
      }
    }
  }

  return errors;
}

/**
 * Main MCDA analysis function
 */
export async function performMCDAAnalysis(
  request: MCDARequest,
  sitesData: SiteData[]
): Promise<MCDAResponse> {
  // Validate request
  const validationErrors = validateMCDARequest(request);
  if (validationErrors.length > 0) {
    return {
      method: request.method,
      results: [],
      criteria_info: [],
      alternatives: [],
      validation_errors: validationErrors
    };
  }

  // Build alternatives from site data
  const alternatives = buildAlternatives(sitesData, request.criteria);

  let weights: Record<string, number>;
  let ahpResult: AHPResult | undefined;

  if (request.method === 'TOPSIS_W') {
    // Method 1: Use provided weights directly
    weights = request.weights!;
  } else {
    // Method 2: Derive weights using AHP
    try {
      ahpResult = runAHP(request.criteria, request.pairwise_comparisons!);
      weights = ahpResult.weights;
    } catch (error) {
      return {
        method: request.method,
        results: [],
        criteria_info: [],
        alternatives: [],
        validation_errors: [`AHP analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Build criteria info
  const criteriaInfo = buildCriteriaInfo(request.criteria, weights);

  // Validate TOPSIS input
  const topsisValidationErrors = validateTOPSISInput(alternatives, criteriaInfo);
  if (topsisValidationErrors.length > 0) {
    return {
      method: request.method,
      results: [],
      criteria_info: criteriaInfo,
      alternatives: alternatives,
      validation_errors: topsisValidationErrors
    };
  }

  // Run TOPSIS analysis
  let topsisResults: TOPSISResult[];
  try {
    topsisResults = runTOPSIS(alternatives, criteriaInfo);
  } catch (error) {
    return {
      method: request.method,
      results: [],
      criteria_info: criteriaInfo,
      alternatives: alternatives,
      validation_errors: [`TOPSIS analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }

  return {
    method: request.method,
    results: topsisResults,
    ahp_result: ahpResult,
    criteria_info: criteriaInfo,
    alternatives: alternatives
  };
}

/**
 * Get available criteria for frontend
 */
export function getAvailableCriteria(): typeof AVAILABLE_CRITERIA {
  return AVAILABLE_CRITERIA;
}
