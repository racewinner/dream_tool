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

export interface SolarSystemAttributes {
  id: number;
  facilityId: number;
  systemType: 'PV' | 'HYBRID' | 'STANDALONE';
  capacityKw: number;
  installationDate: Date;
  commissioningDate: Date;
  manufacturer: string;
  model: string;
  serialNumber: string;
  warrantyPeriod: number;
  maintenanceSchedule: string;
  maintenanceFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  lastMaintenanceDate: Date;
  nextMaintenanceDate: Date;
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
  grantExpiryDate: Date;
  installationCost: number;
  maintenanceCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceRecordRequest {
  solarSystemId: number;
  maintenanceType: 'ROUTINE' | 'CORRECTIVE' | 'PREVENTIVE' | 'EMERGENCY' | 'SEASONAL' | 'ANNUAL' | 'INSPECTION' | 'REPAIR' | 'REPLACEMENT' | 'UPGRADE';
  maintenanceDate?: string;
  maintenanceDescription: string;
  maintenanceCost: number;
  partsReplaced: string[];
  laborHours: number;
  nextMaintenanceDate?: string;
  maintenanceReport?: string;
  attachments?: string[];
  preventiveTasks?: string[];
  correctiveActions?: string[];
  systemImpact?: 'MINOR' | 'MODERATE' | 'SEVERE';
  downtimeHours?: number;
  preventiveMaintenance?: boolean;
}

export interface MaintenanceRecordAttributes {
  id: number;
  solarSystemId: number;
  userId: number;
  maintenanceDate: Date;
  maintenanceType: 'ROUTINE' | 'CORRECTIVE' | 'PREVENTIVE' | 'EMERGENCY' | 'SEASONAL' | 'ANNUAL' | 'INSPECTION' | 'REPAIR' | 'REPLACEMENT' | 'UPGRADE';
  maintenanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  maintenanceDescription: string;
  maintenanceCost: number;
  partsReplaced: string[];
  laborHours: number;
  nextMaintenanceDate: Date;
  maintenanceReport: string;
  attachments: string[];
  preventiveTasks: string[];
  correctiveActions: string[];
  systemImpact: 'MINOR' | 'MODERATE' | 'SEVERE';
  downtimeHours: number;
  preventiveMaintenance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemPerformanceMetrics {
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
}

export interface MaintenanceSchedule {
  nextMaintenance: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  lastMaintenance: string;
  overdue: boolean;
  upcoming: boolean;
}

export interface SystemStatus {
  operational: boolean;
  maintenanceRequired: boolean;
  performance: number;
  alerts: string[];
  maintenanceSchedule: MaintenanceSchedule;
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
