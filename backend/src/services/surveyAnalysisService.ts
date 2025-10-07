import { sequelize } from '../models';
import { Op } from 'sequelize';

// Get model references from Sequelize instance
const Survey = sequelize.models.Survey;
const Facility = sequelize.models.Facility;

// Add type imports for model instances
type SurveyInstance = any;
type FacilityInstance = any;

/**
 * Repeat group statistics for a single repeat group
 */
interface RepeatGroupStats {
  path: string;
  instances: number;
  avgCompleteness: number;
  minCompleteness: number;
  maxCompleteness: number;
  consistencyScore: number;
  fieldsPerInstance: number[];
}

/**
 * Result of the survey data analysis
 */
interface AnalysisResult {
  surveyCount: number;
  completenessScore: number;
  dataQualityScore: number;
  facilityDistribution: Record<string, number>;
  dateDistribution: Record<string, number>;
  repeatGroups: RepeatGroupStats[];
  missingFields: string[];
  summary: string;
  recommendedActions?: string[];
}

/**
 * Service for analyzing survey data after import
 */
export class SurveyAnalysisService {
  private static instance: SurveyAnalysisService;
  private latestRepeatGroups: RepeatGroupStats[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SurveyAnalysisService {
    if (!SurveyAnalysisService.instance) {
      SurveyAnalysisService.instance = new SurveyAnalysisService();
    }
    return SurveyAnalysisService.instance;
  }

  /**
   * Analyze surveys imported within a date range
   * @param startDate Beginning of date range
   * @param endDate End of date range
   * @returns Analysis results
   */
  public async analyzeRecentImports(startDate: Date, endDate: Date): Promise<AnalysisResult> {
    console.log(`🔍 Analyzing surveys imported between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    const surveys = await Survey.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Facility,
          as: 'facility',
          required: true
        }
      ]
    });
    
    console.log(`📊 Found ${surveys.length} surveys to analyze`);
    
    if (surveys.length === 0) {
      return {
        surveyCount: 0,
        completenessScore: 0,
        dataQualityScore: 0,
        facilityDistribution: {},
        dateDistribution: {},
        repeatGroups: [],
        missingFields: [],
        summary: 'No surveys found in the specified date range.'
      };
    }
    
    return this.analyzeSurveys(surveys);
  }

  /**
   * Analyze a specific survey by ID
   * @param surveyId Survey ID
   * @returns Analysis result
   */
  public async analyzeSurvey(surveyId: number): Promise<AnalysisResult> {
    console.log(`🔍 Analyzing survey ID: ${surveyId}`);
    
    const survey = await Survey.findByPk(surveyId, {
      include: [
        {
          model: Facility,
          as: 'facility',
          required: true
        }
      ]
    });
    
    if (!survey) {
      throw new Error(`Survey with ID ${surveyId} not found`);
    }
    
    return this.analyzeSurveys([survey]);
  }

  /**
   * Analyze a batch of surveys
   * @param surveys Array of survey objects
   * @returns Analysis result
   */
  private analyzeSurveys(surveys: SurveyInstance[]): AnalysisResult {
    console.log(`🧮 Performing analysis on ${surveys.length} surveys`);
    
    // Initialize result structure
    const result: AnalysisResult = {
      surveyCount: surveys.length,
      completenessScore: 0,
      dataQualityScore: 0,
      facilityDistribution: {},
      dateDistribution: {},
      repeatGroups: [],
      missingFields: [],
      summary: '',
      recommendedActions: []
    };
    
    // Calculate facility distribution
    surveys.forEach(survey => {
      const facilityName = survey.facility?.name || 'Unknown';
      result.facilityDistribution[facilityName] = (result.facilityDistribution[facilityName] || 0) + 1;
    });
    
    // Calculate date distribution by month
    surveys.forEach(survey => {
      if (survey.collectionDate) {
        const month = survey.collectionDate.toISOString().substring(0, 7); // YYYY-MM format
        result.dateDistribution[month] = (result.dateDistribution[month] || 0) + 1;
      }
    });
    
    // Analyze data completeness
    result.completenessScore = this.calculateCompletenessScore(surveys);
    
    // Analyze data quality
    result.dataQualityScore = this.calculateDataQualityScore(surveys);
    
    // Find missing fields
    result.missingFields = this.identifyMissingFields(surveys);
    
    // Generate summary and recommendations
    result.summary = this.generateSummary(result);
    result.recommendedActions = this.generateRecommendations(result);
    
    return result;
  }

  /**
   * Calculate data completeness score (0-100)
   * @param surveys Array of survey objects
   * @returns Completeness score
   */
  /**
   * Calculate data completeness score (0-100) with enhanced repeat group handling
   * @param surveys Array of survey objects
   * @returns Completeness score
   */
  private calculateCompletenessScore(surveys: SurveyInstance[]): number {
    let totalScore = 0;
    const allRepeatGroups: Map<string, RepeatGroupStats> = new Map();
    
    surveys.forEach(survey => {
      let fieldCount = 0;
      let filledFieldCount = 0;
      
      // Check facility data fields
      if (survey.facilityData && typeof survey.facilityData === 'object') {
        const facilityData = survey.facilityData as Record<string, any>;
        const surveyId = survey.id || 'unknown';
        
        // Count all fields recursively with enhanced repeat group detection
        const countFields = (obj: any, path: string = ''): [number, number, Record<string, any>] => {
          let total = 0;
          let filled = 0;
          const repeatStats: Record<string, any> = {};
          
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (Array.isArray(value)) {
              // This is a repeat group
              console.log(`🔄 Found repeat group at ${currentPath} with ${value.length} instances`);
              
              const instanceCompleteness: number[] = [];
              const instanceFieldCounts: number[] = [];
              let groupTotal = 0;
              let groupFilled = 0;
              
              // Process each instance in the repeat group
              value.forEach((instance, index) => {
                if (typeof instance === 'object' && instance !== null) {
                  const [instTotal, instFilled, instRepeatStats] = countFields(instance, `${currentPath}[${index}]`);
                  groupTotal += instTotal;
                  groupFilled += instFilled;
                  
                  // Calculate completeness for this repeat instance
                  const instanceCompletenessPct = instTotal > 0 ? (instFilled / instTotal) * 100 : 0;
                  instanceCompleteness.push(instanceCompletenessPct);
                  instanceFieldCounts.push(instTotal);
                  
                  // Merge nested repeat stats
                  Object.assign(repeatStats, instRepeatStats);
                }
              });
              
              // Add to total counts
              total += groupTotal;
              filled += groupFilled;
              
              // Calculate consistency score between instances
              const fieldCountDeviation = this.calculateStandardDeviation(instanceFieldCounts);
              const completenessDeviation = this.calculateStandardDeviation(instanceCompleteness);
              const consistencyScore = 100 - Math.min(100, (fieldCountDeviation * 5) + (completenessDeviation / 2));
              
              // Store repeat group stats
              const groupStats: RepeatGroupStats = {
                path: currentPath,
                instances: value.length,
                avgCompleteness: instanceCompleteness.length > 0 ? 
                  instanceCompleteness.reduce((sum, val) => sum + val, 0) / instanceCompleteness.length : 0,
                minCompleteness: Math.min(...(instanceCompleteness.length ? instanceCompleteness : [0])),
                maxCompleteness: Math.max(...(instanceCompleteness.length ? instanceCompleteness : [0])),
                consistencyScore,
                fieldsPerInstance: instanceFieldCounts
              };
              
              // Merge with global repeat group stats
              const existingGroup = allRepeatGroups.get(currentPath);
              if (!existingGroup) {
                allRepeatGroups.set(currentPath, groupStats);
              } else {
                // Update existing group statistics
                existingGroup.instances += groupStats.instances;
                existingGroup.avgCompleteness = 
                  (existingGroup.avgCompleteness + groupStats.avgCompleteness) / 2;
                existingGroup.minCompleteness = 
                  Math.min(existingGroup.minCompleteness, groupStats.minCompleteness);
                existingGroup.maxCompleteness = 
                  Math.max(existingGroup.maxCompleteness, groupStats.maxCompleteness);
                existingGroup.consistencyScore = 
                  (existingGroup.consistencyScore + groupStats.consistencyScore) / 2;
                existingGroup.fieldsPerInstance = 
                  existingGroup.fieldsPerInstance.concat(groupStats.fieldsPerInstance);
              }
              
              repeatStats[currentPath] = groupStats;
            } else if (typeof value === 'object' && value !== null) {
              // Regular nested object
              const [subTotal, subFilled, subRepeatStats] = countFields(value, currentPath);
              total += subTotal;
              filled += subFilled;
              Object.assign(repeatStats, subRepeatStats);
            } else {
              // Regular field
              total++;
              if (value !== null && value !== undefined && value !== '') {
                filled++;
              }
            }
          });
          
          return [total, filled, repeatStats];
        };
        
        // Process all fields in this survey
        const [totalFields, filledFields, repeatGroupStats] = countFields(facilityData);
        fieldCount += totalFields;
        filledFieldCount += filledFields;
      }
      
      // Calculate individual survey score
      const surveyScore = fieldCount > 0 ? (filledFieldCount / fieldCount) * 100 : 0;
      totalScore += surveyScore;
    });
    
    // Update the global result with repeat group information
    this.latestRepeatGroups = Array.from(allRepeatGroups.values());
    
    // Return average score
    return surveys.length > 0 ? Math.round(totalScore / surveys.length) : 0;
  }
  
  /**
   * Calculate standard deviation for a set of numbers
   * @param values Array of numeric values
   * @returns Standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (!values.length) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Calculate data quality score (0-100)
   * @param surveys Array of survey objects
   * @returns Quality score
   */
  private calculateDataQualityScore(surveys: SurveyInstance[]): number {
    let totalScore = 0;
    
    surveys.forEach(survey => {
      let qualityScore = 100;
      
      // Check for consistent facility data
      if (!survey.facilityData || typeof survey.facilityData !== 'object') {
        qualityScore -= 20;
      }
      
      // Check for valid collection date
      if (!survey.collectionDate || isNaN(survey.collectionDate.getTime())) {
        qualityScore -= 10;
      }
      
      // Check for valid respondent ID
      if (!survey.respondentId || survey.respondentId === 'unknown') {
        qualityScore -= 5;
      }
      
      // Check for duplicate external IDs (simplistic approach)
      // In a real implementation, this would require a more sophisticated approach
      
      // Ensure score stays within bounds
      qualityScore = Math.max(0, Math.min(100, qualityScore));
      totalScore += qualityScore;
    });
    
    // Return average score
    return surveys.length > 0 ? Math.round(totalScore / surveys.length) : 0;
  }

  /**
   * Identify missing fields across surveys
   * @param surveys Array of survey objects
   * @returns Array of missing field paths
   */
  private identifyMissingFields(surveys: SurveyInstance[]): string[] {
    const missingFields = new Set<string>();
    
    surveys.forEach(survey => {
      if (survey.facilityData && typeof survey.facilityData === 'object') {
        const facilityData = survey.facilityData as Record<string, any>;
        
        // Check for commonly expected fields
        const checkMissingField = (obj: any, path: string, expectedFields: string[]) => {
          expectedFields.forEach(field => {
            if (!obj || obj[field] === undefined || obj[field] === null || obj[field] === '') {
              missingFields.add(`${path}.${field}`);
            }
          });
        };
        
        // Check common expected facility fields (adjust based on your data model)
        checkMissingField(facilityData, 'facilityData', ['infrastructure', 'responses']);
        
        if (facilityData.infrastructure) {
          checkMissingField(facilityData.infrastructure, 'facilityData.infrastructure', 
            ['gpsLatitude', 'gpsLongitude']);
        }
      }
    });
    
    return Array.from(missingFields);
  }

  /**
   * Generate analysis summary
   * @param result Analysis result object
   * @returns Summary text
   */
  private generateSummary(result: AnalysisResult): string {
    const summaries = [
      `Analyzed ${result.surveyCount} surveys.`,
      `Data completeness: ${result.completenessScore}%`,
      `Data quality: ${result.dataQualityScore}%`,
      `Surveys collected from ${Object.keys(result.facilityDistribution).length} facilities.`
    ];
    
    if (result.missingFields.length > 0) {
      summaries.push(`Found ${result.missingFields.length} types of missing fields.`);
    }
    
    return summaries.join(' ');
  }

  /**
   * Generate recommendations based on analysis
   * @param result Analysis result object
   * @returns Array of recommendation strings
   */
  private generateRecommendations(result: AnalysisResult): string[] {
    const recommendations: string[] = [];
    
    // Recommend based on completeness
    if (result.completenessScore < 70) {
      recommendations.push('Improve data collection completeness by reviewing the survey form design.');
    }
    
    // Recommend based on quality
    if (result.dataQualityScore < 70) {
      recommendations.push('Address data quality issues by implementing validation rules in the collection form.');
    }
    
    // Recommend based on missing fields
    if (result.missingFields.length > 0) {
      recommendations.push('Review and collect missing fields: ' + 
        result.missingFields.slice(0, 3).join(', ') + 
        (result.missingFields.length > 3 ? ` and ${result.missingFields.length - 3} more...` : ''));
    }
    
    // Recommend based on facility distribution
    const facilityCount = Object.keys(result.facilityDistribution).length;
    const surveysPerFacility = result.surveyCount / facilityCount;
    if (surveysPerFacility < 2 && result.surveyCount > 10) {
      recommendations.push('Consider collecting more data per facility for better statistical significance.');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const surveyAnalysis = SurveyAnalysisService.getInstance();
