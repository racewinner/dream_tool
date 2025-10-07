/**
 * Interface defining the shape of repeat group statistics
 */
export interface RepeatGroupStats {
  /**
   * Path to the repeat group within the survey structure
   */
  path: string;
  
  /**
   * Total number of instances found across all surveys
   */
  instances: number;
  
  /**
   * Average completeness percentage across all instances
   */
  avgCompleteness: number;
  
  /**
   * Minimum completeness percentage found in any instance
   */
  minCompleteness: number;
  
  /**
   * Maximum completeness percentage found in any instance
   */
  maxCompleteness: number;
  
  /**
   * Consistency score (0-100) - higher means more consistent field counts and values
   */
  consistencyScore: number;
  
  /**
   * Array of field counts for each instance
   */
  fieldsPerInstance: number[];
}

/**
 * Interface for survey analysis results
 */
export interface SurveyAnalysisResult {
  /**
   * Overall completeness score (0-100)
   */
  completenessScore: number;
  
  /**
   * Data quality score (0-100)
   */
  dataQualityScore: number;
  
  /**
   * Distribution of surveys by facility
   */
  facilityDistribution: Record<string, number>;
  
  /**
   * Distribution of surveys by date
   */
  dateDistribution: Record<string, number>;
  
  /**
   * Missing required fields
   */
  missingFields: string[];
  
  /**
   * Repeat group analysis
   */
  repeatGroups: RepeatGroupStats[];
  
  /**
   * Recommendations for data improvement
   */
  recommendations: string[];
  
  /**
   * Analysis timestamp
   */
  timestamp: string;
}
