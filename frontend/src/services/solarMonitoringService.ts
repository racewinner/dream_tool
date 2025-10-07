/**
 * Solar Monitoring Service
 * Client for interacting with the Python Solar Monitoring API
 */

import { getAuthHeader } from './authHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const PYTHON_API_URL = `${API_BASE_URL}/api/python/solar-monitoring`;

// Types
export interface MonitoringDataPoint {
  date: string;
  value: number;
}

export interface MonitoringSummary {
  total?: number;
  average?: number;
  max?: number;
  min?: number;
  count: number;
}

export interface MonitoringData {
  values: MonitoringDataPoint[];
  unit: string;
  summary: MonitoringSummary;
  metadata?: {
    facility_id: number;
    provider: string;
    site_id: string;
    data_type: string;
    resolution: string;
    start_date: string;
    end_date: string;
    retrieved_at: string;
  };
}

export interface MonitoringIssue {
  issue_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  confidence_score: number;
}

export interface CorrelatedIssue {
  id: string;
  issue_type: string;
  component_type: string;
  severity: string;
  description: string;
  confidence_score: number;
  monitoring_evidence?: string;
  adjusted_confidence?: number;
}

export interface CorrelationResult {
  assessment_id: string;
  monitoring_period: {
    start: string;
    end: string;
    days: number;
  };
  monitoring_summary: MonitoringSummary;
  expected_production?: number;
  performance_ratio?: number;
  monitoring_issues: MonitoringIssue[];
  correlated_issues: CorrelatedIssue[];
  correlation_summary: {
    total_issues: number;
    correlated_issues: number;
    new_issues_from_monitoring: number;
  };
}

export interface MonitoringProvider {
  id: string;
  name: string;
}

export interface MonitoringSystemRegistration {
  facility_id: number;
  provider: string;
  site_id: string;
  site_name?: string;
  registered_at: string;
  status: string;
}

export interface MonitoringConnectionTest {
  provider: string;
  site_id: string;
  connection_status: string;
  tested_at: string;
  system_info?: {
    name: string;
    capacity_kw: number;
    installation_date: string;
  };
}

/**
 * Solar Monitoring Service
 */
export const solarMonitoringService = {
  /**
   * Get monitoring data
   */
  async getMonitoringData(params: {
    facilityId: number;
    provider: string;
    siteId: string;
    startDate?: string;
    endDate?: string;
    dataType?: string;
    resolution?: string;
  }): Promise<MonitoringData> {
    const queryParams = new URLSearchParams();
    queryParams.append('provider', params.provider);
    queryParams.append('site_id', params.siteId);
    
    if (params.startDate) {
      queryParams.append('start_date', params.startDate);
    }
    
    if (params.endDate) {
      queryParams.append('end_date', params.endDate);
    }
    
    if (params.dataType) {
      queryParams.append('data_type', params.dataType);
    }
    
    if (params.resolution) {
      queryParams.append('resolution', params.resolution);
    }
    
    const response = await fetch(`${PYTHON_API_URL}/data/${params.facilityId}?${queryParams.toString()}`, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get monitoring data');
    }

    return response.json();
  },

  /**
   * Correlate monitoring data with assessment
   */
  async correlateWithAssessment(params: {
    assessmentId: string;
    provider: string;
    siteId: string;
    startDate?: string;
    endDate?: string;
    dataType?: string;
    resolution?: string;
  }): Promise<CorrelationResult> {
    const queryParams = new URLSearchParams();
    queryParams.append('provider', params.provider);
    queryParams.append('site_id', params.siteId);
    
    if (params.startDate) {
      queryParams.append('start_date', params.startDate);
    }
    
    if (params.endDate) {
      queryParams.append('end_date', params.endDate);
    }
    
    if (params.dataType) {
      queryParams.append('data_type', params.dataType);
    }
    
    if (params.resolution) {
      queryParams.append('resolution', params.resolution);
    }
    
    const response = await fetch(`${PYTHON_API_URL}/correlate/${params.assessmentId}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to correlate monitoring data');
    }

    return response.json();
  },

  /**
   * Register monitoring system
   */
  async registerMonitoringSystem(params: {
    facilityId: number;
    provider: string;
    siteId: string;
    apiKey?: string;
    siteName?: string;
    siteDetails?: Record<string, any>;
  }): Promise<MonitoringSystemRegistration> {
    const response = await fetch(`${PYTHON_API_URL}/register`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        facility_id: params.facilityId,
        provider: params.provider,
        site_id: params.siteId,
        api_key: params.apiKey,
        site_name: params.siteName,
        site_details: params.siteDetails
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to register monitoring system');
    }

    return response.json();
  },

  /**
   * Test monitoring connection
   */
  async testMonitoringConnection(params: {
    provider: string;
    siteId: string;
    apiKey?: string;
  }): Promise<MonitoringConnectionTest> {
    const response = await fetch(`${PYTHON_API_URL}/test-connection`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: params.provider,
        site_id: params.siteId,
        api_key: params.apiKey
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to test monitoring connection');
    }

    return response.json();
  },

  /**
   * Get supported monitoring providers
   */
  async getSupportedProviders(): Promise<{ providers: MonitoringProvider[] }> {
    const response = await fetch(`${PYTHON_API_URL}/providers`, {
      headers: {
        ...getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get supported providers');
    }

    return response.json();
  }
};

export default solarMonitoringService;
