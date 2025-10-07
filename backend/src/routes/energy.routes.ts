import express from 'express';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import EnergyModelingService from '../services/energyModelingService';
import { LoadProfileRequest, LoadProfileResponse, EnergyAnalysisRequest, EnergyAnalysisResponse } from '../types/energy';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all energy routes
router.use(authenticate);

/**
 * POST /api/energy/load-profile
 * Generate load profile from equipment list
 */
router.post('/load-profile', [
  body('equipment').isArray().withMessage('Equipment must be an array'),
  body('equipment.*.name').notEmpty().withMessage('Equipment name is required'),
  body('equipment.*.powerRating').isNumeric().withMessage('Power rating must be numeric'),
  body('equipment.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer')
], async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { equipment, facilityData, options } = req.body as LoadProfileRequest;

    console.log(`🔋 Generating load profile for ${equipment.length} equipment items`);

    // Generate load profile using backend service
    const loadProfile = EnergyModelingService.generateLoadProfile(equipment, options);
    
    // Calculate summary metrics
    const peakDemand = Math.max(...loadProfile.map(h => h.demand));
    const dailyConsumption = loadProfile.reduce((sum, hour) => sum + hour.demand, 0);
    const annualConsumption = dailyConsumption * 365;

    const response: LoadProfileResponse = {
      loadProfile,
      peakDemand,
      dailyConsumption,
      annualConsumption,
      metadata: {
        calculatedAt: new Date(),
        options: options || {},
        version: '1.0.0'
      }
    };

    console.log(`✅ Load profile generated: Peak ${peakDemand.toFixed(2)}kW, Daily ${dailyConsumption.toFixed(2)}kWh`);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error generating load profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate load profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/energy/demand-analysis
 * Perform comprehensive energy demand analysis
 */
router.post('/demand-analysis', [
  body('facilityData').isObject().withMessage('Facility data is required'),
  body('facilityData.name').notEmpty().withMessage('Facility name is required'),
  body('facilityData.equipment').isArray().withMessage('Equipment list is required')
], async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { facilityData, scenarioType, options } = req.body as EnergyAnalysisRequest;

    console.log(`🏥 Performing energy analysis for facility: ${facilityData.name}`);

    // Perform comprehensive energy analysis
    const analysisResult = EnergyModelingService.calculateEnergyDemand(facilityData);

    // Create energy scenario
    const scenario = {
      id: `scenario_${Date.now()}`,
      name: `${scenarioType || 'current'}_${facilityData.name}`,
      type: scenarioType || 'current' as 'current' | 'ideal' | 'optimized',
      facilityData,
      loadProfile: analysisResult.loadProfile,
      energyDemand: {
        peakDemand: analysisResult.peakDemand,
        dailyConsumption: analysisResult.dailyConsumption,
        annualConsumption: analysisResult.annualConsumption,
        loadFactor: analysisResult.dailyConsumption / (analysisResult.peakDemand * 24),
        diversityFactor: 0.8 // Typical diversity factor
      },
      createdAt: new Date()
    };

    // System sizing recommendations
    const systemSizing = {
      pvSystemSize: analysisResult.peakDemand * 1.3, // 130% of peak demand
      batteryCapacity: analysisResult.dailyConsumption * 1.2, // 120% of daily consumption
      inverterSize: analysisResult.peakDemand * 1.1, // 110% of peak demand
      safetyMargin: 1.2,
      systemEfficiency: 0.85
    };

    const response: EnergyAnalysisResponse = {
      analysis: {
        scenario,
        systemSizing,
        recommendations: analysisResult.recommendations,
        carbonFootprint: {
          current: analysisResult.annualConsumption * 0.8, // kg CO2/kWh for diesel
          withPV: analysisResult.annualConsumption * 0.1, // kg CO2/kWh for PV (manufacturing)
          reduction: analysisResult.annualConsumption * 0.7 // Net reduction
        }
      },
      systemSizing,
      recommendations: analysisResult.recommendations
    };

    console.log(`✅ Energy analysis completed for ${facilityData.name}`);
    console.log(`📊 Peak: ${analysisResult.peakDemand.toFixed(2)}kW, Annual: ${analysisResult.annualConsumption.toFixed(0)}kWh`);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error performing energy analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform energy analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/energy/survey-scenario
 * Generate energy scenario from survey data
 */
router.post('/survey-scenario', [
  body('surveyData').isObject().withMessage('Survey data is required'),
  body('surveyData.facilityData').isObject().withMessage('Facility data in survey is required')
], async (req: Request, res: Response) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { surveyData } = req.body;

    console.log(`📋 Generating energy scenario from survey data for: ${surveyData.facilityData?.name || 'Unknown'}`);

    // Generate current scenario from survey
    const analysisResult = EnergyModelingService.generateCurrentScenarioFromSurvey(surveyData);

    // Create response similar to demand-analysis
    const scenario = {
      id: `survey_scenario_${Date.now()}`,
      name: `Current - ${surveyData.facilityData?.name || 'Unknown Facility'}`,
      type: 'current' as const,
      facilityId: surveyData.id,
      facilityData: {
        name: surveyData.facilityData?.name || 'Unknown Facility',
        facilityType: surveyData.facilityData?.facilityType || 'health_clinic',
        location: {
          latitude: surveyData.facilityData?.latitude || 0,
          longitude: surveyData.facilityData?.longitude || 0
        },
        equipment: [], // Will be populated from survey
        operationalHours: surveyData.facilityData?.operationalHours || 12,
        staffCount: surveyData.facilityData?.staffCount || 5
      },
      loadProfile: analysisResult.loadProfile,
      energyDemand: {
        peakDemand: analysisResult.peakDemand,
        dailyConsumption: analysisResult.dailyConsumption,
        annualConsumption: analysisResult.annualConsumption,
        loadFactor: analysisResult.dailyConsumption / (analysisResult.peakDemand * 24),
        diversityFactor: 0.8
      },
      createdAt: new Date()
    };

    console.log(`✅ Survey scenario generated: Peak ${analysisResult.peakDemand.toFixed(2)}kW`);

    res.json({
      success: true,
      data: {
        scenario,
        analysis: analysisResult,
        recommendations: analysisResult.recommendations
      }
    });

  } catch (error) {
    console.error('❌ Error generating survey scenario:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate survey scenario',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/energy/equipment-database
 * Get equipment database for load profile generation
 */
router.get('/equipment-database', async (req: Request, res: Response) => {
  try {
    const { category, facilityType } = req.query;

    console.log(`📚 Fetching equipment database - Category: ${category}, Facility: ${facilityType}`);

    // Mock equipment database - in production this would come from database
    const equipmentDatabase = [
      {
        id: 'led_bulb_20w',
        name: 'LED Bulb 20W',
        category: 'lighting',
        powerRating: { min: 15, max: 25, typical: 20 },
        efficiency: { min: 0.85, max: 0.95, typical: 0.9 },
        operatingHours: { min: 8, max: 16, typical: 12 },
        cost: { min: 10, max: 30, typical: 20 },
        facilityTypes: ['health_clinic', 'hospital', 'health_post']
      },
      {
        id: 'medical_refrigerator',
        name: 'Medical Refrigerator',
        category: 'medical',
        powerRating: { min: 100, max: 200, typical: 150 },
        efficiency: { min: 0.7, max: 0.9, typical: 0.8 },
        operatingHours: { min: 24, max: 24, typical: 24 },
        cost: { min: 800, max: 1500, typical: 1200 },
        facilityTypes: ['health_clinic', 'hospital']
      },
      {
        id: 'ceiling_fan',
        name: 'Ceiling Fan',
        category: 'cooling',
        powerRating: { min: 60, max: 90, typical: 75 },
        efficiency: { min: 0.8, max: 0.9, typical: 0.85 },
        operatingHours: { min: 8, max: 16, typical: 12 },
        cost: { min: 50, max: 150, typical: 100 },
        facilityTypes: ['health_clinic', 'hospital', 'health_post']
      }
    ];

    // Filter by category and facility type if provided
    let filteredEquipment = equipmentDatabase;
    
    if (category) {
      filteredEquipment = filteredEquipment.filter(eq => eq.category === category);
    }
    
    if (facilityType) {
      filteredEquipment = filteredEquipment.filter(eq => 
        eq.facilityTypes.includes(facilityType as string)
      );
    }

    res.json({
      success: true,
      data: {
        equipment: filteredEquipment,
        totalCount: filteredEquipment.length,
        categories: ['medical', 'lighting', 'cooling', 'computing', 'kitchen', 'other'],
        facilityTypes: ['health_clinic', 'hospital', 'health_post']
      }
    });

  } catch (error) {
    console.error('❌ Error fetching equipment database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/energy/benchmarks/:facilityType
 * Get energy benchmarks for facility type
 */
router.get('/benchmarks/:facilityType', async (req: Request, res: Response) => {
  try {
    const { facilityType } = req.params;
    const { region } = req.query;

    console.log(`📈 Fetching energy benchmarks for ${facilityType} in ${region || 'all regions'}`);

    // Mock benchmark data - in production this would come from database
    const benchmarks = {
      health_clinic: {
        energyIntensity: {
          perArea: 120, // kWh/m²/year
          perBed: 2500, // kWh/bed/year
          perPatient: 15 // kWh/patient/year
        },
        loadProfile: {
          peakHour: 14, // 2 PM
          baseLoad: 0.3, // 30% of peak
          loadFactor: 0.6
        },
        equipmentMix: {
          lighting: 0.25,
          medical: 0.35,
          cooling: 0.20,
          computing: 0.10,
          other: 0.10
        }
      },
      hospital: {
        energyIntensity: {
          perArea: 200,
          perBed: 4000,
          perPatient: 25
        },
        loadProfile: {
          peakHour: 15,
          baseLoad: 0.5,
          loadFactor: 0.7
        },
        equipmentMix: {
          lighting: 0.20,
          medical: 0.45,
          cooling: 0.15,
          computing: 0.15,
          other: 0.05
        }
      }
    };

    const benchmark = benchmarks[facilityType as keyof typeof benchmarks];

    if (!benchmark) {
      return res.status(404).json({
        success: false,
        message: `No benchmarks found for facility type: ${facilityType}`
      });
    }

    res.json({
      success: true,
      data: {
        facilityType,
        region: region || 'global',
        benchmark,
        source: 'DREAM Tool Database',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching benchmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch benchmarks',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
