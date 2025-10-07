/**
 * Demand Data Service
 * Centralized TypeScript client for accessing energy demand data across all DREAM Tool components
 */

import { API_CONFIG } from '../config/api';

// Core interfaces for demand data requests and responses
export interface DemandDataRequest {
  facility_id: number;
  scenario_types: string[];
  data_format?: string;
  day_night_share?: DayNightShareParams;
  future_parameters?: FutureGrowthParams;
  include_metadata?: boolean;
}

export interface DayNightShareParams {
  day_share_percent: number;
  night_share_percent: number;
  transition_hours?: number;
}

export interface FutureGrowthParams {
  selected_equipment_ids: string[];
  growth_factor: number;
  timeline_years?: number;
}

export interface DemandDataResponse {
  facility_id: number;
  scenario_data: {
    [scenarioType: string]: ScenarioData;
  };
  metadata?: DemandMetadata;
  generation_timestamp: string;
  data_format: string;
}

export interface ScenarioData {
  scenario_type: string;
  name: string;
  description: string;
  annual_kwh: number;
  peak_demand_kw: number;
  load_factor: number;
  equipment_breakdown: EquipmentBreakdown;
  cost_implications: CostImplications;
  hourly_profile?: number[];
  daily_profile?: number[];
  monthly_totals?: number[];
}

export interface EquipmentBreakdown {
  [equipmentName: string]: {
    annual_kwh: number;
    peak_kw: number;
    percentage_of_total: number;
  };
}

export interface CostImplications {
  estimated_annual_cost: number;
  peak_demand_charges: number;
  energy_charges: number;
  total_annual_cost: number;
}

export interface DemandMetadata {
  available_scenarios: string[];
  requested_scenarios: string[];
  total_scenarios_available: number;
  scenarios_returned: number;
  generation_method: string;
  data_quality: string;
  assumptions: {
    day_hours: string;
    night_hours: string;
    seasonal_variation: string;
    weather_adjustment: string;
  };
}

// Specialized request/response interfaces for different services
export interface REoptDataRequest {
  facility_id: number;
  scenario_type: string;
  day_night_share?: DayNightShareParams;
  future_parameters?: FutureGrowthParams;
}

export interface REoptDataResponse {
  loads_kw: number[];
  annual_kwh: number;
  peak_kw: number;
  load_factor: number;
  facility_id: number;
  scenario_type: string;
  data_source: string;
}

export interface MCDADataRequest {
  facility_ids: number[];
  scenario_type?: string;
  day_night_share?: DayNightShareParams;
  future_parameters?: FutureGrowthParams;
}

export interface MCDADataResponse {
  [facilityId: number]: {
    annual_energy_demand_kwh: number;
    peak_demand_kw: number;
    load_factor: number;
    estimated_annual_cost: number;
  } | null;
}

export interface EnergyAnalysisDataRequest {
  facility_id: number;
  scenario_types: string[];
  day_night_share?: DayNightShareParams;
  future_parameters?: FutureGrowthParams;
}

export interface EnergyAnalysisDataResponse {
  facility_id: number;
  scenarios: {
    [scenarioType: string]: {
      hourly_loads_kw: number[];
      annual_energy_kwh: number;
      peak_demand_kw: number;
      load_factor: number;
      equipment_breakdown: EquipmentBreakdown;
      monthly_totals: number[];
    };
  };
  comparison_metrics?: {
    annual_energy_range: {
      min: number;
      max: number;
      ratio: number;
    };
    peak_demand_range: {
      min: number;
      max: number;
      ratio: number;
    };
  };
  metadata: DemandMetadata;
}

// Available data formats enum
export enum DemandDataFormat {
  HOURLY_PROFILE = 'hourly_profile',
  DAILY_PROFILE = 'daily_profile',
  MONTHLY_TOTALS = 'monthly_totals',
  ANNUAL_TOTAL = 'annual_total',
  PEAK_DEMAND = 'peak_demand',
  LOAD_FACTOR = 'load_factor',
  EQUIPMENT_BREAKDOWN = 'equipment_breakdown',
  COST_ANALYSIS = 'cost_analysis'
}

// Available scenario types
export enum DemandScenarioType {
  CURRENT_ALL = 'current_all',
  CURRENT_CRITICAL = 'current_critical',
  CURRENT_ALL_DAY_NIGHT = 'current_all_day_night',
  CURRENT_CRITICAL_DAY_NIGHT = 'current_critical_day_night',
  FUTURE_ALL = 'future_all',
  FUTURE_CRITICAL = 'future_critical',
  FUTURE_ALL_DAY_NIGHT = 'future_all_day_night',
  FUTURE_CRITICAL_DAY_NIGHT = 'future_critical_day_night'
}

class DemandDataService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/demand-data`;
    this.cache = new Map();
  }

  /**
   * Get demand data for specified scenarios in requested format
   * Primary method for accessing energy demand data
   */
  async getDemandData(request: DemandDataRequest): Promise<DemandDataResponse> {
    try {
      const cacheKey = this.generateCacheKey('demand-data', request);
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<{ success: boolean; data: DemandDataResponse }>(
        '/get-demand-data',
        'POST',
        {
          facility_id: request.facility_id,
          scenario_types: request.scenario_types,
          data_format: request.data_format || DemandDataFormat.HOURLY_PROFILE,
          day_night_share: request.day_night_share,
          future_parameters: request.future_parameters,
          include_metadata: request.include_metadata !== false
        }
      );

      if (response.success) {
        this.setCachedData(cacheKey, response.data);
        return response.data;
      } else {
        throw new Error('Failed to get demand data');
      }
    } catch (error) {
      console.error('Error getting demand data:', error);
      throw error;
    }
  }

  /**
   * Get demand data formatted specifically for REopt optimization
   */
  async getREoptData(request: REoptDataRequest): Promise<REoptDataResponse> {
    try {
      const cacheKey = this.generateCacheKey('reopt-data', request);
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<{ success: boolean; reopt_data: REoptDataResponse }>(
        '/reopt-data',
        'POST',
        request
      );

      if (response.success) {
        this.setCachedData(cacheKey, response.reopt_data);
        return response.reopt_data;
      } else {
        throw new Error('Failed to get REopt data');
      }
    } catch (error) {
      console.error('Error getting REopt data:', error);
      throw error;
    }
  }

  /**
   * Get demand data formatted for MCDA analysis
   */
  async getMCDAData(request: MCDADataRequest): Promise<MCDADataResponse> {
    try {
      const cacheKey = this.generateCacheKey('mcda-data', request);
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<{ success: boolean; mcda_data: MCDADataResponse }>(
        '/mcda-data',
        'POST',
        {
          facility_ids: request.facility_ids,
          scenario_type: request.scenario_type || DemandScenarioType.CURRENT_ALL,
          day_night_share: request.day_night_share,
          future_parameters: request.future_parameters
        }
      );

      if (response.success) {
        this.setCachedData(cacheKey, response.mcda_data);
        return response.mcda_data;
      } else {
        throw new Error('Failed to get MCDA data');
      }
    } catch (error) {
      console.error('Error getting MCDA data:', error);
      throw error;
    }
  }

  /**
   * Get demand data formatted for energy analysis services
   */
  async getEnergyAnalysisData(request: EnergyAnalysisDataRequest): Promise<EnergyAnalysisDataResponse> {
    try {
      const cacheKey = this.generateCacheKey('energy-analysis-data', request);
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<{ success: boolean; analysis_data: EnergyAnalysisDataResponse }>(
        '/energy-analysis-data',
        'POST',
        request
      );

      if (response.success) {
        this.setCachedData(cacheKey, response.analysis_data);
        return response.analysis_data;
      } else {
        throw new Error('Failed to get energy analysis data');
      }
    } catch (error) {
      console.error('Error getting energy analysis data:', error);
      throw error;
    }
  }

  /**
   * Get information about available demand scenarios
   */
  async getAvailableScenarios(): Promise<{
    scenarios: { [key: string]: any };
    total_scenarios: number;
    categories: string[];
    equipment_types: string[];
    data_formats: string[];
    usage_notes: string[];
  }> {
    try {
      const cacheKey = 'available-scenarios';
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<any>('/available-scenarios');
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error getting available scenarios:', error);
      throw error;
    }
  }

  /**
   * Get information about available data formats
   */
  async getDataFormats(): Promise<{
    formats: { [key: string]: any };
    total_formats: number;
    recommendations: { [key: string]: string };
  }> {
    try {
      const cacheKey = 'data-formats';
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<any>('/data-formats');
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error getting data formats:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics for all scenarios of a facility
   */
  async getScenarioSummary(facilityId: number): Promise<{
    facility_id: number;
    summary: {
      total_scenarios: number;
      current_scenarios: number;
      future_scenarios: number;
      day_night_scenarios: number;
      critical_scenarios: number;
      demand_range: {
        min_annual_kwh: number;
        max_annual_kwh: number;
        min_peak_kw: number;
        max_peak_kw: number;
      };
      load_factor_range: {
        min: number;
        max: number;
        average: number;
      };
    };
    generation_timestamp: string;
  }> {
    try {
      const cacheKey = `scenario-summary-${facilityId}`;
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<any>(`/scenario-summary/${facilityId}`);
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error getting scenario summary:', error);
      throw error;
    }
  }

  /**
   * Clear the demand scenario cache
   */
  async clearCache(): Promise<void> {
    try {
      this.cache.clear();
      await this.makeRequest<any>('/clear-cache', 'DELETE');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Health check for demand data service
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    version: string;
    features: string[];
    cache_status: {
      cached_scenarios: number;
      cache_timeout_seconds: number;
    };
  }> {
    try {
      return await this.makeRequest<any>('/health');
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  // Utility methods for common use cases

  /**
   * Get current demand data for dashboard display
   */
  async getCurrentDemandForDashboard(facilityId: number): Promise<ScenarioData> {
    const response = await this.getDemandData({
      facility_id: facilityId,
      scenario_types: [DemandScenarioType.CURRENT_ALL],
      data_format: DemandDataFormat.DAILY_PROFILE
    });

    return response.scenario_data[DemandScenarioType.CURRENT_ALL];
  }

  /**
   * Get all current scenarios for comparison
   */
  async getAllCurrentScenarios(
    facilityId: number,
    dayNightShare?: DayNightShareParams
  ): Promise<{ [key: string]: ScenarioData }> {
    const response = await this.getDemandData({
      facility_id: facilityId,
      scenario_types: [
        DemandScenarioType.CURRENT_ALL,
        DemandScenarioType.CURRENT_CRITICAL,
        DemandScenarioType.CURRENT_ALL_DAY_NIGHT,
        DemandScenarioType.CURRENT_CRITICAL_DAY_NIGHT
      ],
      data_format: DemandDataFormat.HOURLY_PROFILE,
      day_night_share: dayNightShare
    });

    return response.scenario_data;
  }

  /**
   * Get all future scenarios for planning
   */
  async getAllFutureScenarios(
    facilityId: number,
    futureParameters: FutureGrowthParams,
    dayNightShare?: DayNightShareParams
  ): Promise<{ [key: string]: ScenarioData }> {
    const response = await this.getDemandData({
      facility_id: facilityId,
      scenario_types: [
        DemandScenarioType.FUTURE_ALL,
        DemandScenarioType.FUTURE_CRITICAL,
        DemandScenarioType.FUTURE_ALL_DAY_NIGHT,
        DemandScenarioType.FUTURE_CRITICAL_DAY_NIGHT
      ],
      data_format: DemandDataFormat.HOURLY_PROFILE,
      future_parameters: futureParameters,
      day_night_share: dayNightShare
    });

    return response.scenario_data;
  }

  /**
   * Compare current vs future scenarios
   */
  async compareCurrentVsFuture(
    facilityId: number,
    futureParameters: FutureGrowthParams,
    dayNightShare?: DayNightShareParams
  ): Promise<{
    current: { [key: string]: ScenarioData };
    future: { [key: string]: ScenarioData };
    comparison: {
      growth_factors: { [key: string]: number };
      additional_demand: { [key: string]: number };
    };
  }> {
    const [currentScenarios, futureScenarios] = await Promise.all([
      this.getAllCurrentScenarios(facilityId, dayNightShare),
      this.getAllFutureScenarios(facilityId, futureParameters, dayNightShare)
    ]);

    // Calculate comparison metrics
    const comparison = {
      growth_factors: {} as { [key: string]: number },
      additional_demand: {} as { [key: string]: number }
    };

    const scenarioMappings = {
      [DemandScenarioType.CURRENT_ALL]: DemandScenarioType.FUTURE_ALL,
      [DemandScenarioType.CURRENT_CRITICAL]: DemandScenarioType.FUTURE_CRITICAL,
      [DemandScenarioType.CURRENT_ALL_DAY_NIGHT]: DemandScenarioType.FUTURE_ALL_DAY_NIGHT,
      [DemandScenarioType.CURRENT_CRITICAL_DAY_NIGHT]: DemandScenarioType.FUTURE_CRITICAL_DAY_NIGHT
    };

    Object.entries(scenarioMappings).forEach(([currentKey, futureKey]) => {
      const currentData = currentScenarios[currentKey];
      const futureData = futureScenarios[futureKey];

      if (currentData && futureData) {
        comparison.growth_factors[currentKey] = futureData.annual_kwh / currentData.annual_kwh;
        comparison.additional_demand[currentKey] = futureData.annual_kwh - currentData.annual_kwh;
      }
    });

    return {
      current: currentScenarios,
      future: futureScenarios,
      comparison
    };
  }

  // Private utility methods

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  private generateCacheKey(prefix: string, data: any): string {
    const dataString = JSON.stringify(data);
    return `${prefix}-${btoa(dataString).slice(0, 20)}`;
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Validate day/night shares
   */
  validateDayNightShares(shares: DayNightShareParams): string[] {
    const errors: string[] = [];
    
    if (shares.day_share_percent < 0 || shares.day_share_percent > 100) {
      errors.push('Day share must be between 0% and 100%');
    }
    
    if (shares.night_share_percent < 0 || shares.night_share_percent > 100) {
      errors.push('Night share must be between 0% and 100%');
    }
    
    const total = shares.day_share_percent + shares.night_share_percent;
    if (Math.abs(total - 100) > 0.1) {
      errors.push(`Day and night shares must add up to 100%, got ${total.toFixed(1)}%`);
    }
    
    if (shares.transition_hours && (shares.transition_hours < 0 || shares.transition_hours > 4)) {
      errors.push('Transition hours must be between 0 and 4');
    }
    
    return errors;
  }

  /**
   * Validate future growth parameters
   */
  validateFutureGrowth(growth: FutureGrowthParams): string[] {
    const errors: string[] = [];
    
    if (growth.growth_factor < 0.5 || growth.growth_factor > 5.0) {
      errors.push('Growth factor must be between 0.5 and 5.0');
    }
    
    if (growth.timeline_years && (growth.timeline_years < 1 || growth.timeline_years > 20)) {
      errors.push('Timeline must be between 1 and 20 years');
    }
    
    if (!growth.selected_equipment_ids || growth.selected_equipment_ids.length === 0) {
      errors.push('At least one equipment must be selected for future scenarios');
    }
    
    return errors;
  }
}

// Export singleton instance
export const demandDataService = new DemandDataService();

// Export all types and enums
export {
  DemandDataService,
  DemandDataFormat,
  DemandScenarioType
};
