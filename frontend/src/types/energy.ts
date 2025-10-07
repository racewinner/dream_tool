export interface EnergyData {
  dailyUsage: number;  // kWh per day
  peakHours: number;   // Hours per day
  equipment: Array<{
    name: string;
    power: number;     // kW
    hours: number;     // Hours per day
  }>;
}

export interface CostAnalysis {
  pv: {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    npv: number;
    irr: number;
  };
  diesel: {
    initialCost: number;
    annualMaintenance: number;
    lifecycleCost: number;
    npv: number;
    irr: number;
  };
}
