import { TechnoEconomicService, TechnoEconomicResult, CostingMethodology } from './technoEconomicService';
import EnergyService from './energyService';

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
}

export interface LoadProfile {
  hour: number;
  demand: number; // kW
  equipmentBreakdown: { [key: string]: number };
}

export interface Scenario {
  id: string;
  name: string;
  type: 'current' | 'ideal';
  facilityId?: number;
  facilityName: string;
  facilityType: string;
  loadProfile: LoadProfile[];
  equipment: Equipment[];
  peakDemand: number; // kW
  dailyConsumption: number; // kWh
  annualConsumption: number; // kWh
  createdAt: Date;
  pvAnalysis?: TechnoEconomicResult;
}

export interface ScenarioComparison {
  currentScenario: Scenario;
  idealScenario: Scenario;
  comparison: {
    demandReduction: number; // kW
    consumptionReduction: number; // kWh/year
    costSavings: number; // USD
    efficiencyImprovement: number; // %
    carbonReduction: number; // kg CO2/year
    paybackPeriod: number; // years
    implementationCost: number; // USD
  };
}

class ScenarioComparisonService {
  private scenarios: Map<string, Scenario> = new Map();
  private comparisons: Map<string, ScenarioComparison> = new Map();

  // Generate load profile from survey data (current scenario)
  async generateCurrentScenarioFromSurvey(surveyData: any): Promise<Scenario> {
    try {
      console.log('🔄 Generating current scenario from survey data using backend API...');
      
      // Use backend energy service instead of frontend calculations
      const result = await EnergyService.generateScenarioFromSurvey(surveyData);
      
      // Convert backend response to frontend Scenario format
      const scenario: Scenario = {
        id: result.scenario.id,
        name: result.scenario.name,
        type: result.scenario.type as 'current' | 'ideal',
        facilityId: result.scenario.facilityId,
        facilityName: result.scenario.facilityData.name,
        facilityType: result.scenario.facilityData.facilityType,
        loadProfile: result.scenario.loadProfile,
        equipment: result.scenario.facilityData.equipment,
        peakDemand: result.analysis.peakDemand,
        dailyConsumption: result.analysis.dailyConsumption,
        annualConsumption: result.analysis.annualConsumption,
        createdAt: result.scenario.createdAt
      };
      
      console.log('✅ Current scenario generated using backend service');
      return scenario;
      
    } catch (error) {
      console.error('❌ Error generating scenario from survey, falling back to mock data:', error);
      
      // Fallback to simplified scenario for demo purposes
      return {
        id: `current_${Date.now()}`,
        name: `Current - ${surveyData.facilityData?.name || 'Unknown Facility'}`,
        type: 'current',
        facilityId: surveyData.id,
        facilityName: surveyData.facilityData?.name || 'Unknown Facility',
        facilityType: surveyData.facilityData?.facilityType || 'health_clinic',
        loadProfile: [],
        equipment: [],
        peakDemand: 5, // Mock 5kW peak demand
        dailyConsumption: 60, // Mock 60kWh daily consumption
        annualConsumption: 21900, // Mock annual consumption
        createdAt: new Date()
      };
    }
  }

  // Generate load profile from selected equipment (ideal scenario)
  async generateIdealScenario(
    facilityName: string,
    facilityType: string,
    selectedEquipment: Equipment[]
  ): Promise<Scenario> {
    try {
      console.log('🔄 Generating ideal scenario using backend API...');
      
      // Create facility data for backend API
      const facilityData = {
        name: facilityName,
        facilityType,
        location: { latitude: 0, longitude: 0 }, // Default location
        equipment: selectedEquipment,
        operationalHours: 12,
        staffCount: 5
      };
      
      // Use backend energy service
      const result = await EnergyService.performEnergyAnalysis({
        facilityData,
        scenarioType: 'ideal'
      });
      
      // Convert backend response to frontend Scenario format
      const scenario: Scenario = {
        id: `ideal_${Date.now()}`,
        name: `Ideal - ${facilityName}`,
        type: 'ideal',
        facilityName,
        facilityType,
        loadProfile: result.analysis.scenario.loadProfile,
        equipment: selectedEquipment,
        peakDemand: result.analysis.scenario.energyDemand.peakDemand,
        dailyConsumption: result.analysis.scenario.energyDemand.dailyConsumption,
        annualConsumption: result.analysis.scenario.energyDemand.annualConsumption,
        createdAt: new Date()
      };
      
      console.log('✅ Ideal scenario generated using backend service');
      return scenario;
      
    } catch (error) {
      console.error('❌ Error generating ideal scenario, falling back to mock data:', error);
      
      // Fallback to simplified scenario
      return {
        id: `ideal_${Date.now()}`,
        name: `Ideal - ${facilityName}`,
        type: 'ideal',
        facilityName,
        facilityType,
        loadProfile: [],
        equipment: selectedEquipment,
        peakDemand: 3, // Mock improved 3kW peak demand
        dailyConsumption: 40, // Mock improved 40kWh daily consumption
        annualConsumption: 14600, // Mock improved annual consumption
        createdAt: new Date()
      };
    }
  }

  // Generate hourly load profile from equipment list
  private generateLoadProfile(equipment: Equipment[]): LoadProfile[] {
    const profile: LoadProfile[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      let totalDemand = 0;
      const equipmentBreakdown: { [key: string]: number } = {};
      
      equipment.forEach(eq => {
        let isActive = false;
        let loadFactor = 1;
        
        // Equipment usage patterns based on category and time
        switch (eq.category) {
          case 'medical':
            isActive = eq.hoursPerDay === 24 || (hour >= 6 && hour < 18);
            loadFactor = eq.name.includes('Refrigerator') ? 1 : 
                        (hour >= 8 && hour < 17 ? 1 : 0.3);
            break;
          case 'lighting':
            isActive = hour < 6 || hour >= 18;
            loadFactor = hour >= 20 || hour < 6 ? 1 : 0.7;
            break;
          case 'computing':
            isActive = hour >= 8 && hour < 17;
            loadFactor = 1;
            break;
          case 'cooling':
            isActive = hour >= 9 && hour < 22;
            loadFactor = hour >= 12 && hour < 16 ? 1 : 0.6;
            break;
          case 'kitchen':
            isActive = eq.name.includes('Refrigerator') ? true :
                      (hour >= 6 && hour < 9) || (hour >= 12 && hour < 14) || 
                      (hour >= 18 && hour < 20);
            break;
          default:
            isActive = hour >= 8 && hour < 17;
        }
        
        if (isActive) {
          const power = (eq.customPower || eq.powerRating) * 
                       eq.quantity * 
                       loadFactor * 
                       eq.efficiency / 1000; // Convert to kW
          
          totalDemand += power;
          equipmentBreakdown[eq.name] = power;
        }
      });
      
      profile.push({
        hour,
        demand: Math.round(totalDemand * 100) / 100,
        equipmentBreakdown
      });
    }
    
    return profile;
  }

  // Perform PV analysis for a scenario
  async performScenarioPVAnalysis(
    scenario: Scenario, 
    methodology: string = 'per_watt'
  ): Promise<TechnoEconomicResult> {
    // Create mock facility data for analysis
    const mockFacilityData = {
      peakDemand: scenario.peakDemand,
      dailyConsumption: scenario.dailyConsumption,
      annualConsumption: scenario.annualConsumption,
      equipment: scenario.equipment,
      loadProfile: scenario.loadProfile
    };

    try {
      // Use existing techno-economic service
      const result = await TechnoEconomicService.performAnalysisFromLoadProfile(
        mockFacilityData,
        methodology
      );
      
      return result;
    } catch (error) {
      console.error('PV Analysis failed, using mock data:', error);
      return this.generateMockPVAnalysis(scenario);
    }
  }

  // Generate mock PV analysis for demonstration
  private generateMockPVAnalysis(scenario: Scenario): TechnoEconomicResult {
    const systemSize = scenario.peakDemand * 1.3; // 130% of peak demand
    const batteryCapacity = scenario.dailyConsumption * 1.2; // 120% of daily consumption
    
    return {
      pv: {
        systemSize,
        batteryCapacity,
        initialCost: systemSize * 2500,
        annualMaintenance: systemSize * 50,
        lifecycleCost: systemSize * 2500 + (systemSize * 50 * 20),
        irr: 0.15,
        npv: systemSize * 1000,
        costingMethod: 'per_watt'
      },
      diesel: {
        initialCost: scenario.peakDemand * 800,
        annualMaintenance: scenario.annualConsumption * 0.25,
        lifecycleCost: (scenario.peakDemand * 800) + (scenario.annualConsumption * 0.25 * 20),
        irr: -0.02,
        npv: -scenario.peakDemand * 2000
      }
    };
  }

  // Compare two scenarios
  async compareScenarios(currentScenario: Scenario, idealScenario: Scenario): Promise<ScenarioComparison> {
    // Perform PV analysis for both scenarios if not already done
    if (!currentScenario.pvAnalysis) {
      currentScenario.pvAnalysis = await this.performScenarioPVAnalysis(currentScenario);
    }
    
    if (!idealScenario.pvAnalysis) {
      idealScenario.pvAnalysis = await this.performScenarioPVAnalysis(idealScenario);
    }

    const comparison = {
      demandReduction: currentScenario.peakDemand - idealScenario.peakDemand,
      consumptionReduction: currentScenario.annualConsumption - idealScenario.annualConsumption,
      costSavings: (currentScenario.pvAnalysis?.pv.lifecycleCost || 0) - 
                  (idealScenario.pvAnalysis?.pv.lifecycleCost || 0),
      efficiencyImprovement: idealScenario.equipment.reduce((avg, eq) => avg + eq.efficiency, 0) / 
                            idealScenario.equipment.length -
                            currentScenario.equipment.reduce((avg, eq) => avg + eq.efficiency, 0) / 
                            currentScenario.equipment.length,
      carbonReduction: (currentScenario.annualConsumption - idealScenario.annualConsumption) * 0.8,
      paybackPeriod: this.calculateEquipmentPaybackPeriod(currentScenario, idealScenario),
      implementationCost: this.calculateImplementationCost(idealScenario)
    };

    const scenarioComparison: ScenarioComparison = {
      currentScenario,
      idealScenario,
      comparison
    };

    // Store comparison
    const comparisonId = `comparison_${currentScenario.id}_${idealScenario.id}`;
    this.comparisons.set(comparisonId, scenarioComparison);

    return scenarioComparison;
  }

  // Calculate implementation cost for ideal scenario
  private calculateImplementationCost(idealScenario: Scenario): number {
    return idealScenario.equipment.reduce((cost, eq) => {
      return cost + ((eq.unitCost || 500) * eq.quantity);
    }, 0);
  }

  // Calculate payback period for equipment upgrade
  private calculateEquipmentPaybackPeriod(currentScenario: Scenario, idealScenario: Scenario): number {
    const implementationCost = this.calculateImplementationCost(idealScenario);
    const annualSavings = (currentScenario.annualConsumption - idealScenario.annualConsumption) * 0.15; // $0.15/kWh
    
    return annualSavings > 0 ? implementationCost / annualSavings : 999;
  }

  // Helper function to categorize equipment
  private categorizeEquipment(equipmentType: string): Equipment['category'] {
    const type = equipmentType.toLowerCase();
    if (type.includes('light') || type.includes('lamp')) return 'lighting';
    if (type.includes('computer') || type.includes('laptop')) return 'computing';
    if (type.includes('fan') || type.includes('ac') || type.includes('air')) return 'cooling';
    if (type.includes('fridge') || type.includes('refrigerator') || type.includes('microwave')) return 'kitchen';
    if (type.includes('medical') || type.includes('ultrasound') || type.includes('sterilizer')) return 'medical';
    return 'other';
  }

  // Storage management
  saveScenario(scenario: Scenario): void {
    this.scenarios.set(scenario.id, scenario);
    // Also save to localStorage for persistence
    const scenarios = JSON.parse(localStorage.getItem('dream_scenarios') || '[]');
    const existingIndex = scenarios.findIndex((s: Scenario) => s.id === scenario.id);
    if (existingIndex >= 0) {
      scenarios[existingIndex] = scenario;
    } else {
      scenarios.push(scenario);
    }
    localStorage.setItem('dream_scenarios', JSON.stringify(scenarios));
  }

  getScenario(id: string): Scenario | undefined {
    // First check memory
    if (this.scenarios.has(id)) {
      return this.scenarios.get(id);
    }
    
    // Then check localStorage
    const scenarios = JSON.parse(localStorage.getItem('dream_scenarios') || '[]');
    const scenario = scenarios.find((s: Scenario) => s.id === id);
    if (scenario) {
      this.scenarios.set(id, scenario);
      return scenario;
    }
    
    return undefined;
  }

  getAllScenarios(): Scenario[] {
    const scenarios = JSON.parse(localStorage.getItem('dream_scenarios') || '[]');
    scenarios.forEach((scenario: Scenario) => {
      this.scenarios.set(scenario.id, scenario);
    });
    return Array.from(this.scenarios.values());
  }

  deleteScenario(id: string): void {
    this.scenarios.delete(id);
    const scenarios = JSON.parse(localStorage.getItem('dream_scenarios') || '[]');
    const filtered = scenarios.filter((s: Scenario) => s.id !== id);
    localStorage.setItem('dream_scenarios', JSON.stringify(filtered));
  }
}

export const scenarioComparisonService = new ScenarioComparisonService();
export default scenarioComparisonService;
