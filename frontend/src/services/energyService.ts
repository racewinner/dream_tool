import { API_CONFIG } from '../config/api';

// Frontend interfaces that match backend types
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

export interface EnergyAnalysisResult {
  loadProfile: LoadProfile[];
  peakDemand: number; // kW
  dailyConsumption: number; // kWh
  annualConsumption: number; // kWh
  criticalLoad: number; // kW
  nonCriticalLoad: number; // kW
  equipmentBreakdown: { [category: string]: number };
  recommendations: string[];
}

export interface SystemSizing {
  pvSystemSize: number; // kW
  batteryCapacity: number; // kWh
  inverterSize: number; // kW
  generatorSize?: number; // kW
  safetyMargin: number;
  systemEfficiency: number;
}

export interface EnergyScenario {
  id: string;
  name: string;
  type: 'current' | 'ideal' | 'optimized';
  facilityId?: number;
  facilityData: FacilityData;
  loadProfile: LoadProfile[];
  energyDemand: {
    peakDemand: number;
    dailyConsumption: number;
    annualConsumption: number;
    loadFactor: number;
    diversityFactor: number;
  };
  createdAt: Date;
}

// API Request/Response interfaces
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
  analysis: {
    scenario: EnergyScenario;
    systemSizing: SystemSizing;
    recommendations: string[];
    carbonFootprint: {
      current: number;
      withPV: number;
      reduction: number;
    };
  };
  systemSizing?: SystemSizing;
  recommendations: string[];
}

/**
 * Frontend Energy Service - API Client Only
 * All business logic moved to backend EnergyModelingService
 */
export class EnergyService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data; // Handle both {data: ...} and direct response formats
  }

  /**
   * Generate load profile from equipment list
   * Replaces frontend generateLoadProfile logic
   */
  static async generateLoadProfile(request: LoadProfileRequest): Promise<LoadProfileResponse> {
    try {
      console.log('🔋 Requesting load profile generation from backend API...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/energy/load-profile`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await this.handleResponse<LoadProfileResponse>(response);
      
      console.log(`✅ Load profile generated: Peak ${result.peakDemand.toFixed(2)}kW, Daily ${result.dailyConsumption.toFixed(2)}kWh`);
      
      return result;
    } catch (error) {
      console.error('❌ Error generating load profile:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive energy demand analysis
   * Replaces frontend calculateEnergyDemand logic
   */
  static async performEnergyAnalysis(request: EnergyAnalysisRequest): Promise<EnergyAnalysisResponse> {
    try {
      console.log(`🏥 Requesting energy analysis for facility: ${request.facilityData.name}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/energy/demand-analysis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await this.handleResponse<EnergyAnalysisResponse>(response);
      
      console.log(`✅ Energy analysis completed for ${request.facilityData.name}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error performing energy analysis:', error);
      throw error;
    }
  }

  /**
   * Generate energy scenario from survey data
   * Replaces frontend generateCurrentScenarioFromSurvey logic
   */
  static async generateScenarioFromSurvey(surveyData: any): Promise<{
    scenario: EnergyScenario;
    analysis: EnergyAnalysisResult;
    recommendations: string[];
  }> {
    try {
      console.log(`📋 Generating energy scenario from survey data for: ${surveyData.facilityData?.name || 'Unknown'}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/energy/survey-scenario`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ surveyData })
      });

      const result = await this.handleResponse<{
        scenario: EnergyScenario;
        analysis: EnergyAnalysisResult;
        recommendations: string[];
      }>(response);
      
      console.log(`✅ Survey scenario generated: Peak ${result.analysis.peakDemand.toFixed(2)}kW`);
      
      return result;
    } catch (error) {
      console.error('❌ Error generating survey scenario:', error);
      throw error;
    }
  }

  /**
   * Get equipment database for load profile generation
   */
  static async getEquipmentDatabase(filters?: {
    category?: string;
    facilityType?: string;
  }): Promise<{
    equipment: any[];
    totalCount: number;
    categories: string[];
    facilityTypes: string[];
  }> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.facilityType) params.append('facilityType', filters.facilityType);
      
      const queryString = params.toString();
      const url = `${API_CONFIG.BASE_URL}/api/energy/equipment-database${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<{
        equipment: any[];
        totalCount: number;
        categories: string[];
        facilityTypes: string[];
      }>(response);
      
      console.log(`📚 Retrieved ${result.totalCount} equipment items from database`);
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching equipment database:', error);
      throw error;
    }
  }

  /**
   * Get energy benchmarks for facility type
   */
  static async getEnergyBenchmarks(facilityType: string, region?: string): Promise<{
    facilityType: string;
    region: string;
    benchmark: any;
    source: string;
    lastUpdated: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (region) params.append('region', region);
      
      const queryString = params.toString();
      const url = `${API_CONFIG.BASE_URL}/api/energy/benchmarks/${facilityType}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<{
        facilityType: string;
        region: string;
        benchmark: any;
        source: string;
        lastUpdated: string;
      }>(response);
      
      console.log(`📈 Retrieved energy benchmarks for ${facilityType} in ${result.region}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error fetching energy benchmarks:', error);
      throw error;
    }
  }

  /**
   * Compare two energy scenarios
   * This can still be done on frontend since it's just data manipulation
   */
  static compareScenarios(currentScenario: EnergyScenario, idealScenario: EnergyScenario) {
    return {
      demandReduction: currentScenario.energyDemand.peakDemand - idealScenario.energyDemand.peakDemand,
      consumptionReduction: currentScenario.energyDemand.annualConsumption - idealScenario.energyDemand.annualConsumption,
      efficiencyImprovement: this.calculateEfficiencyImprovement(currentScenario, idealScenario),
      carbonReduction: (currentScenario.energyDemand.annualConsumption - idealScenario.energyDemand.annualConsumption) * 0.8,
      costSavings: this.estimateCostSavings(currentScenario, idealScenario)
    };
  }

  /**
   * Helper method for efficiency improvement calculation
   */
  private static calculateEfficiencyImprovement(current: EnergyScenario, ideal: EnergyScenario): number {
    const currentAvgEff = current.facilityData.equipment.reduce((sum, eq) => sum + eq.efficiency, 0) / current.facilityData.equipment.length;
    const idealAvgEff = ideal.facilityData.equipment.reduce((sum, eq) => sum + eq.efficiency, 0) / ideal.facilityData.equipment.length;
    return idealAvgEff - currentAvgEff;
  }

  /**
   * Helper method for cost savings estimation
   */
  private static estimateCostSavings(current: EnergyScenario, ideal: EnergyScenario): number {
    const energySavings = current.energyDemand.annualConsumption - ideal.energyDemand.annualConsumption;
    const costPerKwh = 0.15; // $0.15 per kWh assumption
    return energySavings * costPerKwh;
  }

  /**
   * Cache management for frequently used data
   */
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  static setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

export default EnergyService;
