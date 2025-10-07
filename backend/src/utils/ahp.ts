/**
 * AHP (Analytic Hierarchy Process) Algorithm
 * Implementation for deriving criterion weights from pairwise comparisons
 */

export interface PairwiseComparison {
  criteria1: string;
  criteria2: string;
  value: number; // 1/9 to 9, where 1 = equal importance, 9 = extreme importance
}

export interface AHPResult {
  weights: Record<string, number>;
  consistencyRatio: number;
  isConsistent: boolean;
  eigenVector: number[];
  maxEigenValue: number;
}

/**
 * AHP intensity scale
 */
export const AHP_SCALE = {
  EQUAL: 1,
  MODERATE: 3,
  STRONG: 5,
  VERY_STRONG: 7,
  EXTREME: 9,
  // Intermediate values: 2, 4, 6, 8
} as const;

/**
 * Random Index values for consistency checking
 * Based on Saaty's random index table
 */
const RANDOM_INDEX: Record<number, number> = {
  1: 0.00,
  2: 0.00,
  3: 0.52,
  4: 0.89,
  5: 1.11,
  6: 1.25,
  7: 1.35,
  8: 1.40,
  9: 1.45,
  10: 1.49,
  11: 1.52,
  12: 1.54,
  13: 1.56,
  14: 1.58,
  15: 1.59
};

/**
 * Build pairwise comparison matrix from comparisons array
 */
function buildComparisonMatrix(criteria: string[], comparisons: PairwiseComparison[]): number[][] {
  const n = criteria.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(1));
  
  // Create mapping from criterion name to index
  const criteriaIndex = Object.fromEntries(criteria.map((criterion, index) => [criterion, index]));
  
  // Fill matrix with comparison values
  comparisons.forEach(comparison => {
    const i = criteriaIndex[comparison.criteria1];
    const j = criteriaIndex[comparison.criteria2];
    
    if (i !== undefined && j !== undefined) {
      matrix[i][j] = comparison.value;
      matrix[j][i] = 1 / comparison.value; // Reciprocal value
    }
  });
  
  return matrix;
}

/**
 * Calculate eigenvalues and eigenvectors using power iteration method
 */
function calculateEigenVector(matrix: number[][]): { eigenVector: number[]; maxEigenValue: number } {
  const n = matrix.length;
  let vector = Array(n).fill(1 / n); // Initial normalized vector
  
  const maxIterations = 100;
  const tolerance = 1e-8;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Multiply matrix by vector
    const newVector = matrix.map(row => 
      row.reduce((sum, value, j) => sum + value * vector[j], 0)
    );
    
    // Calculate eigenvalue (Rayleigh quotient)
    const eigenValue = newVector.reduce((sum, value, i) => sum + value * vector[i], 0) /
                       vector.reduce((sum, value) => sum + value * value, 0);
    
    // Normalize vector
    const vectorSum = newVector.reduce((sum, value) => sum + value, 0);
    const normalizedVector = newVector.map(value => value / vectorSum);
    
    // Check convergence
    const diff = normalizedVector.reduce((maxDiff, value, i) => 
      Math.max(maxDiff, Math.abs(value - vector[i])), 0
    );
    
    vector = normalizedVector;
    
    if (diff < tolerance) {
      return { eigenVector: vector, maxEigenValue: eigenValue };
    }
  }
  
  // If not converged, return current result
  const eigenValue = matrix.map((row, i) => 
    row.reduce((sum, value, j) => sum + value * vector[j], 0)
  ).reduce((sum, value, i) => sum + value * vector[i], 0);
  
  return { eigenVector: vector, maxEigenValue: eigenValue };
}

/**
 * Calculate consistency ratio
 */
function calculateConsistencyRatio(maxEigenValue: number, n: number): number {
  if (n <= 2) return 0; // Perfect consistency for n <= 2
  
  const consistencyIndex = (maxEigenValue - n) / (n - 1);
  const randomIndex = RANDOM_INDEX[n] || RANDOM_INDEX[15];
  
  return randomIndex === 0 ? 0 : consistencyIndex / randomIndex;
}

/**
 * Validate pairwise comparisons
 */
export function validateAHPInput(criteria: string[], comparisons: PairwiseComparison[]): string[] {
  const errors: string[] = [];
  
  if (criteria.length < 2) {
    errors.push('At least 2 criteria are required for AHP analysis');
  }
  
  if (criteria.length > 15) {
    errors.push('AHP analysis supports maximum 15 criteria');
  }
  
  // Check that all required comparisons are provided
  const requiredComparisons = (criteria.length * (criteria.length - 1)) / 2;
  const providedComparisons = new Set();
  
  comparisons.forEach(comp => {
    if (!criteria.includes(comp.criteria1)) {
      errors.push(`Unknown criterion: ${comp.criteria1}`);
    }
    if (!criteria.includes(comp.criteria2)) {
      errors.push(`Unknown criterion: ${comp.criteria2}`);
    }
    if (comp.criteria1 === comp.criteria2) {
      errors.push(`Cannot compare criterion with itself: ${comp.criteria1}`);
    }
    if (comp.value < 1/9 || comp.value > 9) {
      errors.push(`Comparison value must be between 1/9 and 9, but got ${comp.value}`);
    }
    
    // Track unique pairs
    const pair = [comp.criteria1, comp.criteria2].sort().join('-');
    providedComparisons.add(pair);
  });
  
  if (providedComparisons.size < requiredComparisons) {
    errors.push(`Missing pairwise comparisons. Expected ${requiredComparisons}, got ${providedComparisons.size}`);
  }
  
  return errors;
}

/**
 * Generate all required pairwise comparison pairs for given criteria
 */
export function generateComparisonPairs(criteria: string[]): Array<{criteria1: string; criteria2: string}> {
  const pairs: Array<{criteria1: string; criteria2: string}> = [];
  
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      pairs.push({
        criteria1: criteria[i],
        criteria2: criteria[j]
      });
    }
  }
  
  return pairs;
}

/**
 * Main AHP algorithm implementation
 */
export function runAHP(criteria: string[], comparisons: PairwiseComparison[]): AHPResult {
  // Validate input
  const validationErrors = validateAHPInput(criteria, comparisons);
  if (validationErrors.length > 0) {
    throw new Error(`AHP validation failed: ${validationErrors.join(', ')}`);
  }
  
  // Build comparison matrix
  const matrix = buildComparisonMatrix(criteria, comparisons);
  
  // Calculate principal eigenvector (weights)
  const { eigenVector, maxEigenValue } = calculateEigenVector(matrix);
  
  // Calculate consistency ratio
  const consistencyRatio = calculateConsistencyRatio(maxEigenValue, criteria.length);
  
  // Create weights object
  const weights = Object.fromEntries(
    criteria.map((criterion, index) => [criterion, eigenVector[index]])
  );
  
  return {
    weights,
    consistencyRatio,
    isConsistent: consistencyRatio <= 0.1, // Generally accepted threshold
    eigenVector,
    maxEigenValue
  };
}

/**
 * Helper function to convert numerical comparison to descriptive text
 */
export function getComparisonDescription(value: number): string {
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
    return `Reciprocal of ${getComparisonDescription(1/value)}`;
  }
  
  return 'Unknown comparison value';
}

/**
 * Generate default equal weights for criteria (fallback method)
 */
export function generateEqualWeights(criteria: string[]): Record<string, number> {
  const weight = 1 / criteria.length;
  return Object.fromEntries(criteria.map(criterion => [criterion, weight]));
}
