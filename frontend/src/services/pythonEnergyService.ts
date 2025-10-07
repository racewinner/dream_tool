/**
 * Python Energy Service Integration
 * Connects frontend to Python microservices for advanced energy analysis
 */

import { API_CONFIG } from '../config/api';

// Python API Configuration
const PYTHON_API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000/api/python';

// Enhanced interfaces for Python services
export interface PythonEquipment {
  id: string;
  name: string;
  category: 'medical' | 'lighting' | 'cooling' | 'computing' | 'kitchen' | 'other';
  power_rating: number; // Watts
  hours_per_day: number;
  efficiency: number; // 0-1
  priority: 'essential' | 'important' | 'optional';
  quantity: number;
  condition?: string;
}

export interface PythonLoadProfilePoint {
  hour: number;
  demand: number; // kW
  equipment_breakdown: { [key: string]: number };
  temperature?: number; // °C
  solar_irradiance?: number; // W/m²
}

export interface PythonFacilityData {
  name: string;
  facility_type: string;
  location: {
    latitude: number;
    longitude: number;
  };
  equipment: PythonEquipment[];
  operational_hours: number;
  staff_count: number;
  building_area?: number;
  patient_capacity?: number;
}

export interface PythonEnergyAnalysisOptions {
  include_seasonal_variation?: boolean;
  safety_margin?: number;
  system_efficiency?: number;
  battery_autonomy?: number;
  ambient_temperature?: number;
}

export interface PythonWeatherData {
  solar_irradiance: number[]; // 24 hourly values
  temperature: number[]; // 24 hourly values
  wind_speed?: number[];
  humidity?: number[];
}

export interface PythonSystemSizing {
  pv_system_size: number; // kW
  battery_capacity: number; // kWh
  inverter_size: number; // kW
  generator_size?: number; // kW
  safety_margin: number;
  system_efficiency: number;
  panel_count: number;
  battery_bank_voltage: number;
  charge_controller_size: number;
}

export interface PythonEnergyAnalysisResult {
  load_profile: PythonLoadProfilePoint[];
  peak_demand: number;
  daily_consumption: number;
  annual_consumption: number;
  critical_load: number;
  non_critical_load: number;
  equipment_breakdown: { [category: string]: number };
  recommendations: string[];
  load_factor: number;
  diversity_factor: number;
  peak_hours: number[];
  base_load: number;
  load_variability: number;
}

export interface PythonEnergyScenario {
  id: string;
  name: string;
  scenario_type: 'current' | 'ideal' | 'optimized';
  facility_data: PythonFacilityData;
  analysis_result: PythonEnergyAnalysisResult;
  system_sizing: PythonSystemSizing;
  weather_data?: PythonWeatherData;
  created_at: string;
  economic_metrics?: { [key: string]: number };
  carbon_footprint?: { [key: string]: number };
}

// Request/Response interfaces
export interface PythonLoadProfileRequest {
  equipment: PythonEquipment[];
  facility_data?: PythonFacilityData;
  options?: PythonEnergyAnalysisOptions;
  weather_data?: PythonWeatherData;
}

export interface PythonLoadProfileResponse {
  load_profile: PythonLoadProfilePoint[];
  peak_demand: number;
  daily_consumption: number;
  annual_consumption: number;
  metadata: {
    generated_at: string;
    equipment_count: number;
    analysis_type: string;
    weather_corrected: boolean;
    options: PythonEnergyAnalysisOptions;
  };
}

export interface PythonEnergyAnalysisRequest {
  facility_data: PythonFacilityData;
  scenario_type?: 'current' | 'ideal' | 'optimized';
  options?: PythonEnergyAnalysisOptions;
  weather_data?: PythonWeatherData;
}

export interface PythonEnergyAnalysisResponse {
  scenario: PythonEnergyScenario;
  system_sizing: PythonSystemSizing;
  recommendations: string[];
  benchmark_comparison?: { [key: string]: number };
}

class PythonEnergyService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Generate advanced load profile using Python scientific computing
   */
  static async generateLoadProfile(request: PythonLoadProfileRequest): Promise<PythonLoadProfileResponse> {
    try {
      console.log('🐍 Requesting advanced load profile from Python services...');
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/energy/load-profile`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await this.handleResponse<PythonLoadProfileResponse>(response);
      
      console.log(`✅ Python load profile generated: ${result.peak_demand.toFixed(2)}kW peak, ${result.daily_consumption.toFixed(2)}kWh daily`);
      return result;

    } catch (error) {
      console.error('❌ Python load profile generation failed:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive energy analysis with advanced features
   */
  static async performComprehensiveAnalysis(request: PythonEnergyAnalysisRequest): Promise<PythonEnergyAnalysisResponse> {
    try {
      console.log('🐍 Requesting comprehensive analysis from Python services...');
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/energy/comprehensive-analysis`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request)
      });

      const result = await this.handleResponse<PythonEnergyAnalysisResponse>(response);
      
      console.log(`✅ Python comprehensive analysis completed for ${request.facility_data.name}`);
      return result;

    } catch (error) {
      console.error('❌ Python comprehensive analysis failed:', error);
      throw error;
    }
  }

  /**
   * Optimize system sizing using mathematical optimization
   */
  static async optimizeSystemSizing(
    facilityData: PythonFacilityData,
    targetReliability: number = 0.95,
    costPerKwPv: number = 1000,
    costPerKwhBattery: number = 500
  ): Promise<any> {
    try {
      console.log('🐍 Requesting system sizing optimization from Python services...');
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/energy/optimize-sizing`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          facility_data: facilityData,
          target_reliability: targetReliability,
          cost_per_kw_pv: costPerKwPv,
          cost_per_kwh_battery: costPerKwhBattery
        })
      });

      const result = await this.handleResponse<any>(response);
      
      console.log(`✅ Python system sizing optimized: ${result.system_sizing.pv_system_size.toFixed(2)}kW PV`);
      return result;

    } catch (error) {
      console.error('❌ Python system sizing optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get enhanced equipment database
   */
  static async getEquipmentDatabase(category?: string): Promise<any> {
    try {
      console.log('🐍 Fetching equipment database from Python services...');
      
      const url = category 
        ? `${PYTHON_API_BASE_URL}/energy/equipment-database?category=${category}`
        : `${PYTHON_API_BASE_URL}/energy/equipment-database`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<any>(response);
      
      console.log('✅ Python equipment database fetched');
      return result;

    } catch (error) {
      console.error('❌ Python equipment database fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get weather data for location
   */
  static async getWeatherData(latitude: number, longitude: number): Promise<any> {
    try {
      console.log(`🐍 Fetching weather data for ${latitude}, ${longitude} from Python services...`);
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/energy/weather-data/${latitude}/${longitude}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<any>(response);
      
      console.log('✅ Python weather data fetched');
      return result;

    } catch (error) {
      console.error('❌ Python weather data fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get energy benchmarks for facility type
   */
  static async getEnergyBenchmarks(facilityType: string): Promise<any> {
    try {
      console.log(`🐍 Fetching energy benchmarks for ${facilityType} from Python services...`);
      
      const response = await fetch(`${PYTHON_API_BASE_URL}/energy/benchmarks/${facilityType}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await this.handleResponse<any>(response);
      
      console.log('✅ Python energy benchmarks fetched');
      return result;

    } catch (error) {
      console.error('❌ Python energy benchmarks fetch failed:', error);
      throw error;
    }
  }

  /**
   * Convert TypeScript Equipment to Python Equipment format
   */
  static convertToPythonEquipment(equipment: any[]): PythonEquipment[] {
    return equipment.map(eq => ({
      id: eq.id || `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: eq.name,
      category: eq.category,
      power_rating: eq.powerRating || eq.power_rating,
      hours_per_day: eq.hoursPerDay || eq.hours_per_day,
      efficiency: eq.efficiency || 0.8,
      priority: eq.priority || 'important',
      quantity: eq.quantity || 1,
      condition: eq.condition || 'good'
    }));
  }

  /**
   * Convert TypeScript Facility to Python Facility format
   */
  static convertToPythonFacility(facility: any): PythonFacilityData {
    return {
      name: facility.name,
      facility_type: facility.facilityType || facility.facility_type || 'health_clinic',
      location: {
        latitude: facility.latitude || facility.location?.latitude || 2.0469,
        longitude: facility.longitude || facility.location?.longitude || 45.3182
      },
      equipment: this.convertToPythonEquipment(facility.equipment || []),
      operational_hours: facility.operationalHours || facility.operational_hours || 12,
      staff_count: facility.staffCount || facility.staff_count || 5,
      building_area: facility.buildingArea || facility.building_area,
      patient_capacity: facility.patientCapacity || facility.patient_capacity
    };
  }

  /**
   * Health check for Python services
   */
  static async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${PYTHON_API_BASE_URL}/energy/health`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<any>(response);

    } catch (error) {
      console.error('❌ Python services health check failed:', error);
      throw error;
    }
  }
}

export default PythonEnergyService;
