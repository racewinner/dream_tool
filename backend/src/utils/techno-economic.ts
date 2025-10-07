export interface EnergyData {
  dailyUsage: number;
  peakHours: number;
  equipment: Array<{ 
    name: string; 
    power: number; 
    hours: number; 
    efficiency: number;
    critical: boolean;
  }>;
  latitude: number;
  longitude: number;
  location: string;
  solarPanelEfficiency: number;
  batteryEfficiency: number;
  gridAvailability: number;
}

export interface CostAnalysis {
  pv: {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    npv: number;
    irr: number;
    energyProduction: {
      yearly: number;
      monthly: number[];
      seasonal: {
        winter: number;
        spring: number;
        summer: number;
        fall: number;
      };
    };
    environmentalImpact: {
      co2Reduction: number;
      waterSaved: number;
      landRequired: number;
    };
  };
  diesel: {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    npv: number;
    irr: number;
    fuelConsumption: {
      yearly: number;
      monthly: number[];
      seasonal: {
        winter: number;
        spring: number;
        summer: number;
        fall: number;
      };
    };
    environmentalImpact: {
      co2Emissions: number;
      noisePollution: number;
      maintenanceWaste: number;
    };
  };
}

export class TechnoEconomicAssessment {
  private readonly pvPanelCostPerWatt: number = 0.30; // $/W
  private readonly batteryCostPerWh: number = 0.20; // $/Wh
  private readonly inverterCostPerWatt: number = 0.15; // $/W
  private readonly dieselGeneratorCostPerKw: number = 500; // $/kW
  private readonly dieselFuelCostPerL: number = 1.50; // $/L
  private readonly dieselConsumptionPerKwh: number = 0.3; // L/kWh
  private readonly discountRate: number = 0.12; // 12% annual discount rate
  private readonly projectLifetime: number = 20; // years
  private readonly solarHoursPerDay: number = 4; // Average peak sun hours
  private readonly seasonalFactors: { [key: string]: number } = {
    winter: 0.8,
    spring: 1.0,
    summer: 1.2,
    fall: 1.1,
  };

  constructor(private readonly energyData: EnergyData) {}

  private calculateRadiationFactor(season: string): number {
    return this.seasonalFactors[season];
  }

  private calculatePVSystemSize(): number {
    // Calculate PV system size based on daily usage, peak hours, and equipment efficiency
    const totalPower = this.energyData.equipment.reduce((sum, eq) => 
      sum + (eq.power * eq.hours * eq.efficiency),
      0
    );
    
    const dailyPeakPower = totalPower / this.energyData.peakHours;
    const systemSize = dailyPeakPower / (this.energyData.solarPanelEfficiency * 0.85); // 85% system efficiency
    
    return Math.ceil(systemSize * 1.2); // Add 20% safety margin
  }

  private calculateBatteryCapacity(): number {
    // Calculate battery capacity for 24-hour backup with efficiency considerations
    const totalDailyEnergy = this.energyData.equipment.reduce((sum, eq) => 
      sum + (eq.power * eq.hours * eq.efficiency),
      0
    );
    
    return (totalDailyEnergy / this.energyData.batteryEfficiency) * 1.1; // Add 10% safety margin
  }

  private calculateEnergyProduction(): {
    yearly: number;
    monthly: number[];
    seasonal: {
      winter: number;
      spring: number;
      summer: number;
      fall: number;
    };
  } {
    const systemSize = this.calculatePVSystemSize();
    const monthlyProduction = Array(12).fill(0).map((_, month) => {
      const season = Math.floor(month / 3);
      const seasonalFactor = Object.values(this.seasonalFactors)[season];
      
      return systemSize * 1000 * this.solarHoursPerDay * 30 * seasonalFactor;
    });
    
    const yearlyProduction = monthlyProduction.reduce((sum, prod) => sum + prod, 0);
    
    const seasonalProduction = {
      winter: monthlyProduction.slice(0, 3).reduce((sum, prod) => sum + prod, 0),
      spring: monthlyProduction.slice(3, 6).reduce((sum, prod) => sum + prod, 0),
      summer: monthlyProduction.slice(6, 9).reduce((sum, prod) => sum + prod, 0),
      fall: monthlyProduction.slice(9).reduce((sum, prod) => sum + prod, 0),
    };

    return {
      yearly: yearlyProduction,
      monthly: monthlyProduction,
      seasonal: seasonalProduction,
    };
  }

  private calculateEnvironmentalImpact(energyProduction: number): {
    co2Reduction: number;
    waterSaved: number;
    landRequired: number;
  } {
    return {
      co2Reduction: energyProduction * 0.5, // kg CO2 per kWh saved
      waterSaved: energyProduction * 0.001, // m3 per kWh saved
      landRequired: energyProduction * 0.0001, // m2 per kWh, assuming 10W/m2
    };
  }

  private calculatePVCosts(): {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    energyProduction: {
      yearly: number;
      monthly: number[];
      seasonal: {
        winter: number;
        spring: number;
        summer: number;
        fall: number;
      };
    };
    environmentalImpact: {
      co2Reduction: number;
      waterSaved: number;
      landRequired: number;
    };
  } {
    const systemSize = this.calculatePVSystemSize();
    const batteryCapacity = this.calculateBatteryCapacity();
    const energyProduction = this.calculateEnergyProduction();

    const initialCost =
      systemSize * 1000 * this.pvPanelCostPerWatt + // PV panels
      batteryCapacity * this.batteryCostPerWh + // Batteries
      systemSize * 1000 * this.inverterCostPerWatt; // Inverter

    const annualMaintenance = initialCost * 0.02; // 2% annual maintenance

    let lifecycleCost = 0;
    for (let year = 1; year <= this.projectLifetime; year++) {
      lifecycleCost += initialCost / Math.pow(1 + this.discountRate, year);
      lifecycleCost += annualMaintenance / Math.pow(1 + this.discountRate, year);
    }

    const environmentalImpact = this.calculateEnvironmentalImpact(energyProduction.yearly);

    return {
      initialCost,
      annualMaintenance,
      lifecycleCost,
      energyProduction,
      environmentalImpact,
    };
  }

  private calculateDieselCosts(): {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    fuelConsumption: {
      yearly: number;
      monthly: number[];
      seasonal: {
        winter: number;
        spring: number;
        summer: number;
        fall: number;
      };
    };
    environmentalImpact: {
      co2Emissions: number;
      noisePollution: number;
      maintenanceWaste: number;
    };
  } {
    const systemSize = this.energyData.dailyUsage / 24; // kW
    const initialCost = systemSize * this.dieselGeneratorCostPerKw;

    // Calculate annual fuel consumption with seasonal variations
    const monthlyConsumption = Array(12).fill(0).map((_, month) => {
      const season = Math.floor(month / 3);
      const seasonalFactor = Object.values(this.seasonalFactors)[season];
      
      return this.energyData.dailyUsage * 30 * seasonalFactor;
    });
    
    const yearlyConsumption = monthlyConsumption.reduce((sum, cons) => sum + cons, 0);
    
    const monthlyFuel = monthlyConsumption.map(cons => 
      cons * this.dieselConsumptionPerKwh
    );
    const yearlyFuel = yearlyConsumption * this.dieselConsumptionPerKwh;
    
    const annualFuelCost = yearlyFuel * this.dieselFuelCostPerL;
    const annualMaintenance = initialCost * 0.05; // 5% annual maintenance

    let lifecycleCost = 0;
    for (let year = 1; year <= this.projectLifetime; year++) {
      lifecycleCost += initialCost / Math.pow(1 + this.discountRate, year);
      lifecycleCost += (annualFuelCost + annualMaintenance) / Math.pow(1 + this.discountRate, year);
    }

    const environmentalImpact = {
      co2Emissions: yearlyFuel * 2.68, // kg CO2 per L diesel
      noisePollution: yearlyConsumption * 0.0001, // dB per kWh
      maintenanceWaste: yearlyConsumption * 0.00001, // kg waste per kWh
    };

    return {
      initialCost,
      annualMaintenance,
      lifecycleCost,
      fuelConsumption: {
        yearly: yearlyFuel,
        monthly: monthlyFuel,
        seasonal: {
          winter: monthlyFuel.slice(0, 3).reduce((sum, fuel) => sum + fuel, 0),
          spring: monthlyFuel.slice(3, 6).reduce((sum, fuel) => sum + fuel, 0),
          summer: monthlyFuel.slice(6, 9).reduce((sum, fuel) => sum + fuel, 0),
          fall: monthlyFuel.slice(9).reduce((sum, fuel) => sum + fuel, 0),
        },
      },
      environmentalImpact,
    };
  }

  public analyze(): CostAnalysis {
    const pvData = this.calculatePVCosts();
    const dieselData = this.calculateDieselCosts();

    // Calculate cash flows for both systems
    const pvCashFlows = [-pvData.initialCost];
    const dieselCashFlows = [-dieselData.initialCost];

    for (let year = 1; year <= this.projectLifetime; year++) {
      pvCashFlows.push(-pvData.annualMaintenance);
      dieselCashFlows.push(-dieselData.annualMaintenance);
    }

    // Calculate NPV and IRR for both systems
    const pvNPV = this.calculateNPV(pvCashFlows, this.discountRate);
    const dieselNPV = this.calculateNPV(dieselCashFlows, this.discountRate);

    const pvIRR = this.newtonRaphson(pvCashFlows);
    const dieselIRR = this.newtonRaphson(dieselCashFlows);

    return {
      pv: {
        ...pvData,
        npv: pvNPV,
        irr: pvIRR,
      },
      diesel: {
        ...dieselData,
        npv: dieselNPV,
        irr: dieselIRR,
      },
    };
  }

  // Helper function for IRR calculation using Newton-Raphson method
  private newtonRaphson(cashFlows: number[], maxIterations = 100, tolerance = 1e-6): number {
    let rate = 0.1; // Initial guess
    let iteration = 0;
    let error = tolerance + 1;

    while (error > tolerance && iteration < maxIterations) {
      const npv = this.calculateNPV(cashFlows, rate);
      const npvPrime = this.calculateNPVPrime(cashFlows, rate);
      const rateNew = rate - npv / npvPrime;
      error = Math.abs(rateNew - rate);
      rate = rateNew;
      iteration++;
    }

    return rate;
  }

  private calculateNPV(cashFlows: number[], rate: number): number {
    return cashFlows.reduce((sum, cashFlow, t) => sum + cashFlow / Math.pow(1 + rate, t), 0);
  }

  private calculateNPVPrime(cashFlows: number[], rate: number): number {
    return cashFlows.reduce((sum, cashFlow, t) => 
      sum - (t * cashFlow) / Math.pow(1 + rate, t + 1),
      0
    );
  }
}

export default TechnoEconomicAssessment;
