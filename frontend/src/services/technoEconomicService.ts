interface TechnoEconomicParameters {
  // System sizing parameters
  systemSizingFactor: number;
  solarIrradianceFactor: number;
  ambientTemperature: number;
  windSpeed: number;
  includeSeasonalVariation: boolean;

  // Battery parameters
  batteryAutonomyFactor: number;
  batteryDepthOfDischarge: number;
  batteryType: 'lithium' | 'lead_acid';
  batteryRoundTripEfficiency: number;
  batteryLifetime: number;
  batteryTemperatureDerating: number;
  
  // System efficiency parameters
  inverterEfficiency: number;
  
  // Cost parameters
  panelCostPerWatt: number;
  panelCostPerKw: number;
  batteryCostPerKwh: number;
  inverterCostPerKw: number;
  structureCostPerKw: number;
  fixedCosts: number;
  
  // Economic parameters
  electricityTariff: number;
  fuelPriceEscalation: number;
  maintenanceCostEscalation: number;
  includeInflation: boolean;
  discountRate: number;
  projectLifetime: number;
}

interface CostingMethodology {
  method: 'perWatt' | 'fixedVariable' | 'componentBased';
  systemCostPerWatt?: number;
  panelCostPerWatt?: number;
  panelCostPerKw?: number;
  batteryCostPerKwh?: number;
  inverterCostPerKw?: number;
  structureCostPerKw?: number;
  fixedCosts?: number;
  numPanels?: number;
  panelRating?: number;
}

interface LoadProfile {
  dailyUsage: number;
  peakHours: number;
  equipment: Array<{
    name: string;
    power: number;
    hours: number;
    quantity: number;
    frequency: string;
    timeOfUse: string;
    critical: boolean;
  }>;
}

interface TechnoEconomicResult {
  pv: {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    npv: number;
    irr: number;
    systemSize: number;
    batteryCapacity: number;
    costingMethod: string;
    panelCostPerWatt?: number;
    panelCostPerKw?: number;
    batteryCostPerKwh?: number;
    inverterCostPerKw?: number;
    structureCostPerKw?: number;
    fixedCosts?: number;
    numPanels?: number;
    panelRating?: number;
  };
  diesel: {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    npv: number;
    irr: number;
  };
}

class TechnoEconomicService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Default parameters - can be overridden by user configuration
  private static readonly DEFAULT_PARAMETERS: TechnoEconomicParameters = {
    // System sizing parameters
    systemSizingFactor: 1.2,
    solarIrradianceFactor: 0.85,
    ambientTemperature: 25,
    windSpeed: 2.5,
    includeSeasonalVariation: true,
    
    // Battery parameters
    batteryAutonomyFactor: 1.0,
    batteryDepthOfDischarge: 0.8,
    batteryType: 'lithium',
    batteryRoundTripEfficiency: 0.92,
    batteryLifetime: 10,
    batteryTemperatureDerating: 0.05,
    
    // System efficiency parameters
    inverterEfficiency: 0.94,
    
    // Cost parameters
    panelCostPerWatt: 0.4,
    panelCostPerKw: 400,
    batteryCostPerKwh: 300,
    inverterCostPerKw: 300,
    structureCostPerKw: 150,
    fixedCosts: 0,
    
    // Economic parameters
    electricityTariff: 0.25,
    fuelPriceEscalation: 0.03,
    maintenanceCostEscalation: 0.025,
    includeInflation: true,
    discountRate: 0.08,
    projectLifetime: 20
  };

  static async performAnalysis(
    facilityId: number,
    costingMethod: CostingMethodology,
    parameters: Partial<TechnoEconomicParameters> = {},
    token: string
  ): Promise<{ success: boolean; data?: TechnoEconomicResult; error?: string }> {
    try {
      const requestData = {
        stage: costingMethod.method === 'componentBased' ? 'tendering' : 'prefeasibility',
        costingMethod: costingMethod.method,
        ...this.DEFAULT_PARAMETERS,
        ...parameters,
        ...costingMethod
      };

      const response = await fetch(`${this.API_BASE_URL}/techno-economic/${facilityId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Techno-economic analysis failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  static calculateLoadProfileFromSurvey(surveyData: any): LoadProfile {
    const equipmentPowerMap: { [key: string]: number } = {
      'lab_incubator': 150,
      'dry_steriliser': 1500,
      'mobile_phone': 5,
      'autoclave': 2000,
      'centrifuge': 300,
      'microscope': 50,
      'refrigerator': 200,
      'ultrasound': 500,
      'monitor': 10,
      'nebulizer': 50,
      'light': 40,
      'lamp': 40,
      'fan': 75,
      'computer': 65,
      'laptop': 65,
      'printer': 30,
      'scanner': 25,
      'x-ray': 3000,
      'suction': 200,
      'pump': 100
    };

    const getEquipmentPower = (name: string): number => {
      const lowercaseName = name.toLowerCase();
      for (const [key, power] of Object.entries(equipmentPowerMap)) {
        if (lowercaseName.includes(key)) {
          return power;
        }
      }
      return 100; // Default power rating
    };

    const calculateWeeklyUsageFactor = (frequency: string): number => {
      const frequencyMap: { [key: string]: number } = {
        'Daily': 1.0,
        'Weekly': 1/7,
        'Monthly': 1/30,
        'Rarely': 1/30
      };
      return frequencyMap[frequency] || 1.0;
    };

    let totalDailyUsage = 0;
    const processedEquipment = (surveyData.equipment || []).map((item: any) => {
      const power = getEquipmentPower(item.name);
      const quantity = parseInt(item.quantity) || 1;
      const hours = parseInt(item.hoursPerDay) || 8;
      const frequency = item.frequency || 'Daily';
      const timeOfUse = item.timeOfUse || 'day';
      
      const weeklyUsageFactor = calculateWeeklyUsageFactor(frequency);
      const dailyEnergy = (power * hours * quantity * weeklyUsageFactor) / 1000; // kWh
      
      totalDailyUsage += dailyEnergy;

      return {
        name: item.name,
        power,
        hours,
        quantity,
        frequency,
        timeOfUse,
        critical: item.critical || false
      };
    });

    // Calculate peak hours based on operational schedule
    const operationalHours = surveyData.operationalHours || { day: 8, night: 0 };
    const peakHours = Math.max(operationalHours.day, operationalHours.night) * 0.85;

    return {
      dailyUsage: totalDailyUsage,
      peakHours: Math.max(peakHours, 4), // Minimum 4 hours
      equipment: processedEquipment
    };
  }

  static getMockLoadProfile(): LoadProfile {
    return {
      dailyUsage: 15.5,
      peakHours: 6,
      equipment: [
        { name: 'LED Lights', power: 40, hours: 12, quantity: 10, frequency: 'Daily', timeOfUse: 'day', critical: true },
        { name: 'Refrigerator', power: 200, hours: 24, quantity: 1, frequency: 'Daily', timeOfUse: 'day', critical: true },
        { name: 'Computer', power: 65, hours: 8, quantity: 3, frequency: 'Daily', timeOfUse: 'day', critical: false },
        { name: 'Fans', power: 75, hours: 10, quantity: 4, frequency: 'Daily', timeOfUse: 'day', critical: false }
      ]
    };
  }

  static getMockAnalysisResult(): TechnoEconomicResult {
    return {
      pv: {
        initialCost: 8500,
        annualMaintenance: 170,
        lifecycleCost: 12100,
        npv: 11500,
        irr: 0.12,
        systemSize: 2.8,
        batteryCapacity: 19.4,
        costingMethod: 'perWatt',
        panelCostPerWatt: 0.4,
        panelCostPerKw: 400,
        batteryCostPerKwh: 300,
        inverterCostPerKw: 300,
        structureCostPerKw: 150,
        fixedCosts: 0
      },
      diesel: {
        initialCost: 3500,
        annualMaintenance: 2800,
        lifecycleCost: 59500,
        npv: 47200,
        irr: 0.05
      }
    };
  }

  static getDefaultParameters(): TechnoEconomicParameters {
    return { ...this.DEFAULT_PARAMETERS };
  }

  static getUserParameters(): TechnoEconomicParameters {
    return this.getMergedParameters();
  }

  static saveUserParameters(parameters: Partial<TechnoEconomicParameters>): void {
    localStorage.setItem('technoEconomicParams', JSON.stringify(parameters));
  }

  static loadUserParameters(): Partial<TechnoEconomicParameters> {
    const saved = localStorage.getItem('technoEconomicParams');
    return saved ? JSON.parse(saved) : {};
  }

  static getMergedParameters(): TechnoEconomicParameters {
    const userParams = this.loadUserParameters();
    return { ...this.DEFAULT_PARAMETERS, ...userParams };
  }

  static async performAnalysisFromLoadProfile(
    loadProfileData: any,
    methodology: string = 'perWatt',
    parameters: Partial<TechnoEconomicParameters> = {}
  ): Promise<TechnoEconomicResult> {
    try {
      // Convert load profile data to analysis parameters
      const systemSize = loadProfileData.peakDemand * 1.3; // 130% of peak demand
      const batteryCapacity = loadProfileData.dailyConsumption * 1.2; // 120% of daily consumption
      
      const mergedParams = { ...this.DEFAULT_PARAMETERS, ...parameters };
      
      const pvInitialCost = methodology === 'perWatt' 
        ? systemSize * 1000 * (mergedParams.panelCostPerWatt || 0.4)
        : (systemSize * (mergedParams.panelCostPerKw || 400)) + 
          (batteryCapacity * (mergedParams.batteryCostPerKwh || 300)) +
          (systemSize * (mergedParams.inverterCostPerKw || 300)) +
          (systemSize * (mergedParams.structureCostPerKw || 150)) +
          (mergedParams.fixedCosts || 0);
      
      const pvAnnualMaintenance = systemSize * 50; // $50/kW/year
      const pvLifecycleCost = pvInitialCost + (pvAnnualMaintenance * mergedParams.projectLifetime);
      
      // Diesel comparison
      const dieselInitialCost = loadProfileData.peakDemand * 800; // $800/kW for diesel generator
      const dieselAnnualMaintenance = loadProfileData.annualConsumption * 0.25; // $0.25/kWh for diesel + maintenance
      const dieselLifecycleCost = dieselInitialCost + (dieselAnnualMaintenance * mergedParams.projectLifetime);
      
      // Calculate NPV and IRR
      const annualSavings = dieselAnnualMaintenance - pvAnnualMaintenance;
      const pvNpv = this.calculateNPV(pvInitialCost, annualSavings, mergedParams.discountRate, mergedParams.projectLifetime);
      const pvIrr = this.calculateIRR(pvInitialCost, annualSavings, mergedParams.projectLifetime);
      
      return {
        pv: {
          initialCost: Math.round(pvInitialCost),
          annualMaintenance: Math.round(pvAnnualMaintenance),
          lifecycleCost: Math.round(pvLifecycleCost),
          npv: Math.round(pvNpv),
          irr: Math.round(pvIrr * 10000) / 10000,
          systemSize: Math.round(systemSize * 100) / 100,
          batteryCapacity: Math.round(batteryCapacity * 100) / 100,
          costingMethod: methodology,
          panelCostPerWatt: mergedParams.panelCostPerWatt,
          panelCostPerKw: mergedParams.panelCostPerKw,
          batteryCostPerKwh: mergedParams.batteryCostPerKwh,
          inverterCostPerKw: mergedParams.inverterCostPerKw,
          structureCostPerKw: mergedParams.structureCostPerKw,
          fixedCosts: mergedParams.fixedCosts
        },
        diesel: {
          initialCost: Math.round(dieselInitialCost),
          annualMaintenance: Math.round(dieselAnnualMaintenance),
          lifecycleCost: Math.round(dieselLifecycleCost),
          npv: Math.round(-pvNpv), // Negative of PV NPV
          irr: -0.02 // Negative IRR for diesel
        }
      };
    } catch (error) {
      console.error('Load profile analysis failed:', error);
      throw error;
    }
  }

  private static calculateNPV(initialCost: number, annualCashFlow: number, discountRate: number, years: number): number {
    let npv = -initialCost;
    for (let year = 1; year <= years; year++) {
      npv += annualCashFlow / Math.pow(1 + discountRate, year);
    }
    return npv;
  }

  private static calculateIRR(initialCost: number, annualCashFlow: number, years: number): number {
    // Simple IRR approximation using Newton-Raphson method
    let irr = 0.1; // Initial guess
    for (let i = 0; i < 100; i++) {
      let npv = -initialCost;
      let derivative = 0;
      for (let year = 1; year <= years; year++) {
        const discountFactor = Math.pow(1 + irr, year);
        npv += annualCashFlow / discountFactor;
        derivative -= (year * annualCashFlow) / (discountFactor * (1 + irr));
      }
      const newIrr = irr - npv / derivative;
      if (Math.abs(newIrr - irr) < 0.0001) {
        return newIrr;
      }
      irr = newIrr;
    }
    return irr;
  }
}

export default TechnoEconomicService;
export { TechnoEconomicService };
export type { TechnoEconomicParameters, CostingMethodology, LoadProfile, TechnoEconomicResult };
