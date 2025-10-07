export interface Equipment {
  id: string;
  name: string;
  category: 'medical' | 'lighting' | 'cooling' | 'computing' | 'kitchen' | 'other';
  powerRating: number; // Watts
  hoursPerDay: number;
  efficiency: number; // 0-1
  priority: 'essential' | 'important' | 'optional';
  facilityTypes: string[];
  description: string;
  unitCost?: number;
  quantity: number;
  customHours?: number;
  customPower?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface LoadProfile {
  hour: number;
  demand: number; // kW
  equipmentBreakdown: { [key: string]: number };
  temperature?: number; // °C
  solarIrradiance?: number; // W/m²
}

export interface EnergyDemand {
  peakDemand: number; // kW
  dailyConsumption: number; // kWh
  annualConsumption: number; // kWh
  loadFactor: number; // Average load / Peak load
  diversityFactor: number; // Sum of individual peaks / System peak
}

export interface FacilityData {
  name: string;
  facilityType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  equipment: Equipment[];
  operationalHours: number;
  staffCount: number;
  buildingArea?: number; // m²
  patientCapacity?: number;
  servicesProvided?: string[];
}

export interface EnergyScenario {
  id: string;
  name: string;
  type: 'current' | 'ideal' | 'optimized';
  facilityId?: number;
  facilityData: FacilityData;
  loadProfile: LoadProfile[];
  energyDemand: EnergyDemand;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SystemSizing {
  pvSystemSize: number; // kW
  batteryCapacity: number; // kWh
  inverterSize: number; // kW
  generatorSize?: number; // kW
  safetyMargin: number;
  systemEfficiency: number;
}

export interface EnergyAnalysis {
  scenario: EnergyScenario;
  systemSizing: SystemSizing;
  costAnalysis?: any; // Reference to techno-economic analysis
  recommendations: string[];
  carbonFootprint: {
    current: number; // kg CO2/year
    withPV: number; // kg CO2/year
    reduction: number; // kg CO2/year
  };
}

export interface EquipmentDatabase {
  id: string;
  name: string;
  category: Equipment['category'];
  manufacturer?: string;
  model?: string;
  powerRating: {
    min: number;
    max: number;
    typical: number;
  };
  efficiency: {
    min: number;
    max: number;
    typical: number;
  };
  operatingHours: {
    min: number;
    max: number;
    typical: number;
  };
  cost: {
    min: number;
    max: number;
    typical: number;
  };
  lifespan: number; // years
  maintenanceSchedule: string;
  energyStarRating?: number;
  certifications?: string[];
  facilityTypes: string[];
  isObsolete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoadPatternTemplate {
  id: string;
  name: string;
  facilityType: string;
  description: string;
  hourlyPattern: number[]; // 24 values, 0-1 load factors
  seasonalFactors: {
    winter: number;
    spring: number;
    summer: number;
    fall: number;
  };
  weekdayPattern: number[]; // 7 values for days of week
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface EnergyBenchmark {
  facilityType: string;
  region: string;
  energyIntensity: {
    perArea: number; // kWh/m²/year
    perBed: number; // kWh/bed/year
    perPatient: number; // kWh/patient/year
  };
  loadProfile: {
    peakHour: number;
    baseLoad: number; // % of peak
    loadFactor: number;
  };
  equipmentMix: { [category: string]: number }; // % of total load
  source: string;
  year: number;
  sampleSize: number;
}

// Request/Response interfaces for API
export interface LoadProfileRequest {
  equipment: Equipment[];
  facilityData?: Partial<FacilityData>;
  options?: {
    includeSeasonalVariation?: boolean;
    safetyMargin?: number;
    systemEfficiency?: number;
  };
}

export interface LoadProfileResponse {
  loadProfile: LoadProfile[];
  peakDemand: number;
  dailyConsumption: number;
  annualConsumption: number;
  metadata: {
    calculatedAt: Date;
    options: any;
    version: string;
  };
}

export interface EnergyAnalysisRequest {
  facilityData: FacilityData;
  scenarioType?: 'current' | 'ideal' | 'optimized';
  options?: {
    includeSystemSizing?: boolean;
    includeCostAnalysis?: boolean;
    includeRecommendations?: boolean;
  };
}

export interface EnergyAnalysisResponse {
  analysis: EnergyAnalysis;
  systemSizing?: SystemSizing;
  recommendations: string[];
  benchmarkComparison?: {
    facilityType: string;
    energyIntensity: number;
    percentile: number; // Where this facility ranks
  };
}

export default {
  Equipment,
  LoadProfile,
  EnergyDemand,
  FacilityData,
  EnergyScenario,
  SystemSizing,
  EnergyAnalysis
};
