/**
 * Solar Report Service
 * Client for interacting with the Python Solar Report API
 */

import { getAuthHeader } from './authHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const PYTHON_API_URL = `${API_BASE_URL}/api/python/solar-report`;

// Types
export interface ReportGenerationTask {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  assessment_id: string;
  started_at: string;
  completed_at?: string;
}

export interface ReportMetadata {
  filename: string;
  assessment_id: string;
  file_path: string;
  file_size_kb: number;
  created_at: string;
  format: string;
}

export interface ReportListResponse {
  reports: ReportMetadata[];
  count: number;
  limit: number;
  offset: number;
}

/**
 * Solar Report Service
 */
export const solarReportService = {
  /**
   * Generate a report for a solar assessment
   */
  async generateReport(params: {
    assessmentId: string;
    includeMonitoring?: boolean;
    includeHistory?: boolean;
    outputFormat?: string;
  }): Promise<ReportGenerationTask> {
    const queryParams = new URLSearchParams();
    
    if (params.includeMonitoring !== undefined) {
      queryParams.append('include_monitoring', params.includeMonitoring.toString());
    }
    
    if (params.includeHistory !== undefined) {
      queryParams.append('include_history', params.includeHistory.toString());
    }
    
    if (params.outputFormat) {
      queryParams.append('output_format', params.outputFormat);
    }
    
    const response = await fetch(`${PYTHON_API_URL}/generate/${params.assessmentId}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate report');
    }

    return response.json();
  },

  /**
   * Check the status of a report generation task
   */
  async checkReportStatus(taskId: string): Promise<ReportGenerationTask> {
    const response = await fetch(`${PYTHON_API_URL}/status/${taskId}`, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to check report status');
    }

    return response.json();
  },

  /**
   * Get a list of generated reports
   */
  async getReportList(params?: {
    facilityId?: number;
    limit?: number;
    offset?: number;
  }): Promise<ReportListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.facilityId !== undefined) {
      queryParams.append('facility_id', params.facilityId.toString());
    }
    
    if (params?.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }
    
    const response = await fetch(`${PYTHON_API_URL}/list?${queryParams.toString()}`, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get report list');
    }

    return response.json();
  },

  /**
   * Get the download URL for a report
   */
  getReportDownloadUrl(filename: string): string {
    return `${PYTHON_API_URL}/download/${filename}`;
  },

  /**
   * Download a report
   */
  async downloadReport(filename: string): Promise<Blob> {
    const response = await fetch(`${PYTHON_API_URL}/download/${filename}`, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to download report' }));
      throw new Error(error.detail || 'Failed to download report');
    }

    return response.blob();
  }
};

export default solarReportService;
