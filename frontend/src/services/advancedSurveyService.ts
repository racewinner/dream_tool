import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Advanced Survey API client
const surveyApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for advanced survey features
export interface AdvancedSurveyData {
  id: number;
  externalId: string;
  facilityId: number;
  facilityData: {
    name: string;
    type: string;
    location: {
      latitude: number;
      longitude: number;
    };
    capacity?: number;
    services?: string[];
  };
  responses: Record<string, any>;
  metadata: {
    submissionTime: string;
    submitter?: string;
    version?: string;
    source: 'kobo' | 'manual' | 'api';
  };
  analysis?: {
    completeness: number;
    quality: number;
    flags: string[];
    recommendations: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface SurveyAnalysisResult {
  surveyId: number;
  completeness: {
    overall: number;
    bySection: Record<string, number>;
    missingFields: string[];
  };
  quality: {
    score: number;
    issues: Array<{
      field: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  insights: {
    trends: Record<string, any>;
    patterns: string[];
    recommendations: string[];
  };
}

export interface SurveyComparisonResult {
  surveys: number[];
  comparison: {
    similarities: string[];
    differences: string[];
    trends: Record<string, any>;
  };
  recommendations: string[];
}

export interface SurveyExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  includeAnalysis: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  filters?: {
    facilityType?: string;
    completeness?: number;
    quality?: number;
  };
}

// Advanced Survey Service
export class AdvancedSurveyService {
  /**
   * Get surveys with advanced filtering and analysis
   */
  static async getAdvancedSurveys(
    token: string,
    options?: {
      includeAnalysis?: boolean;
      facilityType?: string;
      completenessThreshold?: number;
      qualityThreshold?: number;
      dateRange?: {
        startDate: string;
        endDate: string;
      };
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    success: boolean;
    data: AdvancedSurveyData[];
    total: number;
    analytics: {
      averageCompleteness: number;
      averageQuality: number;
      totalSurveys: number;
      facilityTypes: Record<string, number>;
    };
  }> {
    try {
      const params = new URLSearchParams();
      if (options?.includeAnalysis) params.append('includeAnalysis', 'true');
      if (options?.facilityType) params.append('facilityType', options.facilityType);
      if (options?.completenessThreshold) params.append('completenessThreshold', options.completenessThreshold.toString());
      if (options?.qualityThreshold) params.append('qualityThreshold', options.qualityThreshold.toString());
      if (options?.dateRange?.startDate) params.append('startDate', options.dateRange.startDate);
      if (options?.dateRange?.endDate) params.append('endDate', options.dateRange.endDate);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await surveyApi.get(`/api/surveys?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch advanced surveys');
    }
  }

  /**
   * Get detailed survey analysis
   */
  static async getSurveyAnalysis(
    token: string, 
    surveyId: number
  ): Promise<{ success: boolean; data: SurveyAnalysisResult }> {
    try {
      const response = await surveyApi.get(`/api/surveys/${surveyId}/analysis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get survey analysis');
    }
  }

  /**
   * Compare multiple surveys
   */
  static async compareSurveys(
    token: string, 
    surveyIds: number[]
  ): Promise<{ success: boolean; data: SurveyComparisonResult }> {
    try {
      const response = await surveyApi.post('/api/surveys/compare', 
        { surveyIds },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to compare surveys');
    }
  }

  /**
   * Get survey trends and patterns
   */
  static async getSurveyTrends(
    token: string,
    options?: {
      timeframe: 'week' | 'month' | 'quarter' | 'year';
      facilityType?: string;
      metrics: ('completeness' | 'quality' | 'submissions' | 'facilities')[];
    }
  ): Promise<{
    success: boolean;
    data: {
      trends: Record<string, Array<{ date: string; value: number }>>;
      insights: string[];
      predictions: Record<string, number>;
    };
  }> {
    try {
      const response = await surveyApi.post('/api/surveys/trends', options, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get survey trends');
    }
  }

  /**
   * Export surveys with advanced options
   */
  static async exportSurveys(
    token: string, 
    options: SurveyExportOptions
  ): Promise<{ success: boolean; downloadUrl: string; filename: string }> {
    try {
      const response = await surveyApi.post('/api/surveys/export', options, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to export surveys');
    }
  }

  /**
   * Bulk update survey analysis
   */
  static async bulkAnalyzeSurveys(
    token: string, 
    surveyIds: number[]
  ): Promise<{ 
    success: boolean; 
    processed: number; 
    failed: number; 
    results: Array<{ surveyId: number; status: 'success' | 'failed'; error?: string }>;
  }> {
    try {
      const response = await surveyApi.post('/api/surveys/bulk-analyze', 
        { surveyIds },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to bulk analyze surveys');
    }
  }

  /**
   * Get survey validation rules
   */
  static async getValidationRules(
    token: string
  ): Promise<{
    success: boolean;
    data: {
      rules: Array<{
        field: string;
        type: 'required' | 'format' | 'range' | 'custom';
        rule: string;
        message: string;
      }>;
      customRules: Record<string, any>;
    };
  }> {
    try {
      const response = await surveyApi.get('/api/surveys/validation-rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get validation rules');
    }
  }

  /**
   * Update survey validation rules
   */
  static async updateValidationRules(
    token: string,
    rules: Array<{
      field: string;
      type: 'required' | 'format' | 'range' | 'custom';
      rule: string;
      message: string;
    }>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await surveyApi.put('/api/surveys/validation-rules', 
        { rules },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update validation rules');
    }
  }

  /**
   * Get survey completeness statistics
   */
  static async getCompletenessStats(
    token: string,
    facilityType?: string
  ): Promise<{
    success: boolean;
    data: {
      overall: number;
      byFacilityType: Record<string, number>;
      byField: Record<string, number>;
      trends: Array<{ date: string; completeness: number }>;
    };
  }> {
    try {
      const params = facilityType ? `?facilityType=${facilityType}` : '';
      const response = await surveyApi.get(`/api/surveys/completeness-stats${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get completeness statistics');
    }
  }

  /**
   * Get survey quality metrics
   */
  static async getQualityMetrics(
    token: string,
    facilityType?: string
  ): Promise<{
    success: boolean;
    data: {
      overall: number;
      byFacilityType: Record<string, number>;
      commonIssues: Array<{ issue: string; frequency: number; severity: string }>;
      improvements: string[];
    };
  }> {
    try {
      const params = facilityType ? `?facilityType=${facilityType}` : '';
      const response = await surveyApi.get(`/api/surveys/quality-metrics${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get quality metrics');
    }
  }
}

export default AdvancedSurveyService;
