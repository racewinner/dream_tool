/**
 * Python Monitoring Service Client for DREAM Tool
 * Enhanced system monitoring and performance analytics
 */

import { API_CONFIG } from '../config/api';

export interface MonitoringStats {
  overview: {
    total_requests: number;
    avg_response_time: number;
    error_rate: number;
    time_range_hours: number;
  };
  top_endpoints: Array<{
    endpoint: string;
    count: number;
    avg_time: number;
  }>;
  top_users: Array<{
    user_id: string;
    request_count: number;
  }>;
  system_health: {
    status: string;
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  performance_trends: {
    response_times: number[];
    request_counts: number[];
    error_rates: number[];
  };
  recent_errors: Array<{
    timestamp: string;
    error_type: string;
    error_message: string;
    endpoint: string;
    severity: string;
  }>;
}

export interface SystemHealth {
  status: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  services: Record<string, string>;
  uptime: string;
  last_check: string;
}

export interface PerformanceMetrics {
  response_times: {
    average: number;
    trends: number[];
    p95: number;
    p99: number;
  };
  throughput: {
    requests_per_hour: number;
    peak_rps: number;
    trends: number[];
  };
  errors: {
    error_rate: number;
    error_trends: number[];
    total_errors: number;
  };
  system_resources: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
  };
}

export interface ErrorAnalytics {
  summary: {
    total_errors: number;
    error_rate: number;
    most_common_error?: string;
  };
  error_types: Array<{
    type: string;
    count: number;
  }>;
  affected_endpoints: Array<{
    endpoint: string;
    error_count: number;
  }>;
  severity_distribution: Array<{
    severity: string;
    count: number;
  }>;
  recent_errors: Array<{
    timestamp: string;
    type: string;
    message: string;
    endpoint: string;
    severity: string;
  }>;
}

export interface ActiveAlerts {
  active_alerts: number;
  alert_summary: {
    critical: number;
    high: number;
    warning: number;
    low: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    component: string;
    threshold?: number;
    current_value?: number;
    timestamp: string;
    status: string;
  }>;
}

export interface DashboardData {
  system_overview: {
    status: string;
    uptime: string;
    total_requests: number;
    avg_response_time: number;
    error_rate: number;
  };
  resource_usage: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  api_performance: {
    requests_per_hour: number;
    top_endpoints: Array<{
      endpoint: string;
      count: number;
      avg_time: number;
    }>;
    recent_errors: number;
  };
  trends: {
    response_times: number[];
    request_counts: number[];
    error_rates: number[];
  };
  alerts: {
    active: number;
    critical: number;
    warnings: number;
  };
}

export interface MonitoringResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
}

class PythonMonitoringService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/monitoring`;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Get comprehensive monitoring statistics
   */
  async getMonitoringStats(timeRange: number = 3600): Promise<MonitoringResponse<MonitoringStats>> {
    try {
      const params = new URLSearchParams({
        time_range: timeRange.toString()
      });

      const response = await fetch(`${this.baseUrl}/stats?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<MonitoringResponse<MonitoringStats>>(response);
    } catch (error) {
      console.error('Failed to get monitoring stats:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get monitoring stats'
      };
    }
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<MonitoringResponse<SystemHealth>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<MonitoringResponse<SystemHealth>>(response);
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get system health'
      };
    }
  }

  /**
   * Get detailed performance metrics
   */
  async getPerformanceMetrics(
    timeRange: number = 3600,
    metricType?: string
  ): Promise<MonitoringResponse<PerformanceMetrics>> {
    try {
      const params = new URLSearchParams({
        time_range: timeRange.toString(),
        ...(metricType && { metric_type: metricType })
      });

      const response = await fetch(`${this.baseUrl}/performance?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<MonitoringResponse<PerformanceMetrics>>(response);
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get performance metrics'
      };
    }
  }

  /**
   * Get error analytics and trends
   */
  async getErrorAnalytics(
    timeRange: number = 3600,
    severity?: string
  ): Promise<MonitoringResponse<ErrorAnalytics>> {
    try {
      const params = new URLSearchParams({
        time_range: timeRange.toString(),
        ...(severity && { severity })
      });

      const response = await fetch(`${this.baseUrl}/errors?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<MonitoringResponse<ErrorAnalytics>>(response);
    } catch (error) {
      console.error('Failed to get error analytics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get error analytics'
      };
    }
  }

  /**
   * Get active system alerts
   */
  async getActiveAlerts(severity?: string): Promise<MonitoringResponse<ActiveAlerts>> {
    try {
      const params = new URLSearchParams({
        ...(severity && { severity })
      });

      const response = await fetch(`${this.baseUrl}/alerts?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<MonitoringResponse<ActiveAlerts>>(response);
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get active alerts'
      };
    }
  }

  /**
   * Get dashboard summary data
   */
  async getDashboardData(): Promise<MonitoringResponse<DashboardData>> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboard`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<MonitoringResponse<DashboardData>>(response);
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get dashboard data'
      };
    }
  }

  /**
   * Clear monitoring metrics
   */
  async clearMetrics(metricType?: string): Promise<MonitoringResponse> {
    try {
      const params = new URLSearchParams({
        ...(metricType && { metric_type: metricType })
      });

      const response = await fetch(`${this.baseUrl}/metrics?${params}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      return this.handleResponse<MonitoringResponse>(response);
    } catch (error) {
      console.error('Failed to clear metrics:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to clear metrics'
      };
    }
  }

  /**
   * Log a custom monitoring event
   */
  async logCustomEvent(eventData: {
    event_type: string;
    message: string;
    [key: string]: any;
  }): Promise<MonitoringResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/log-event`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(eventData),
      });

      return this.handleResponse<MonitoringResponse>(response);
    } catch (error) {
      console.error('Failed to log custom event:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to log custom event'
      };
    }
  }

  /**
   * Format system health status for display
   */
  formatSystemHealth(health: SystemHealth): {
    status: string;
    statusColor: string;
    cpuStatus: string;
    memoryStatus: string;
    diskStatus: string;
    overallScore: number;
  } {
    const getResourceStatus = (percentage: number) => {
      if (percentage < 60) return 'good';
      if (percentage < 80) return 'warning';
      return 'critical';
    };

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'healthy': return '#4CAF50';
        case 'warning': return '#FF9800';
        case 'critical': return '#F44336';
        default: return '#9E9E9E';
      }
    };

    const overallScore = Math.round(
      ((100 - health.cpu_percent) + (100 - health.memory_percent) + (100 - health.disk_percent)) / 3
    );

    return {
      status: health.status,
      statusColor: getStatusColor(health.status),
      cpuStatus: getResourceStatus(health.cpu_percent),
      memoryStatus: getResourceStatus(health.memory_percent),
      diskStatus: getResourceStatus(health.disk_percent),
      overallScore
    };
  }

  /**
   * Format performance metrics for display
   */
  formatPerformanceMetrics(metrics: PerformanceMetrics): {
    responseTime: string;
    throughput: string;
    errorRate: string;
    availability: string;
  } {
    return {
      responseTime: `${metrics.response_times.average.toFixed(3)}s`,
      throughput: `${Math.round(metrics.throughput.requests_per_hour)} req/hr`,
      errorRate: `${metrics.errors.error_rate.toFixed(2)}%`,
      availability: `${(100 - metrics.errors.error_rate).toFixed(2)}%`
    };
  }

  /**
   * Get health status color based on percentage
   */
  getHealthStatusColor(percentage: number): string {
    if (percentage < 60) return '#4CAF50'; // Green
    if (percentage < 80) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  /**
   * Get alert severity color
   */
  getAlertSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return '#F44336';
      case 'high': return '#FF5722';
      case 'warning': return '#FF9800';
      case 'low': return '#FFC107';
      default: return '#9E9E9E';
    }
  }

  /**
   * Calculate uptime percentage from string
   */
  parseUptimePercentage(uptime: string): number {
    const match = uptime.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Format error message for display
   */
  formatErrorMessage(message: string, maxLength: number = 100): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get time range label
   */
  getTimeRangeLabel(seconds: number): string {
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    return `${Math.round(seconds / 86400)} days`;
  }

  /**
   * Generate performance trend chart data
   */
  generateTrendChartData(
    data: number[],
    label: string,
    color: string = '#1f77b4'
  ): {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  } {
    const labels = data.map((_, index) => `${index + 1}`);
    
    return {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.4
      }]
    };
  }

  /**
   * Validate metric type
   */
  validateMetricType(metricType: string): boolean {
    const validTypes = ['performance', 'requests', 'errors', 'system', 'alerts'];
    return validTypes.includes(metricType);
  }

  /**
   * Validate severity level
   */
  validateSeverity(severity: string): boolean {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    return validSeverities.includes(severity.toLowerCase());
  }

  /**
   * Validate time range (in seconds)
   */
  validateTimeRange(timeRange: number): boolean {
    return timeRange >= 300 && timeRange <= 86400; // 5 minutes to 24 hours
  }
}

// Export singleton instance
export const pythonMonitoringService = new PythonMonitoringService();
export default pythonMonitoringService;
