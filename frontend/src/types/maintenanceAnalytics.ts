export interface PredictiveMaintenanceMetrics {
  failureProbability: number;
  remainingUsefulLife: number;
  confidenceLevel: number;
  recommendedAction: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predictedFailureDate: Date;
}

export interface CostBenefitAnalysis {
  maintenanceCost: number;
  avoidedDowntimeCost: number;
  energyLossCost: number;
  roi: number;
  paybackPeriod: number;
  netPresentValue: number;
  internalRateOfReturn: number;
}

export interface EnergyPerformanceMetrics {
  actualGeneration: number;
  predictedGeneration: number;
  deviation: number;
  performanceRatio: number;
  capacityFactor: number;
  degradationRate: number;
  yieldLoss: number;
}

export interface MaintenanceTrendAnalysis {
  costTrend: {
    monthly: number[];
    yearly: number[];
    trend: 'INCREASE' | 'DECREASE' | 'STABLE';
    correlation: number;
  };
  downtimeTrend: {
    monthly: number[];
    yearly: number[];
    trend: 'INCREASE' | 'DECREASE' | 'STABLE';
    correlation: number;
  };
  performanceImpact: {
    correlation: number;
    impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    keyFactors: string[];
  };
}

export interface MaintenanceAnalyticsData {
  predictiveMetrics: PredictiveMaintenanceMetrics;
  costBenefit: CostBenefitAnalysis;
  energyPerformance: EnergyPerformanceMetrics;
  trendAnalysis: MaintenanceTrendAnalysis;
  historicalData: {
    maintenanceCosts: number[];
    downtimeHours: number[];
    systemAvailability: number[];
    energyGeneration: number[];
  };
  correlationMatrix: {
    maintenanceCost: {
      withDowntime: number;
      withPerformance: number;
      withEnergyLoss: number;
    };
    downtime: {
      withPerformance: number;
      withEnergyLoss: number;
    };
  };
  optimizationRecommendations: string[];
  riskAssessment: {
    currentRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  maintenanceSchedule: {
    upcoming: {
      date: Date;
      type: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      estimatedCost: number;
      estimatedDowntime: number;
    }[];
    completed: {
      date: Date;
      type: string;
      actualCost: number;
      actualDowntime: number;
      effectiveness: number;
    }[];
  };
}
