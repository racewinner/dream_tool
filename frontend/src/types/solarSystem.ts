export interface SolarSystemRequest {
  facilityId: number;
  systemType: 'PV' | 'HYBRID' | 'STANDALONE';
  capacityKw: number;
  installationDate: string;
  commissioningDate: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  warrantyPeriod: number;
  maintenanceSchedule: string;
  maintenanceFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  fundingSource: string;
  grantAmount: number;
  grantExpiryDate: string;
  installationCost: number;
  maintenanceCost: number;
}

export interface SolarSystemResponse {
  id: number;
  facilityId: number;
  systemType: 'PV' | 'HYBRID' | 'STANDALONE';
  capacityKw: number;
  installationDate: string;
  commissioningDate: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  warrantyPeriod: number;
  maintenanceSchedule: string;
  maintenanceFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  performanceMetrics: {
    dailyGeneration: number;
    monthlyGeneration: number;
    yearlyGeneration: number;
    efficiency: number;
    maintenanceCosts: {
      total: number;
      averagePerKw: number;
      trend: 'INCREASE' | 'DECREASE' | 'STABLE';
    };
    operationalHours: number;
    downtime: {
      totalHours: number;
      percentage: number;
      frequency: number;
    };
    energyLoss: {
      totalKwh: number;
      percentage: number;
      causes: string[];
    };
    systemAvailability: number;
    performanceRatio: number;
    capacityFactor: number;
  };
  fundingSource: string;
  grantAmount: number;
  grantExpiryDate: string;
  installationCost: number;
  maintenanceCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecordRequest {
  solarSystemId: number;
  maintenanceType: 'ROUTINE' | 'CORRECTIVE' | 'PREVENTIVE' | 'EMERGENCY' | 'SEASONAL' | 'ANNUAL';
  maintenanceDescription: string;
  maintenanceCost: number;
  partsReplaced: string[];
  laborHours: number;
  nextMaintenanceDate: string;
  maintenanceReport: string;
  attachments: string[];
  preventiveTasks: string[];
  correctiveActions: string[];
  systemImpact: 'MINOR' | 'MODERATE' | 'SEVERE';
  downtimeHours: number;
  preventiveMaintenance: boolean;
}

export interface MaintenanceRecord {
  id: number;
  solarSystemId: number;
  maintenanceDate: string;
  maintenanceType: 'ROUTINE' | 'CORRECTIVE' | 'PREVENTIVE' | 'EMERGENCY' | 'SEASONAL' | 'ANNUAL';
  maintenanceDescription: string;
  maintenanceCost: number;
  partsReplaced: string[];
  laborHours: number;
  nextMaintenanceDate: string;
  maintenanceReport: string;
  attachments: string[];
  preventiveTasks: string[];
  correctiveActions: string[];
  systemImpact: 'MINOR' | 'MODERATE' | 'SEVERE';
  downtimeHours: number;
  preventiveMaintenance: boolean;
  maintenanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface SystemStatus {
  operational: boolean;
  maintenanceRequired: boolean;
  performance: number;
  alerts: string[];
  maintenanceSchedule: {
    nextMaintenance: string;
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    lastMaintenance: string;
    overdue: boolean;
    upcoming: boolean;
  };
  healthScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  upcomingMaintenance: {
    count: number;
    nextDate: string;
    types: string[];
  };
  systemMetrics: {
    efficiency: number;
    availability: number;
    reliability: number;
    performance: number;
  };
  recentIssues: {
    count: number;
    severity: 'LOW' | 'MODERATE' | 'HIGH';
    types: string[];
  };
}

export interface MaintenanceAnalyticsResponse {
  totalCost: number;
  averageMonthlyCost: number;
  totalDowntime: number;
  systemAvailability: number;
  monthlyMaintenanceCosts: number[];
  monthlyDowntime: number[];
}
