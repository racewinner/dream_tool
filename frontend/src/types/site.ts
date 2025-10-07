export interface SiteData {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  energyData: {
    dailyUsage: number;
    peakHours: number;
    equipment: Array<{
      name: string;
      power: number;
      hours: number;
      efficiency: number;
      critical: boolean;
    }>;
    solarPanelEfficiency: number;
    batteryEfficiency: number;
    gridAvailability: number;
  };
  analysis: {
    pv: {
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
      financial: {
        initialCost: number;
        annualMaintenance: number;
        lifecycleCost: number;
        npv: number;
        irr: number;
      };
    };
    diesel: {
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
      financial: {
        initialCost: number;
        annualMaintenance: number;
        lifecycleCost: number;
        npv: number;
        irr: number;
      };
    };
  };
}

export interface PortfolioData {
  sites: SiteData[];
  portfolioAnalysis: {
    totalEnergyProduction: number;
    totalDieselConsumption: number;
    totalCO2Reduction: number;
    totalCO2Emissions: number;
    totalWaterSaved: number;
    totalLandRequired: number;
    totalMaintenanceWaste: number;
    averageSystemEfficiency: number;
    portfolioNPV: number;
    portfolioIRR: number;
    costSavings: number;
    paybackPeriod: number;
  };
}
