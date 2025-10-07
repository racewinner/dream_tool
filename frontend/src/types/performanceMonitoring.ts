export interface SystemPerformanceMetrics {
  energyGeneration: {
    current: number;
    daily: number[];
    monthly: number[];
    yearly: number[];
    deviation: number;
    performanceRatio: number;
    capacityFactor: number;
  };
  systemHealth: {
    temperature: number;
    voltage: number;
    current: number;
    frequency: number;
    powerFactor: number;
  };
  maintenanceMetrics: {
    uptime: number;
    downtime: number;
    availability: number;
    meanTimeBetweenFailures: number;
    meanTimeToRepair: number;
  };
  financialMetrics: {
    maintenanceCost: number;
    energyCost: number;
    revenue: number;
    roi: number;
    paybackPeriod: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'PERFORMANCE' | 'HEALTH' | 'MAINTENANCE' | 'FINANCIAL';
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'IGNORED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PerformanceTrend {
  metric: string;
  values: number[];
  timestamps: Date[];
  trend: 'UP' | 'DOWN' | 'STABLE';
  correlation: number;
  confidence: number;
}

export interface MaintenanceImpact {
  system: {
    availability: number;
    performance: number;
    energyLoss: number;
  };
  financial: {
    cost: number;
    revenueImpact: number;
    roiImpact: number;
  };
}

export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: {
    performance: number;
    financial: number;
    maintenance: number;
  };
  implementationCost: number;
  paybackPeriod: number;
  status: 'SUGGESTED' | 'APPROVED' | 'IMPLEMENTED' | 'REJECTED';
}
