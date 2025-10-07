/**
 * Equipment Planning Service
 * TypeScript client for managing future equipment scenarios and planning
 */

import { API_CONFIG } from '../config/api';

// Core interfaces for equipment planning
export interface FutureEquipmentRequest {
  name: string;
  category: string;
  power_rating_w: number;
  quantity: number;
  hours_per_day: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  efficiency: number;
  installation_year: number;
  replacement_for?: string;
  is_new_addition: boolean;
  estimated_cost: number;
}

export interface FutureEquipment extends FutureEquipmentRequest {
  id: string;
  annual_kwh: number;
}

export interface CreateScenarioRequest {
  facility_id: number;
  name: string;
  description: string;
  timeline_years: number;
  growth_factor: number;
}

export interface UpdateScenarioRequest {
  name?: string;
  description?: string;
  timeline_years?: number;
  growth_factor?: number;
  selected_current_equipment?: string[];
}

export interface EquipmentScenario {
  id: string;
  name: string;
  description: string;
  facility_id: number;
  timeline_years: number;
  growth_factor: number;
  selected_current_equipment: string[];
  new_equipment: FutureEquipment[];
  equipment_replacements: { [key: string]: string };
  total_projected_demand: number;
  estimated_total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface EquipmentRecommendation {
  equipment_type: string;
  category: string;
  recommended_power_w: number;
  recommended_quantity: number;
  justification: string;
  priority: string;
  estimated_cost: number;
  energy_impact_kwh: number;
  payback_period_years: number;
}

export interface EquipmentCategory {
  name: string;
  description: string;
  typical_power_range: string;
  priority: string;
}

export interface ValidationResults {
  is_valid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface ScenarioExportData {
  scenario_info: {
    id: string;
    name: string;
    description: string;
    timeline_years: number;
    growth_factor: number;
  };
  current_equipment: any[];
  future_equipment: any[];
  future_growth_parameters: {
    selected_equipment_ids: string[];
    growth_factor: number;
    timeline_years: number;
    new_equipment: any[];
  };
  projections: {
    total_projected_demand_kwh: number;
    estimated_cost: number;
    equipment_count: number;
  };
}

class EquipmentPlanningService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = `${API_CONFIG.PYTHON_BASE_URL}/equipment-planning`;
    this.cache = new Map();
  }

  /**
   * Create a new equipment planning scenario
   */
  async createScenario(request: CreateScenarioRequest): Promise<EquipmentScenario> {
    try {
      const response = await this.makeRequest<{ success: boolean; scenario: EquipmentScenario }>(
        '/create-scenario',
        'POST',
        request
      );

      if (response.success) {
        // Clear cache for facility scenarios
        this.clearFacilityCache(request.facility_id);
        return response.scenario;
      } else {
        throw new Error('Failed to create equipment scenario');
      }
    } catch (error) {
      console.error('Error creating equipment scenario:', error);
      throw error;
    }
  }

  /**
   * Update an existing equipment scenario
   */
  async updateScenario(scenarioId: string, request: UpdateScenarioRequest): Promise<EquipmentScenario> {
    try {
      const response = await this.makeRequest<{ success: boolean; scenario: EquipmentScenario }>(
        `/update-scenario/${scenarioId}`,
        'PUT',
        request
      );

      if (response.success) {
        // Clear cache
        this.clearScenarioCache(scenarioId);
        return response.scenario;
      } else {
        throw new Error('Failed to update equipment scenario');
      }
    } catch (error) {
      console.error('Error updating equipment scenario:', error);
      throw error;
    }
  }

  /**
   * Add new equipment to a scenario
   */
  async addEquipment(scenarioId: string, equipment: FutureEquipmentRequest): Promise<EquipmentScenario> {
    try {
      const response = await this.makeRequest<{ 
        success: boolean; 
        scenario: EquipmentScenario;
        equipment_added: FutureEquipment;
      }>(
        `/add-equipment/${scenarioId}`,
        'POST',
        equipment
      );

      if (response.success) {
        // Clear cache
        this.clearScenarioCache(scenarioId);
        return response.scenario;
      } else {
        throw new Error('Failed to add equipment to scenario');
      }
    } catch (error) {
      console.error('Error adding equipment to scenario:', error);
      throw error;
    }
  }

  /**
   * Remove equipment from a scenario
   */
  async removeEquipment(scenarioId: string, equipmentId: string): Promise<EquipmentScenario> {
    try {
      const response = await this.makeRequest<{ success: boolean; scenario: EquipmentScenario }>(
        `/remove-equipment/${scenarioId}/${equipmentId}`,
        'DELETE'
      );

      if (response.success) {
        // Clear cache
        this.clearScenarioCache(scenarioId);
        return response.scenario;
      } else {
        throw new Error('Failed to remove equipment from scenario');
      }
    } catch (error) {
      console.error('Error removing equipment from scenario:', error);
      throw error;
    }
  }

  /**
   * Get equipment recommendations for a facility
   */
  async getRecommendations(
    facilityId: number,
    facilityType: string = 'healthcare',
    budgetConstraint?: number
  ): Promise<EquipmentRecommendation[]> {
    try {
      const cacheKey = `recommendations-${facilityId}-${facilityType}-${budgetConstraint || 'unlimited'}`;
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<{ 
        success: boolean; 
        recommendations: EquipmentRecommendation[];
      }>(
        '/get-recommendations',
        'POST',
        {
          facility_id: facilityId,
          facility_type: facilityType,
          budget_constraint: budgetConstraint
        }
      );

      if (response.success) {
        this.setCachedData(cacheKey, response.recommendations);
        return response.recommendations;
      } else {
        throw new Error('Failed to get equipment recommendations');
      }
    } catch (error) {
      console.error('Error getting equipment recommendations:', error);
      throw error;
    }
  }

  /**
   * Validate an equipment scenario
   */
  async validateScenario(scenarioId: string): Promise<ValidationResults> {
    try {
      const response = await this.makeRequest<{ 
        success: boolean; 
        validation_results: ValidationResults;
      }>(
        '/validate-scenario',
        'POST',
        { scenario_id: scenarioId }
      );

      if (response.success) {
        return response.validation_results;
      } else {
        throw new Error('Failed to validate equipment scenario');
      }
    } catch (error) {
      console.error('Error validating equipment scenario:', error);
      throw error;
    }
  }

  /**
   * Export scenario for demand analysis
   */
  async exportScenario(scenarioId: string): Promise<ScenarioExportData> {
    try {
      const response = await this.makeRequest<{ 
        success: boolean; 
        export_data: ScenarioExportData;
      }>(
        `/export-scenario/${scenarioId}`
      );

      if (response.success) {
        return response.export_data;
      } else {
        throw new Error('Failed to export equipment scenario');
      }
    } catch (error) {
      console.error('Error exporting equipment scenario:', error);
      throw error;
    }
  }

  /**
   * Get all scenarios for a facility
   */
  async getFacilityScenarios(facilityId: number): Promise<EquipmentScenario[]> {
    try {
      const cacheKey = `facility-scenarios-${facilityId}`;
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<{ 
        success: boolean; 
        scenarios: EquipmentScenario[];
      }>(
        `/scenarios/${facilityId}`
      );

      if (response.success) {
        this.setCachedData(cacheKey, response.scenarios);
        return response.scenarios;
      } else {
        throw new Error('Failed to get facility scenarios');
      }
    } catch (error) {
      console.error('Error getting facility scenarios:', error);
      throw error;
    }
  }

  /**
   * Get available equipment categories
   */
  async getEquipmentCategories(): Promise<{
    categories: EquipmentCategory[];
    total_categories: number;
    priority_levels: string[];
  }> {
    try {
      const cacheKey = 'equipment-categories';
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }

      const response = await this.makeRequest<{
        categories: EquipmentCategory[];
        total_categories: number;
        priority_levels: string[];
      }>('/equipment-categories');

      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Error getting equipment categories:', error);
      throw error;
    }
  }

  /**
   * Health check for equipment planning service
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    version: string;
    features: string[];
    cached_scenarios: number;
  }> {
    try {
      return await this.makeRequest<any>('/health');
    } catch (error) {
      console.error('Error checking equipment planning service health:', error);
      throw error;
    }
  }

  // Utility methods for common use cases

  /**
   * Create a default scenario for a facility
   */
  async createDefaultScenario(
    facilityId: number,
    facilityType: 'healthcare' | 'clinic' | 'hospital' | 'emergency' = 'healthcare'
  ): Promise<EquipmentScenario> {
    const scenarioTemplates = {
      healthcare: {
        name: 'Healthcare Growth Scenario',
        description: 'Standard healthcare facility growth planning with 20% expansion over 5 years',
        timeline_years: 5,
        growth_factor: 1.2
      },
      clinic: {
        name: 'Clinic Expansion Scenario',
        description: 'Basic clinic expansion planning with moderate growth over 3 years',
        timeline_years: 3,
        growth_factor: 1.15
      },
      hospital: {
        name: 'Hospital Development Scenario',
        description: 'Hospital capacity expansion with significant growth over 7 years',
        timeline_years: 7,
        growth_factor: 1.4
      },
      emergency: {
        name: 'Emergency Preparedness Scenario',
        description: 'Emergency resilience planning with minimal growth over 10 years',
        timeline_years: 10,
        growth_factor: 1.1
      }
    };

    const template = scenarioTemplates[facilityType];
    
    return await this.createScenario({
      facility_id: facilityId,
      name: template.name,
      description: template.description,
      timeline_years: template.timeline_years,
      growth_factor: template.growth_factor
    });
  }

  /**
   * Add recommended equipment to scenario
   */
  async addRecommendedEquipment(
    scenarioId: string,
    recommendation: EquipmentRecommendation,
    installationYear?: number
  ): Promise<EquipmentScenario> {
    const equipment: FutureEquipmentRequest = {
      name: recommendation.equipment_type,
      category: recommendation.category,
      power_rating_w: recommendation.recommended_power_w,
      quantity: recommendation.recommended_quantity,
      hours_per_day: 8, // Default 8 hours
      priority: recommendation.priority as any,
      efficiency: 1.0, // Default efficiency
      installation_year: installationYear || new Date().getFullYear() + 1,
      is_new_addition: true,
      estimated_cost: recommendation.estimated_cost
    };

    return await this.addEquipment(scenarioId, equipment);
  }

  /**
   * Calculate scenario metrics
   */
  calculateScenarioMetrics(scenario: EquipmentScenario): {
    total_equipment_count: number;
    new_equipment_count: number;
    total_power_kw: number;
    average_installation_year: number;
    cost_per_kwh: number;
    equipment_by_category: { [category: string]: number };
    equipment_by_priority: { [priority: string]: number };
  } {
    const newEquipmentCount = scenario.new_equipment.length;
    const totalEquipmentCount = scenario.selected_current_equipment.length + newEquipmentCount;
    
    const totalPowerW = scenario.new_equipment.reduce((sum, eq) => 
      sum + (eq.power_rating_w * eq.quantity), 0
    );
    const totalPowerKw = totalPowerW / 1000;
    
    const avgInstallationYear = scenario.new_equipment.length > 0
      ? scenario.new_equipment.reduce((sum, eq) => sum + eq.installation_year, 0) / scenario.new_equipment.length
      : new Date().getFullYear();
    
    const costPerKwh = scenario.total_projected_demand > 0
      ? scenario.estimated_total_cost / scenario.total_projected_demand
      : 0;
    
    // Equipment by category
    const equipmentByCategory: { [category: string]: number } = {};
    scenario.new_equipment.forEach(eq => {
      equipmentByCategory[eq.category] = (equipmentByCategory[eq.category] || 0) + eq.quantity;
    });
    
    // Equipment by priority
    const equipmentByPriority: { [priority: string]: number } = {};
    scenario.new_equipment.forEach(eq => {
      equipmentByPriority[eq.priority] = (equipmentByPriority[eq.priority] || 0) + eq.quantity;
    });
    
    return {
      total_equipment_count: totalEquipmentCount,
      new_equipment_count: newEquipmentCount,
      total_power_kw: totalPowerKw,
      average_installation_year: Math.round(avgInstallationYear),
      cost_per_kwh: costPerKwh,
      equipment_by_category: equipmentByCategory,
      equipment_by_priority: equipmentByPriority
    };
  }

  /**
   * Validate equipment parameters
   */
  validateEquipment(equipment: FutureEquipmentRequest): string[] {
    const errors: string[] = [];
    
    if (!equipment.name || equipment.name.trim().length === 0) {
      errors.push('Equipment name is required');
    }
    
    if (!equipment.category || equipment.category.trim().length === 0) {
      errors.push('Equipment category is required');
    }
    
    if (equipment.power_rating_w <= 0) {
      errors.push('Power rating must be greater than 0');
    }
    
    if (equipment.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    
    if (equipment.hours_per_day < 0 || equipment.hours_per_day > 24) {
      errors.push('Hours per day must be between 0 and 24');
    }
    
    if (equipment.efficiency <= 0 || equipment.efficiency > 2) {
      errors.push('Efficiency must be between 0 and 2');
    }
    
    const currentYear = new Date().getFullYear();
    if (equipment.installation_year < currentYear || equipment.installation_year > currentYear + 20) {
      errors.push(`Installation year must be between ${currentYear} and ${currentYear + 20}`);
    }
    
    return errors;
  }

  /**
   * Generate equipment suggestions based on category
   */
  generateEquipmentSuggestions(category: string): Partial<FutureEquipmentRequest>[] {
    const suggestions: { [category: string]: Partial<FutureEquipmentRequest>[] } = {
      'Medical Equipment': [
        { name: 'Digital X-Ray System', power_rating_w: 15000, hours_per_day: 8, priority: 'critical' },
        { name: 'Ultrasound Machine', power_rating_w: 500, hours_per_day: 6, priority: 'high' },
        { name: 'Patient Monitor', power_rating_w: 100, hours_per_day: 24, priority: 'critical' },
        { name: 'Defibrillator', power_rating_w: 200, hours_per_day: 1, priority: 'critical' }
      ],
      'Laboratory Equipment': [
        { name: 'Centrifuge', power_rating_w: 1500, hours_per_day: 4, priority: 'high' },
        { name: 'Microscope', power_rating_w: 100, hours_per_day: 8, priority: 'normal' },
        { name: 'Incubator', power_rating_w: 800, hours_per_day: 24, priority: 'high' },
        { name: 'Autoclave', power_rating_w: 3000, hours_per_day: 2, priority: 'high' }
      ],
      'HVAC': [
        { name: 'Split AC Unit', power_rating_w: 3000, hours_per_day: 12, priority: 'high' },
        { name: 'Ventilation Fan', power_rating_w: 500, hours_per_day: 24, priority: 'normal' },
        { name: 'Heat Pump', power_rating_w: 5000, hours_per_day: 8, priority: 'high' }
      ],
      'Lighting': [
        { name: 'LED Panel Lights', power_rating_w: 50, hours_per_day: 12, priority: 'normal' },
        { name: 'Emergency Lighting', power_rating_w: 20, hours_per_day: 1, priority: 'critical' },
        { name: 'Surgical Lights', power_rating_w: 200, hours_per_day: 8, priority: 'critical' }
      ],
      'IT Equipment': [
        { name: 'Server', power_rating_w: 800, hours_per_day: 24, priority: 'high' },
        { name: 'Workstation Computer', power_rating_w: 300, hours_per_day: 8, priority: 'normal' },
        { name: 'Network Switch', power_rating_w: 100, hours_per_day: 24, priority: 'high' },
        { name: 'UPS System', power_rating_w: 2000, hours_per_day: 24, priority: 'critical' }
      ]
    };
    
    return suggestions[category] || [];
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

  private clearScenarioCache(scenarioId: string): void {
    // Clear all cache entries related to this scenario
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(scenarioId)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private clearFacilityCache(facilityId: number): void {
    // Clear all cache entries related to this facility
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(`facility-${facilityId}`) || key.includes(`${facilityId}`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Export singleton instance
export const equipmentPlanningService = new EquipmentPlanningService();

// Export all types and classes
export {
  EquipmentPlanningService
};
