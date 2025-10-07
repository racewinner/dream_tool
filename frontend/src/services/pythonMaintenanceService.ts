/**
 * Python Maintenance Analytics Service Client
 * Enhanced maintenance analytics with ML and statistical analysis
 */

import { API_CONFIG } from '../config/api';

// Enhanced interfaces for Python service responses
export interface SystemMetrics {
  daily_generation: number;
  monthly_generation: number;
  yearly_generation: number;
  efficiency: number;
  maintenance_costs: {
    total: number;
    average_per_kw: number;
    trend: 'INCREASE' | 'DECREASE' | 'STABLE';
  };
  operational_hours: number;
  downtime: {
    total_hours: number;
    percentage: number;
    frequency: number;
  };
  energy_loss: {
    total_kwh: number;
    percentage: number;
    causes: string[];
  };
  system_availability: number;
  performance_ratio: number;
  capacity_factor: number;
  
  // Enhanced ML metrics
  anomaly_score: number;
  predictive_maintenance_score: number;
  failure_probability: number;
  optimal_maintenance_interval: number;
}

export interface SystemStatus {
  operational: boolean;
  maintenance_required: boolean;
  performance: number;
  alerts: string[];
  maintenance_schedule: {
    next_maintenance: string | null;
    frequency: string;
    last_maintenance: string | null;
    overdue: boolean;
    upcoming: boolean;
  };
  health_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  upcoming_maintenance: {
    count: number;
    next_date: string | null;
    types: string[];
  };
  system_metrics: {
    efficiency: number;
    availability: number;
    reliability: number;
    performance: number;
  };
  recent_issues: {
    count: number;
    severity: 'LOW' | 'MODERATE' | 'HIGH';
    types: string[];
  };
  
  // Enhanced ML insights
  predicted_failures: Array<{
    type: string;
    probability: number;
    predicted_date: string;
    confidence: number;
  }>;
  maintenance_recommendations: string[];
  cost_optimization_suggestions: string[];
}

export interface MaintenanceInsights {
  system_id: number;
  analysis_date: string;
  insights: {
    performance_trends: {
      efficiency_score: number;
      availability_score: number;
      reliability_trend: number;
    };
    cost_analysis: {
      total_maintenance_cost: number;
      cost_trend: string;
      cost_per_kwh: number;
    };
    predictive_indicators: {
      anomaly_score: number;
      failure_probability: number;
      maintenance_score: number;
    };
    operational_metrics: {
      downtime_percentage: number;
      energy_loss_percentage: number;
      capacity_factor: number;
    };
  };
  recommendations: string[];
  risk_assessment: {
    current_risk_level: string;
    health_score: number;
    risk_factors: string[];
    mitigation_actions: string[];
  };
  cost_analysis: {
    annual_maintenance_cost: number;
    cost_optimization_potential: number;
    roi_improvement_suggestions: string[];
  };
}

export interface PredictiveMaintenance {
  system_id: number;
  prediction_date: string;
  failure_probability: number;
  recommended_actions: string[];
  optimal_maintenance_date: string;
  cost_impact: {
    preventive_maintenance_cost: number;
    reactive_maintenance_cost: number;
    potential_savings: number;
    roi_percentage: number;
  };
}

export interface FleetOverview {
  fleet_overview: {
    total_systems: number;
    systems_by_status: {
      operational: number;
      maintenance_required: number;
      critical: number;
    };
    fleet_metrics: {
      average_health_score: number;
      total_maintenance_cost: number;
      average_availability: number;
      fleet_capacity_factor: number;
    };
    risk_distribution: {
      low_risk: number;
      moderate_risk: number;
      high_risk: number;
      critical_risk: number;
    };
    optimization_opportunities: string[];
  };
  analysis_date: string;
  recommendations: string[];
}

export interface CostOptimizationAnalysis {
  cost_analysis: {
    current_costs: {
      total_annual_maintenance: number;
      cost_per_kw: number;
      preventive_vs_reactive_ratio: number;
    };
    optimization_potential: {
      estimated_savings: number;
      roi_percentage: number;
      payback_period_months: number;
    };
    recommendations: string[];
    cost_drivers: string[];
  };
  analysis_date: string;
  next_review_date: string;
}

class PythonMaintenanceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/maintenance-analytics`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get comprehensive system performance metrics with ML insights
   */
  async getSystemMetrics(systemId: number): Promise<SystemMetrics> {
    return this.makeRequest<SystemMetrics>(`/system/${systemId}/metrics`);
  }

  /**
   * Get system status with predictive insights and recommendations
   */
  async getSystemStatus(systemId: number): Promise<SystemStatus> {
    return this.makeRequest<SystemStatus>(`/system/${systemId}/status`);
  }

  /**
   * Get comprehensive maintenance insights with advanced analytics
   */
  async getMaintenanceInsights(systemId: number): Promise<MaintenanceInsights> {
    return this.makeRequest<MaintenanceInsights>(`/system/${systemId}/insights`);
  }

  /**
   * Get predictive maintenance recommendations with ML-based forecasting
   */
  async getPredictiveMaintenance(
    systemId: number, 
    predictionHorizonDays: number = 90
  ): Promise<PredictiveMaintenance> {
    return this.makeRequest<PredictiveMaintenance>(
      `/system/${systemId}/predictive-maintenance?prediction_horizon_days=${predictionHorizonDays}`
    );
  }

  /**
   * Get fleet-wide maintenance analytics and insights
   */
  async getFleetOverview(): Promise<FleetOverview> {
    return this.makeRequest<FleetOverview>('/analytics/fleet-overview');
  }

  /**
   * Get maintenance cost optimization analysis and recommendations
   */
  async getCostOptimizationAnalysis(): Promise<CostOptimizationAnalysis> {
    return this.makeRequest<CostOptimizationAnalysis>('/analytics/cost-optimization');
  }

  /**
   * Compare system performance against fleet benchmarks
   */
  async compareSystemToFleet(systemId: number): Promise<{
    system_metrics: SystemMetrics;
    fleet_benchmarks: {
      average_efficiency: number;
      average_availability: number;
      average_health_score: number;
      average_maintenance_cost: number;
    };
    performance_ranking: {
      efficiency_percentile: number;
      availability_percentile: number;
      cost_efficiency_percentile: number;
      overall_ranking: number;
    };
    improvement_opportunities: string[];
  }> {
    // This would be implemented as a separate endpoint
    // For now, combining existing calls
    const [systemMetrics, fleetOverview] = await Promise.all([
      this.getSystemMetrics(systemId),
      this.getFleetOverview()
    ]);

    return {
      system_metrics: systemMetrics,
      fleet_benchmarks: {
        average_efficiency: fleetOverview.fleet_overview.fleet_metrics.average_health_score,
        average_availability: fleetOverview.fleet_overview.fleet_metrics.average_availability,
        average_health_score: fleetOverview.fleet_overview.fleet_metrics.average_health_score,
        average_maintenance_cost: fleetOverview.fleet_overview.fleet_metrics.total_maintenance_cost / 
                                  Math.max(1, fleetOverview.fleet_overview.total_systems)
      },
      performance_ranking: {
        efficiency_percentile: Math.min(100, systemMetrics.efficiency * 1.2),
        availability_percentile: Math.min(100, systemMetrics.system_availability * 1.1),
        cost_efficiency_percentile: 75, // Placeholder
        overall_ranking: Math.floor(Math.random() * 100) + 1 // Placeholder
      },
      improvement_opportunities: [
        'Optimize maintenance scheduling',
        'Implement predictive maintenance',
        'Review maintenance procedures'
      ]
    };
  }

  /**
   * Get maintenance analytics dashboard data
   */
  async getDashboardData(systemId: number): Promise<{
    metrics: SystemMetrics;
    status: SystemStatus;
    insights: MaintenanceInsights;
    predictive: PredictiveMaintenance;
  }> {
    const [metrics, status, insights, predictive] = await Promise.all([
      this.getSystemMetrics(systemId),
      this.getSystemStatus(systemId),
      this.getMaintenanceInsights(systemId),
      this.getPredictiveMaintenance(systemId)
    ]);

    return {
      metrics,
      status,
      insights,
      predictive
    };
  }

  /**
   * Generate maintenance report for system
   */
  async generateMaintenanceReport(systemId: number): Promise<{
    report_id: string;
    system_id: number;
    generated_date: string;
    summary: {
      health_score: number;
      risk_level: string;
      maintenance_cost: number;
      recommendations_count: number;
    };
    sections: {
      performance_analysis: SystemMetrics;
      status_assessment: SystemStatus;
      predictive_insights: PredictiveMaintenance;
      cost_analysis: any;
    };
    export_formats: string[];
  }> {
    const dashboardData = await this.getDashboardData(systemId);
    
    return {
      report_id: `MAINT_${systemId}_${Date.now()}`,
      system_id: systemId,
      generated_date: new Date().toISOString(),
      summary: {
        health_score: dashboardData.status.health_score,
        risk_level: dashboardData.status.risk_level,
        maintenance_cost: dashboardData.metrics.maintenance_costs.total,
        recommendations_count: dashboardData.status.maintenance_recommendations.length
      },
      sections: {
        performance_analysis: dashboardData.metrics,
        status_assessment: dashboardData.status,
        predictive_insights: dashboardData.predictive,
        cost_analysis: dashboardData.insights.cost_analysis
      },
      export_formats: ['PDF', 'Excel', 'CSV']
    };
  }

  /**
   * Health check for the maintenance analytics service
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    version: string;
    features: string[];
  }> {
    return this.makeRequest<{
      status: string;
      service: string;
      version: string;
      features: string[];
    }>('/health');
  }
}

// Export singleton instance
export const pythonMaintenanceService = new PythonMaintenanceService();
export default pythonMaintenanceService;
