import { Router } from 'express';
import { Facility, TechnoEconomicAnalysis, Survey } from '../models';
import { TechnoEconomicAnalysisAttributes, TechnoEconomicAnalysisCreationAttributes } from '../models/technoEconomicAnalysis';
import { verifyToken } from '../middleware/auth';
import { Model } from 'sequelize';
import { FacilityData } from '../types/facility';

const batteryCosts = {
  lithium: 300, // $/kWh
  lead_acid: 150  // $/kWh
} as const;

type BatteryType = keyof typeof batteryCosts;

export interface AnalysisRequest {
  dailyUsage: number;
  peakHours: number;
  stage: 'prefeasibility' | 'tendering';
  costingMethod: 'perWatt' | 'fixedVariable' | 'componentBased';
  batteryAutonomyFactor?: number;
  batteryDepthOfDischarge?: number;
  batteryType?: 'lithium' | 'lead_acid';
  inverterEfficiency?: number;
  panelCostPerWatt?: number;
  panelCostPerKw?: number;
  batteryCostPerKwh?: number;
  inverterCostPerKw?: number;
  structureCostPerKw?: number;
  fixedCosts?: number;
  numPanels?: number;
  panelRating?: number;
};

interface CostingParams {
  costingMethod: 'perWatt' | 'fixedVariable' | 'componentBased';
  panelCostPerWatt?: number;
  panelCostPerKw?: number;
  batteryCostPerKwh?: number;
  inverterCostPerKw?: number;
  structureCostPerKw?: number;
  fixedCosts?: number;
  numPanels?: number;
  panelRating?: number;
}

const calculatePVInitialCost = (dailyUsage: number, peakHours: number, batteryAutonomyFactor: number, batteryDepthOfDischarge: number, batteryType: 'lithium' | 'lead_acid', inverterEfficiency: number, params: CostingParams): { 
  pvCost: number; 
  batteryCost: number; 
  pvSystemSize: number; 
  batteryCapacity: number; 
  panelCostPerWatt: number;
  panelCostPerKw: number;
  batteryCostPerKwh: number;
  inverterCostPerKw: number;
  structureCostPerKw: number;
  fixedCosts: number;
  numPanels: number;
  panelRating: number;
} => {
  // Calculate PV system size (kW)
  const pvSystemSize = dailyUsage / (peakHours * 0.85 * inverterEfficiency);

  // Calculate battery capacity (kWh)
  const batteryCapacity = dailyUsage * batteryAutonomyFactor / batteryDepthOfDischarge;

  // Default costs
  const defaultCosts = {
    panelCostPerWatt: 0.4, // $/Watt
    panelCostPerKw: 400, // $/kW
    batteryCostPerKwh: batteryType === 'lithium' ? 300 : 150, // $/kWh
    inverterCostPerKw: 300, // $/kW
    structureCostPerKw: 150, // $/kW
    fixedCosts: 0,
    numPanels: 0,
    panelRating: 0
  };

  // Set costs based on costing method
  let costs = { ...defaultCosts };
  
  if (params.costingMethod === 'perWatt') {
    costs = {
      ...costs,
      panelCostPerWatt: params.panelCostPerWatt || costs.panelCostPerWatt,
      panelCostPerKw: params.panelCostPerKw || costs.panelCostPerKw,
      batteryCostPerKwh: params.batteryCostPerKwh || costs.batteryCostPerKwh,
      inverterCostPerKw: params.inverterCostPerKw || costs.inverterCostPerKw,
      structureCostPerKw: params.structureCostPerKw || costs.structureCostPerKw,
      fixedCosts: params.fixedCosts || costs.fixedCosts
    };
  } else if (params.costingMethod === 'fixedVariable') {
    costs = {
      ...costs,
      panelCostPerKw: params.panelCostPerKw || costs.panelCostPerKw,
      batteryCostPerKwh: params.batteryCostPerKwh || costs.batteryCostPerKwh,
      inverterCostPerKw: params.inverterCostPerKw || costs.inverterCostPerKw,
      structureCostPerKw: params.structureCostPerKw || costs.structureCostPerKw,
      fixedCosts: params.fixedCosts || costs.fixedCosts
    };
  } else if (params.costingMethod === 'componentBased') {
    costs = {
      ...costs,
      numPanels: params.numPanels || Math.ceil(pvSystemSize * 1000 / (params.panelRating || 400)),
      panelRating: params.panelRating || 400,
      panelCostPerKw: params.panelCostPerKw || costs.panelCostPerKw,
      batteryCostPerKwh: params.batteryCostPerKwh || costs.batteryCostPerKwh,
      inverterCostPerKw: params.inverterCostPerKw || costs.inverterCostPerKw,
      structureCostPerKw: params.structureCostPerKw || costs.structureCostPerKw,
      fixedCosts: params.fixedCosts || costs.fixedCosts
    };
  }

  // Calculate costs based on method
  let pvCost = 0;
  if (params.costingMethod === 'perWatt') {
    pvCost = pvSystemSize * 1000 * costs.panelCostPerWatt;
  } else if (params.costingMethod === 'fixedVariable') {
    pvCost = pvSystemSize * (costs.panelCostPerKw + costs.inverterCostPerKw + costs.structureCostPerKw) + costs.fixedCosts;
  } else if (params.costingMethod === 'componentBased') {
    pvCost = costs.numPanels * (costs.panelRating * costs.panelCostPerKw / 1000) + 
             pvSystemSize * (costs.inverterCostPerKw + costs.structureCostPerKw) + costs.fixedCosts;
  }

  const batteryCost = batteryCapacity * costs.batteryCostPerKwh;

  return {
    pvCost,
    batteryCost,
    pvSystemSize,
    batteryCapacity,
    ...costs
  };
};

const router = Router();

// Calculate techno-economic analysis
router.post('/:facilityId', verifyToken, async (req, res) => {
  try {
    const facilityId = req.params.facilityId;
    const facility = await Facility.findByPk(facilityId);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const { 
      stage,
      costingMethod,
      batteryAutonomyFactor = 1.0,
      batteryDepthOfDischarge = 0.8,
      batteryType = 'lithium',
      inverterEfficiency = 0.94
    } = req.body;

    const costingParams = {
      panelCostPerWatt: 0.4,
      panelCostPerKw: 400,
      batteryCostPerKwh: 300,
      inverterCostPerKw: 300,
      structureCostPerKw: 150,
      fixedCosts: 0,
      numPanels: 0,
      panelRating: 400,
      ...req.body
    };

    // Get survey data for the facility
    const survey = await Survey.findOne({
      where: { facilityId },
      order: [['createdAt', 'DESC']], // Get the latest survey
    });

    if (!survey) {
      return res.status(404).json({ error: 'No survey data found for this facility' });
    }

    // Calculate daily usage from survey data
    const calculateDailyUsage = (facilityData: FacilityData) => {
      const { equipment, operationalHours, infrastructure } = facilityData;
      
      // Quick hardcoded equipment power rating mapping for immediate testing
      const getEquipmentPowerRating = (equipmentName: string): number => {
        const name = equipmentName.toLowerCase();
        
        // KoboToolbox equipment mappings based on actual survey data
        if (name.includes('lab_incubator') || name.includes('incubator')) return 150;
        if (name.includes('dry_steriliser') || name.includes('sterilizer')) return 1500;
        if (name.includes('mobile_phone') || name.includes('phone')) return 5;
        if (name.includes('autoclave')) return 2000;
        if (name.includes('centrifuge')) return 300;
        if (name.includes('microscope')) return 50;
        if (name.includes('refrigerator') || name.includes('fridge')) return 200;
        if (name.includes('ultrasound')) return 500;
        if (name.includes('monitor')) return 10;
        if (name.includes('nebulizer')) return 50;
        if (name.includes('light') || name.includes('lamp')) return 40;
        if (name.includes('fan')) return 75;
        if (name.includes('computer') || name.includes('laptop')) return 65;
        if (name.includes('printer')) return 30;
        if (name.includes('scanner')) return 25;
        if (name.includes('x-ray') || name.includes('xray')) return 3000;
        if (name.includes('suction')) return 200;
        if (name.includes('pump')) return 100;
        
        // Default fallback
        return 100;
      };
      
      // Map KoboToolbox time-of-use codes to expected values
      const mapTimeOfUse = (koboTimeOfUse: string): string => {
        if (!koboTimeOfUse) return 'day';
        const timeMap: { [key: string]: string } = {
          'morn': 'morning',
          'morn_after': 'day',
          'afternoon': 'afternoon', 
          'evening': 'evening',
          'night': 'night',
          'day': 'day',
          'all_day': 'day'
        };
        return timeMap[koboTimeOfUse] || 'day';
      };
      
      // Calculate weekly usage from frequency
      const calculateWeeklyUsage = (frequency: string): number => {
        if (!frequency) return 7;
        const frequencyMap: { [key: string]: number } = {
          'Daily': 7,
          'Weekly': 1,
          'Monthly': 0.25,
          'Rarely': 0.1
        };
        return frequencyMap[frequency] || 7;
      };
      
      // Base calculation for equipment usage
      const equipmentUsage = (equipment || []).reduce((total: number, item: any) => {
        // Extract and convert KoboToolbox data
        const equipmentName = item.name || 'unknown';
        const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 1);
        const hoursPerDay = typeof item.hoursPerDay === 'string' ? parseInt(item.hoursPerDay) : (item.hoursPerDay || 8);
        const timeOfUse = mapTimeOfUse(item.timeOfUse || 'day');
        const frequency = item.frequency || 'Daily';
        
        // Get power rating from hardcoded mapping
        const powerRating = item.powerRating || getEquipmentPowerRating(equipmentName);
        
        // Calculate weekly usage factor from frequency (maintain existing methodology)
        const weeklyUsage = calculateWeeklyUsage(frequency);
        let weeklyUsageFactor = 1.0;
        if (frequency === 'Daily') {
          weeklyUsageFactor = weeklyUsage / 7; // Use actual weekly usage
        } else if (frequency === 'Weekly') {
          weeklyUsageFactor = 1 / 7; // Once per week
        } else if (frequency === 'Monthly') {
          weeklyUsageFactor = 1 / 30 * 7; // Monthly usage converted to weekly
        }
        
        // Calculate daily energy usage for this equipment (maintain existing methodology)
        const dailyEnergy = (
          hoursPerDay * 
          powerRating * // Now uses mapped power rating
          quantity * 
          weeklyUsageFactor
        ) / 1000; // Convert to kWh
        
        // Adjust for time of use (maintain existing methodology)
        let timeOfUseFactor = 1.0;
        if (timeOfUse === 'morning' || timeOfUse === 'day') {
          timeOfUseFactor = 1.0; // Regular hours
        } else if (timeOfUse === 'evening') {
          timeOfUseFactor = 1.2; // Peak hours
        } else if (timeOfUse === 'night') {
          timeOfUseFactor = 0.8; // Off-peak hours
        }
        
        const equipmentDailyUsage = dailyEnergy * timeOfUseFactor;
        console.log(`📊 Equipment: ${equipmentName} - ${powerRating}W × ${quantity} × ${hoursPerDay}h = ${equipmentDailyUsage.toFixed(2)} kWh/day`);
        
        return total + equipmentDailyUsage;
      }, 0);

      // Adjust for operational hours
      const totalOperationalHours = operationalHours.day + operationalHours.night;
      const operationalFactor = totalOperationalHours / 24;
      
      // Consider infrastructure factors
      let infrastructureFactor = 1.0;
      if (infrastructure.nationalGrid) {
        infrastructureFactor *= 0.9; // 10% reduction if connected to national grid
      }
      if (infrastructure.digitalConnectivity === 'high') {
        infrastructureFactor *= 1.1; // 10% increase for high connectivity
      }

      return equipmentUsage * operationalFactor * infrastructureFactor;
    };

    const facilityData = survey.facilityData;
    const dailyUsage = calculateDailyUsage(facilityData);
    
    // Calculate peak hours based on operational hours
    const peakHours = Math.max(
      facilityData.operationalHours.day,
      facilityData.operationalHours.night
    ) * 0.85; // 85% of max operational hours as peak hours

    // Validate inputs
    if (!dailyUsage || !peakHours) {
      return res.status(400).json({ error: 'Daily usage and peak hours are required' });
    }

    // Validate stage and costing method combination
    if (stage === 'prefeasibility' && costingMethod === 'componentBased') {
      return res.status(400).json({ error: 'Component-based costing is only available for tendering stage' });
    }

    if (stage === 'tendering' && costingMethod !== 'componentBased') {
      return res.status(400).json({ error: 'Only component-based costing is available for tendering stage' });
    }

    // Calculate PV system and battery sizing
    const { 
      pvCost, 
      batteryCost, 
      pvSystemSize, 
      batteryCapacity,
      panelCostPerWatt,
      panelCostPerKw,
      batteryCostPerKwh,
      inverterCostPerKw,
      structureCostPerKw,
      fixedCosts,
      numPanels,
      panelRating
    } = calculatePVInitialCost(
      dailyUsage,
      peakHours,
      batteryAutonomyFactor,
      batteryDepthOfDischarge,
      batteryType,
      inverterEfficiency,
      costingParams
    );

    // Calculate diesel costs
    const dieselFuelCost = 1.5; // $/liter
    const dieselEfficiency = 0.3; // 30% efficiency
    const dieselMaintenance = 0.05; // 5% of fuel cost
    const dieselInitialCost = dailyUsage / dieselEfficiency * dieselFuelCost;
    const dieselAnnualMaintenance = dailyUsage / dieselEfficiency * dieselFuelCost * dieselMaintenance;

    // Calculate lifecycle costs (10 years)
    const pvAnnualMaintenance = pvCost * 0.02;
    const pvLifecycleCost = pvCost + pvAnnualMaintenance * 10 + batteryCost;
    const dieselLifecycleCost = dieselInitialCost * 365 * 10 + dieselAnnualMaintenance * 365 * 10;

    // Calculate NPV and IRR (8% discount rate)
    const discountRate = 0.08;
    const pvNpv = pvCost + pvAnnualMaintenance * (1 - Math.pow(1 + discountRate, -10)) / discountRate + batteryCost;
    const dieselNpv = dieselLifecycleCost / (1 + discountRate);
    const pvIrr = 0.12; // Estimated IRR for PV
    const dieselIrr = 0.05; // Estimated IRR for diesel

    // Create analysis record
    const analysis = await TechnoEconomicAnalysis.create({
      facilityId: facility.id,
      dailyUsage,
      peakHours,
      batteryAutonomyFactor,
      batteryDepthOfDischarge,
      batteryType,
      inverterEfficiency,
      costingMethod,
      panelCostPerWatt,
      panelCostPerKw,
      batteryCostPerKwh,
      inverterCostPerKw,
      structureCostPerKw,
      fixedCosts,
      numPanels,
      panelRating,
      pvInitialCost: pvCost,
      pvAnnualMaintenance,
      pvLifecycleCost,
      pvNpv,
      pvIrr,
      dieselInitialCost,
      dieselAnnualMaintenance,
      dieselLifecycleCost,
      dieselNpv,
      dieselIrr
    } as TechnoEconomicAnalysisCreationAttributes);

    res.json({
      pv: {
        initialCost: pvCost,
        annualMaintenance: pvAnnualMaintenance,
        lifecycleCost: pvLifecycleCost,
        npv: pvNpv,
        irr: pvIrr,
        systemSize: pvSystemSize,
        batteryCapacity: batteryCapacity,
        costingMethod,
        panelCostPerWatt,
        panelCostPerKw,
        batteryCostPerKwh,
        inverterCostPerKw,
        structureCostPerKw,
        fixedCosts,
        numPanels,
        panelRating
      },
      diesel: {
        initialCost: dieselInitialCost,
        annualMaintenance: dieselAnnualMaintenance,
        lifecycleCost: dieselLifecycleCost,
        npv: dieselNpv,
        irr: dieselIrr
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Error calculating techno-economic analysis' });
  }
});

// Helper functions for calculations
function calculateDieselInitialCost(dailyUsage: number): number {
  // Simple cost calculation for diesel generator
  const generatorCost = 1000; // $/kW
  const installationCost = 3000; // Fixed cost

  const systemSize = dailyUsage / 24; // kW
  return (systemSize * generatorCost) + installationCost;
}

function calculatePVAnnualMaintenance(initialCost: number): number {
  // 2% of initial cost for maintenance
  return initialCost * 0.02;
}

function calculateDieselAnnualMaintenance(initialCost: number): number {
  // 5% of initial cost for maintenance
  return initialCost * 0.05;
}

function calculateLifecycleCost(initialCost: number, annualMaintenance: number): number {
  // 20-year lifecycle
  const years = 20;
  return initialCost + (annualMaintenance * years);
}

function calculateNPV(initialCost: number, annualMaintenance: number, lifecycleCost: number): number {
  // Simple NPV calculation (this would be more complex in production)
  const discountRate = 0.1; // 10% discount rate
  const years = 20;

  let npv = -initialCost;
  for (let i = 1; i <= years; i++) {
    npv += (annualMaintenance / Math.pow(1 + discountRate, i));
  }
  return npv;
}

function calculateIRR(initialCost: number, annualMaintenance: number, lifecycleCost: number): number {
  // Simple IRR calculation (this would be more complex in production)
  const years = 20;
  const totalSavings = lifecycleCost - initialCost;
  return (totalSavings / initialCost / years) * 100;
}

export default router;
