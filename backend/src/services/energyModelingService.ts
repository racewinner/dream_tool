import { Equipment, LoadProfile, EnergyDemand, FacilityData } from '../types/energy';

export interface EnergyCalculationOptions {
  includeSeasonalVariation?: boolean;
  safetyMargin?: number;
  systemEfficiency?: number;
  batteryAutonomy?: number;
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

export class EnergyModelingService {
  private static readonly DEFAULT_OPTIONS: EnergyCalculationOptions = {
    includeSeasonalVariation: true,
    safetyMargin: 1.2, // 20% safety margin
    systemEfficiency: 0.85, // 85% system efficiency
    batteryAutonomy: 24 // 24 hours backup
  };

  /**
   * Generate 24-hour load profile from equipment list
   */
  static generateLoadProfile(
    equipment: Equipment[], 
    options: EnergyCalculationOptions = {}
  ): LoadProfile[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const profile: LoadProfile[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      let totalDemand = 0;
      const equipmentBreakdown: { [key: string]: number } = {};
      
      equipment.forEach(eq => {
        const { isActive, loadFactor } = this.getEquipmentUsagePattern(eq, hour);
        
        if (isActive) {
          const power = this.calculateEquipmentPower(eq, loadFactor);
          totalDemand += power;
          equipmentBreakdown[eq.name] = power;
        }
      });
      
      profile.push({
        hour,
        demand: Math.round(totalDemand * 100) / 100, // Round to 2 decimal places
        equipmentBreakdown,
        temperature: this.getAmbientTemperature(hour), // For cooling load adjustments
        solarIrradiance: this.getSolarIrradiance(hour) // For PV generation
      });
    }
    
    return profile;
  }

  /**
   * Calculate comprehensive energy demand analysis
   */
  static calculateEnergyDemand(
    facilityData: FacilityData,
    options: EnergyCalculationOptions = {}
  ): EnergyAnalysisResult {
    const equipment = facilityData.equipment || [];
    const loadProfile = this.generateLoadProfile(equipment, options);
    
    // Calculate key metrics
    const peakDemand = Math.max(...loadProfile.map(h => h.demand));
    const dailyConsumption = loadProfile.reduce((sum, hour) => sum + hour.demand, 0);
    const annualConsumption = dailyConsumption * 365;
    
    // Separate critical and non-critical loads
    const criticalEquipment = equipment.filter(eq => eq.priority === 'essential');
    const nonCriticalEquipment = equipment.filter(eq => eq.priority !== 'essential');
    
    const criticalProfile = this.generateLoadProfile(criticalEquipment, options);
    const nonCriticalProfile = this.generateLoadProfile(nonCriticalEquipment, options);
    
    const criticalLoad = Math.max(...criticalProfile.map(h => h.demand));
    const nonCriticalLoad = Math.max(...nonCriticalProfile.map(h => h.demand));
    
    // Equipment breakdown by category
    const equipmentBreakdown = this.calculateEquipmentBreakdown(equipment);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(facilityData, {
      peakDemand,
      dailyConsumption,
      criticalLoad,
      equipmentBreakdown
    });
    
    return {
      loadProfile,
      peakDemand,
      dailyConsumption,
      annualConsumption,
      criticalLoad,
      nonCriticalLoad,
      equipmentBreakdown,
      recommendations
    };
  }

  /**
   * Generate current scenario from survey data
   */
  static generateCurrentScenarioFromSurvey(surveyData: any): EnergyAnalysisResult {
    // Extract equipment from survey facility data
    const equipment: Equipment[] = [];
    
    if (surveyData.facilityData?.equipment) {
      surveyData.facilityData.equipment.forEach((item: any, index: number) => {
        equipment.push({
          id: `survey_${index}`,
          name: item.type || 'Unknown Equipment',
          category: this.categorizeEquipment(item.type || ''),
          powerRating: item.powerRating || this.getDefaultPowerRating(item.type),
          hoursPerDay: item.hoursPerDay || this.getDefaultOperatingHours(item.type),
          efficiency: item.efficiency || 0.8,
          priority: item.condition === 'good' ? 'essential' : 'important',
          facilityTypes: [surveyData.facilityData?.facilityType || 'health_clinic'],
          description: `${item.type} - ${item.condition}`,
          quantity: item.quantity || 1,
          condition: item.condition || 'fair'
        });
      });
    }

    const facilityData: FacilityData = {
      name: surveyData.facilityData?.name || 'Unknown Facility',
      facilityType: surveyData.facilityData?.facilityType || 'health_clinic',
      location: {
        latitude: surveyData.facilityData?.latitude || 0,
        longitude: surveyData.facilityData?.longitude || 0
      },
      equipment,
      operationalHours: surveyData.facilityData?.operationalHours || 12,
      staffCount: surveyData.facilityData?.staffCount || 5
    };

    return this.calculateEnergyDemand(facilityData);
  }

  /**
   * Determine equipment usage patterns based on category and time
   */
  private static getEquipmentUsagePattern(equipment: Equipment, hour: number): {
    isActive: boolean;
    loadFactor: number;
  } {
    let isActive = false;
    let loadFactor = 1;
    
    switch (equipment.category) {
      case 'medical':
        // Medical equipment: mostly daytime, some 24/7 (refrigerators)
        isActive = equipment.hoursPerDay === 24 || (hour >= 6 && hour < 18);
        loadFactor = equipment.name.toLowerCase().includes('refrigerator') ? 1 : 
                    (hour >= 8 && hour < 17 ? 1 : 0.3);
        break;
        
      case 'lighting':
        // Lighting: early morning and evening/night
        isActive = hour < 6 || hour >= 18;
        loadFactor = hour >= 20 || hour < 6 ? 1 : 0.7;
        break;
        
      case 'computing':
        // Computing: office hours
        isActive = hour >= 8 && hour < 17;
        loadFactor = 1;
        break;
        
      case 'cooling':
        // Cooling: midday peak, some evening
        isActive = hour >= 9 && hour < 22;
        loadFactor = hour >= 12 && hour < 16 ? 1 : 0.6;
        break;
        
      case 'kitchen':
        // Kitchen: meal times, refrigeration 24/7
        isActive = equipment.name.toLowerCase().includes('refrigerator') ? true :
                  (hour >= 6 && hour < 9) || (hour >= 12 && hour < 14) || 
                  (hour >= 18 && hour < 20);
        loadFactor = 1;
        break;
        
      default:
        // Default: office hours
        isActive = hour >= 8 && hour < 17;
        loadFactor = 0.8;
    }
    
    return { isActive, loadFactor };
  }

  /**
   * Calculate actual power consumption for equipment
   */
  private static calculateEquipmentPower(equipment: Equipment, loadFactor: number): number {
    return (equipment.powerRating * equipment.quantity * loadFactor * equipment.efficiency) / 1000; // Convert to kW
  }

  /**
   * Get ambient temperature for hour (affects cooling loads)
   */
  private static getAmbientTemperature(hour: number): number {
    // Simplified temperature model for Somalia (hot climate)
    const baseTemp = 30; // 30°C base temperature
    const variation = 8; // 8°C daily variation
    const peakHour = 14; // 2 PM peak temperature
    
    return baseTemp + variation * Math.sin((hour - peakHour + 6) * Math.PI / 12);
  }

  /**
   * Get solar irradiance for hour (for PV generation)
   */
  private static getSolarIrradiance(hour: number): number {
    // Simplified solar irradiance model
    if (hour < 6 || hour > 18) return 0;
    
    const peakIrradiance = 1000; // W/m² at solar noon
    const solarNoon = 12;
    
    return peakIrradiance * Math.sin((hour - 6) * Math.PI / 12);
  }

  /**
   * Calculate equipment breakdown by category
   */
  private static calculateEquipmentBreakdown(equipment: Equipment[]): { [category: string]: number } {
    const breakdown: { [category: string]: number } = {};
    
    equipment.forEach(eq => {
      const power = eq.powerRating * eq.quantity / 1000; // kW
      breakdown[eq.category] = (breakdown[eq.category] || 0) + power;
    });
    
    return breakdown;
  }

  /**
   * Generate energy efficiency recommendations
   */
  private static generateRecommendations(
    facilityData: FacilityData, 
    analysis: { peakDemand: number; dailyConsumption: number; criticalLoad: number; equipmentBreakdown: any }
  ): string[] {
    const recommendations: string[] = [];
    
    // High peak demand
    if (analysis.peakDemand > 10) {
      recommendations.push('Consider load management strategies to reduce peak demand');
    }
    
    // High lighting load
    if (analysis.equipmentBreakdown.lighting > analysis.peakDemand * 0.3) {
      recommendations.push('Switch to LED lighting to reduce energy consumption by 60-80%');
    }
    
    // High cooling load
    if (analysis.equipmentBreakdown.cooling > analysis.peakDemand * 0.4) {
      recommendations.push('Improve building insulation and consider energy-efficient cooling systems');
    }
    
    // Low equipment efficiency
    const avgEfficiency = facilityData.equipment?.reduce((sum, eq) => sum + eq.efficiency, 0) / (facilityData.equipment?.length || 1);
    if (avgEfficiency < 0.7) {
      recommendations.push('Replace old equipment with energy-efficient alternatives');
    }
    
    // 24/7 operation potential
    if (analysis.criticalLoad > analysis.peakDemand * 0.5) {
      recommendations.push('Consider battery storage for critical loads during power outages');
    }
    
    return recommendations;
  }

  /**
   * Categorize equipment based on type string
   */
  private static categorizeEquipment(equipmentType: string): Equipment['category'] {
    const type = equipmentType.toLowerCase();
    
    if (type.includes('light') || type.includes('lamp')) return 'lighting';
    if (type.includes('computer') || type.includes('laptop')) return 'computing';
    if (type.includes('fan') || type.includes('ac') || type.includes('air')) return 'cooling';
    if (type.includes('fridge') || type.includes('refrigerator') || type.includes('microwave')) return 'kitchen';
    if (type.includes('medical') || type.includes('ultrasound') || type.includes('sterilizer') || 
        type.includes('x-ray') || type.includes('monitor')) return 'medical';
    
    return 'other';
  }

  /**
   * Get default power rating for equipment type
   */
  private static getDefaultPowerRating(equipmentType: string): number {
    const type = equipmentType.toLowerCase();
    
    // Default power ratings in Watts
    if (type.includes('light')) return 20;
    if (type.includes('computer')) return 200;
    if (type.includes('fan')) return 75;
    if (type.includes('ac')) return 1500;
    if (type.includes('refrigerator')) return 150;
    if (type.includes('ultrasound')) return 300;
    if (type.includes('x-ray')) return 2000;
    
    return 100; // Default 100W
  }

  /**
   * Get default operating hours for equipment type
   */
  private static getDefaultOperatingHours(equipmentType: string): number {
    const type = equipmentType.toLowerCase();
    
    if (type.includes('refrigerator') || type.includes('monitor')) return 24;
    if (type.includes('light')) return 12;
    if (type.includes('computer')) return 8;
    if (type.includes('medical')) return 6;
    
    return 8; // Default 8 hours
  }
}

export default EnergyModelingService;
