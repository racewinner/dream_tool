/**
 * TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) Algorithm
 * Implementation for Multi-Criteria Decision Analysis
 */

export interface Alternative {
  id: string | number;
  name: string;
  criteria: Record<string, number>;
}

export interface CriteriaInfo {
  name: string;
  weight: number;
  type: 'benefit' | 'cost'; // benefit = higher is better, cost = lower is better
}

export interface TOPSISResult {
  alternative: Alternative;
  score: number;
  rank: number;
  distanceToIdeal: number;
  distanceToNegativeIdeal: number;
}

/**
 * Normalize the decision matrix using vector normalization
 */
function normalizeMatrix(alternatives: Alternative[], criteriaNames: string[]): Record<string, Record<string, number>> {
  const normalized: Record<string, Record<string, number>> = {};
  
  // Calculate column sums of squares for normalization
  const columnSumSquares: Record<string, number> = {};
  criteriaNames.forEach(criterion => {
    columnSumSquares[criterion] = alternatives.reduce((sum, alt) => {
      const value = alt.criteria[criterion] || 0;
      return sum + (value * value);
    }, 0);
  });
  
  // Normalize each value
  alternatives.forEach(alt => {
    normalized[alt.id] = {};
    criteriaNames.forEach(criterion => {
      const value = alt.criteria[criterion] || 0;
      const denominator = Math.sqrt(columnSumSquares[criterion]);
      normalized[alt.id][criterion] = denominator === 0 ? 0 : value / denominator;
    });
  });
  
  return normalized;
}

/**
 * Calculate weighted normalized matrix
 */
function calculateWeightedNormalizedMatrix(
  normalizedMatrix: Record<string, Record<string, number>>,
  criteriaInfo: CriteriaInfo[]
): Record<string, Record<string, number>> {
  const weighted: Record<string, Record<string, number>> = {};
  const weightsMap = Object.fromEntries(criteriaInfo.map(c => [c.name, c.weight]));
  
  Object.keys(normalizedMatrix).forEach(altId => {
    weighted[altId] = {};
    Object.keys(normalizedMatrix[altId]).forEach(criterion => {
      weighted[altId][criterion] = normalizedMatrix[altId][criterion] * (weightsMap[criterion] || 0);
    });
  });
  
  return weighted;
}

/**
 * Determine ideal and negative-ideal solutions
 */
function calculateIdealSolutions(
  weightedMatrix: Record<string, Record<string, number>>,
  criteriaInfo: CriteriaInfo[]
): { ideal: Record<string, number>; negativeIdeal: Record<string, number> } {
  const ideal: Record<string, number> = {};
  const negativeIdeal: Record<string, number> = {};
  const criteriaTypes = Object.fromEntries(criteriaInfo.map(c => [c.name, c.type]));
  
  criteriaInfo.forEach(criterion => {
    const values = Object.values(weightedMatrix).map(alt => alt[criterion.name] || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    if (criteriaTypes[criterion.name] === 'benefit') {
      ideal[criterion.name] = maxValue;
      negativeIdeal[criterion.name] = minValue;
    } else { // cost
      ideal[criterion.name] = minValue;
      negativeIdeal[criterion.name] = maxValue;
    }
  });
  
  return { ideal, negativeIdeal };
}

/**
 * Calculate Euclidean distance from ideal and negative-ideal solutions
 */
function calculateDistances(
  weightedMatrix: Record<string, Record<string, number>>,
  ideal: Record<string, number>,
  negativeIdeal: Record<string, number>,
  criteriaNames: string[]
): Record<string, { toIdeal: number; toNegativeIdeal: number }> {
  const distances: Record<string, { toIdeal: number; toNegativeIdeal: number }> = {};
  
  Object.keys(weightedMatrix).forEach(altId => {
    let distanceToIdeal = 0;
    let distanceToNegativeIdeal = 0;
    
    criteriaNames.forEach(criterion => {
      const value = weightedMatrix[altId][criterion] || 0;
      distanceToIdeal += Math.pow(value - (ideal[criterion] || 0), 2);
      distanceToNegativeIdeal += Math.pow(value - (negativeIdeal[criterion] || 0), 2);
    });
    
    distances[altId] = {
      toIdeal: Math.sqrt(distanceToIdeal),
      toNegativeIdeal: Math.sqrt(distanceToNegativeIdeal)
    };
  });
  
  return distances;
}

/**
 * Calculate relative closeness to ideal solution
 */
function calculateRelativeCloseness(distances: Record<string, { toIdeal: number; toNegativeIdeal: number }>): Record<string, number> {
  const scores: Record<string, number> = {};
  
  Object.keys(distances).forEach(altId => {
    const { toIdeal, toNegativeIdeal } = distances[altId];
    const denominator = toIdeal + toNegativeIdeal;
    scores[altId] = denominator === 0 ? 0 : toNegativeIdeal / denominator;
  });
  
  return scores;
}

/**
 * Main TOPSIS algorithm implementation
 */
export function runTOPSIS(alternatives: Alternative[], criteriaInfo: CriteriaInfo[]): TOPSISResult[] {
  if (alternatives.length === 0 || criteriaInfo.length === 0) {
    return [];
  }
  
  // Validate weights sum to 1
  const weightSum = criteriaInfo.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(weightSum - 1) > 0.001) {
    throw new Error(`Criteria weights must sum to 1, but sum to ${weightSum}`);
  }
  
  const criteriaNames = criteriaInfo.map(c => c.name);
  
  // Step 1: Normalize the decision matrix
  const normalizedMatrix = normalizeMatrix(alternatives, criteriaNames);
  
  // Step 2: Calculate weighted normalized matrix
  const weightedMatrix = calculateWeightedNormalizedMatrix(normalizedMatrix, criteriaInfo);
  
  // Step 3: Determine ideal and negative-ideal solutions
  const { ideal, negativeIdeal } = calculateIdealSolutions(weightedMatrix, criteriaInfo);
  
  // Step 4: Calculate distances
  const distances = calculateDistances(weightedMatrix, ideal, negativeIdeal, criteriaNames);
  
  // Step 5: Calculate relative closeness
  const scores = calculateRelativeCloseness(distances);
  
  // Step 6: Rank alternatives
  const results: TOPSISResult[] = alternatives.map(alt => ({
    alternative: alt,
    score: scores[alt.id] || 0,
    rank: 0, // Will be assigned after sorting
    distanceToIdeal: distances[alt.id]?.toIdeal || 0,
    distanceToNegativeIdeal: distances[alt.id]?.toNegativeIdeal || 0
  }));
  
  // Sort by score (higher is better)
  results.sort((a, b) => b.score - a.score);
  
  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1;
  });
  
  return results;
}

/**
 * Validate input data for TOPSIS analysis
 */
export function validateTOPSISInput(alternatives: Alternative[], criteriaInfo: CriteriaInfo[]): string[] {
  const errors: string[] = [];
  
  if (alternatives.length === 0) {
    errors.push('At least one alternative is required');
  }
  
  if (criteriaInfo.length === 0) {
    errors.push('At least one criterion is required');
  }
  
  // Check if all alternatives have values for all criteria
  const criteriaNames = criteriaInfo.map(c => c.name);
  alternatives.forEach(alt => {
    criteriaNames.forEach(criterion => {
      if (alt.criteria[criterion] === undefined || alt.criteria[criterion] === null) {
        errors.push(`Alternative '${alt.name}' is missing value for criterion '${criterion}'`);
      }
    });
  });
  
  // Check weight constraints
  const weightSum = criteriaInfo.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(weightSum - 1) > 0.001) {
    errors.push(`Criteria weights must sum to 1, but sum to ${weightSum.toFixed(3)}`);
  }
  
  criteriaInfo.forEach(criterion => {
    if (criterion.weight < 0 || criterion.weight > 1) {
      errors.push(`Criterion '${criterion.name}' weight must be between 0 and 1`);
    }
    if (!['benefit', 'cost'].includes(criterion.type)) {
      errors.push(`Criterion '${criterion.name}' type must be 'benefit' or 'cost'`);
    }
  });
  
  return errors;
}
