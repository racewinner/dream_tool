/**
 * Solar PV Component Analysis Service
 * Client for interacting with the Python Solar PV Component Analysis API
 */

import { getAuthHeader } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const PYTHON_API_URL = `${API_BASE_URL}/api/python/solar-analysis`;

// Types
export interface SolarComponentDetected {
  id: string;
  component_type: 'solar_panel' | 'battery' | 'inverter' | 'mppt';
  photo_url: string;
  annotated_photo_url?: string;
  detection_confidence: number;
  analysis_results: any;
}

export interface SystemCapacityAnalysis {
  id: string;
  solar_capacity_kw?: number;
  panel_count?: number;
  individual_panel_watts?: number;
  battery_capacity_kwh?: number;
  battery_count?: number;
  battery_voltage?: number;
  battery_ah?: number;
  inverter_capacity_kw?: number;
  inverter_type?: string;
  mppt_capacity_kw?: number;
  estimated_backup_hours?: number;
  system_balance_status: string;
  total_system_summary: Record<string, string>;
  is_balanced: boolean;
}

export interface DetectedIssue {
  id: string;
  component_type: string;
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact_description?: string;
  estimated_power_loss_percent?: number;
  photo_evidence_url?: string;
  confidence_score: number;
}

export interface UpgradeRecommendation {
  id: string;
  recommendation_type: 'capacity_expansion' | 'replacement' | 'maintenance' | 'installation_improvement';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  current_value?: string;
  recommended_value?: string;
  estimated_cost_usd?: number;
  estimated_annual_savings_usd?: number;
  payback_period_months?: number;
  implementation_notes?: string;
  roi_calculation?: string;
}

export interface SolarSystemAssessment {
  id: string;
  facility_id: number;
  submission_id: string;
  assessment_date: string;
  surveyor_name?: string;
  submission_source: 'kobocollect' | 'manual_upload';
  analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
  overall_confidence_score?: number;
  created_at: string;
  components: SolarComponentDetected[];
  capacity?: SystemCapacityAnalysis;
  issues: DetectedIssue[];
  recommendations: UpgradeRecommendation[];
}

export interface AssessmentListItem {
  id: string;
  facility_id: number;
  assessment_date: string;
  surveyor_name?: string;
  analysis_status: string;
  overall_confidence_score?: number;
  created_at: string;
}

export interface AssessmentListResponse {
  total: number;
  limit: number;
  offset: number;
  assessments: AssessmentListItem[];
}

/**
 * Solar PV Component Analysis Service
 */
export const solarAnalysisService = {
  /**
   * Create a new assessment
   */
  async createAssessment(facilityId: number, submissionId: string, surveyorName?: string): Promise<{ assessment_id: string }> {
    const formData = new FormData();
    formData.append('facility_id', facilityId.toString());
    formData.append('submission_id', submissionId);
    if (surveyorName) {
      formData.append('surveyor_name', surveyorName);
    }
    formData.append('submission_source', 'manual_upload');

    const response = await fetch(`${PYTHON_API_URL}/assessments`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create assessment');
    }

    return response.json();
  },

  /**
   * Upload a component photo
   */
  async uploadComponentPhoto(assessmentId: string, componentType: string, photoFile: File): Promise<{ component_id: string }> {
    const formData = new FormData();
    formData.append('component_type', componentType);
    formData.append('photo', photoFile);

    const response = await fetch(`${PYTHON_API_URL}/assessments/${assessmentId}/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload component photo');
    }

    return response.json();
  },

  /**
   * Start assessment analysis
   */
  async analyzeAssessment(assessmentId: string): Promise<{ status: string }> {
    const response = await fetch(`${PYTHON_API_URL}/assessments/${assessmentId}/analyze`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start assessment analysis');
    }

    return response.json();
  },

  /**
   * Get assessment details
   */
  async getAssessment(assessmentId: string): Promise<SolarSystemAssessment> {
    const response = await fetch(`${PYTHON_API_URL}/assessments/${assessmentId}`, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get assessment');
    }

    return response.json();
  },

  /**
   * List assessments
   */
  async listAssessments(options: {
    facilityId?: number;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AssessmentListResponse> {
    const params = new URLSearchParams();
    if (options.facilityId) {
      params.append('facility_id', options.facilityId.toString());
    }
    if (options.status) {
      params.append('status', options.status);
    }
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options.offset) {
      params.append('offset', options.offset.toString());
    }

    const url = `${PYTHON_API_URL}/assessments?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to list assessments');
    }

    return response.json();
  },

  /**
   * Get image URL with authentication token
   * This ensures that images are properly authenticated when displayed
   */
  getAuthenticatedImageUrl(imageUrl: string): string {
    // If it's already an absolute URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // If it's a relative URL, prepend the API base URL
    const url = imageUrl.startsWith('/') 
      ? `${API_BASE_URL}${imageUrl}`
      : `${API_BASE_URL}/${imageUrl}`;
    
    // Add authentication token as query parameter
    const token = localStorage.getItem('token');
    if (token) {
      return `${url}?token=${token}`;
    }
    
    return url;
  }
};

export default solarAnalysisService;
