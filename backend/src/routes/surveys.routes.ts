import { Router, Request, Response } from 'express';
import { Survey, Facility, SurveyVersion } from '../models';
import { verifyToken } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

// Interface for survey analytics data
interface SurveyAnalyticsData {
  id: number;
  externalId: string;
  facilityName: string;
  region: string;
  district: string;
  facilityType: string;
  completionDate: string;
  completeness: number;
  qualityScore: number;
  departmentCount: number;
  equipmentCount: number;
  powerSource: string;
  repeatGroups: {
    departments: any[];
    equipment: any[];
  };
}

// Get all surveys with analytics data
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching surveys for analytics dashboard...');
    
    // Get all surveys (without facility join for now to avoid association errors)
    const surveys = await Survey.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100 // Limit for performance
    });

    console.log(`📊 Found ${surveys.length} surveys`);

    // Transform surveys into analytics format
    const analyticsData: SurveyAnalyticsData[] = surveys.map((survey: any) => {
      // Access the actual facility_data JSONB column from database
      let facilityData: { [key: string]: any } = {};
      let rawData: { [key: string]: any } = {};
      
      try {
        // Handle both Python snake_case and TypeScript camelCase field names
        const facilityDataField = survey.facility_data || survey.facilityData;
        facilityData = facilityDataField ? 
          (typeof facilityDataField === 'string' ? 
            JSON.parse(facilityDataField) : 
            facilityDataField) : {};
        
        // Also check for raw_data from Python services
        const rawDataField = survey.raw_data || survey.rawData;
        if (rawDataField && (!facilityData || Object.keys(facilityData).length === 0)) {
          facilityData = typeof rawDataField === 'string' ? 
            JSON.parse(rawDataField) : rawDataField;
        }
        
        // Use facilityData as rawData since that's where KoboToolbox data is stored
        rawData = facilityData;
        
        console.log(`📊 Processing survey ${survey.id}:`, {
          hasFacilityData: !!survey.facility_data,
          hasSequelizeFacilityData: !!survey.facilityData,
          facilityDataKeys: Object.keys(facilityData).slice(0, 5),
          facilityName: rawData['general_information/Name_HF'] || 'Not found'
        });
        
      } catch (error) {
        console.warn(`Failed to parse facility data for survey ${survey.id}:`, error);
        facilityData = {};
        rawData = {};
      }
      
      // Extract repeat group data from raw survey data
      const departments = rawData.group_department || [];
      const equipment = rawData.group_electric_equipment || [];
      
      // Calculate completeness based on required fields
      const requiredFields = [
        'general_information/Name_HF',
        'general_information/Q3_Region',
        'general_information/Q9_District',
        'power_supply_quality/main_electricity'
      ];
      
      const completedFields = requiredFields.filter(field => 
        rawData[field] && rawData[field] !== '' && rawData[field] !== null
      ).length;
      
      const completeness = Math.round((completedFields / requiredFields.length) * 100);
      
      // Calculate quality score based on data consistency and completeness
      let qualityScore = completeness;
      
      // Boost quality if repeat groups are present and well-structured
      if (departments.length > 0 && equipment.length > 0) {
        qualityScore = Math.min(100, qualityScore + 10);
      }
      
      // Extract power source information
      const powerSourceMap: { [key: string]: string } = {
        '1': 'National Grid',
        '2': 'Generator',
        '3': 'Solar',
        '4': 'Battery',
        '5': 'No Power',
        '6': 'Other'
      };
      
      const powerSource = powerSourceMap[rawData['power_supply_quality/main_electricity']] || 'Unknown';

      return {
        id: survey.id,
        externalId: survey.externalId || survey.external_id || `survey_${survey.id}`,
        facilityName: rawData['general_information/Name_HF'] || 
                     rawData['facility_name'] || 
                     rawData['name'] || 
                     'Unknown Facility',
        region: rawData['general_information/Q3_Region'] || 
               rawData['region'] || 
               'Unknown',
        district: rawData['general_information/Q9_District'] || 
                 rawData['district'] || 
                 'Unknown',
        facilityType: rawData['general_information/type_healthcare_facility'] === '1' ? 'Hospital' : 
                     rawData['general_information/type_healthcare_facility'] === '2' ? 'Health Center' : 
                     rawData['general_information/type_healthcare_facility'] === '3' ? 'Health Post' :
                     rawData['facilityType'] || 'Health Post',
        completionDate: survey.createdAt.toISOString().split('T')[0],
        completeness,
        qualityScore,
        departmentCount: departments.length,
        equipmentCount: equipment.reduce((total: number, dept: any) => {
          return total + (dept['group_electric_equipment/numb_elec_equip_depart']?.length || 0);
        }, 0),
        powerSource,
        repeatGroups: {
          departments,
          equipment
        }
      };
    });

    // Calculate summary statistics
    const totalSurveys = analyticsData.length;
    const completedSurveys = analyticsData.filter(s => s.completeness >= 80).length;
    const averageCompleteness = totalSurveys > 0 ? 
      Math.round(analyticsData.reduce((sum, s) => sum + s.completeness, 0) / totalSurveys) : 0;
    const totalResponses = analyticsData.reduce((sum, s) => sum + s.departmentCount + s.equipmentCount, 0);

    const response = {
      surveys: analyticsData,
      summary: {
        totalSurveys,
        completedSurveys,
        averageCompleteness,
        totalResponses,
        lastUpdated: new Date().toISOString()
      }
    };

    console.log('📊 Survey analytics response prepared:', {
      totalSurveys: response.summary.totalSurveys,
      completedSurveys: response.summary.completedSurveys,
      averageCompleteness: response.summary.averageCompleteness
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching surveys:', error);
    res.status(500).json({ 
      error: 'Failed to fetch surveys',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get individual survey details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const surveyId = parseInt(req.params.id);
    
    if (isNaN(surveyId)) {
      return res.status(400).json({ error: 'Invalid survey ID' });
    }

    // Fetch the survey without problematic associations
    const survey = await Survey.findByPk(surveyId);

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Extract facility information from structured facilityData (only column that exists)
    // The survey table only has facilityData column (JSONB) - no raw_data or facility_data
    let facilityData: any = {};
    
    try {
      // Handle both Python snake_case and TypeScript camelCase field names
      const facilityDataField = survey.facility_data || survey.facilityData;
      const rawDataField = survey.raw_data || survey.rawData;
      
      if (facilityDataField) {
        facilityData = typeof facilityDataField === 'string' ? 
          JSON.parse(facilityDataField) : facilityDataField;
      } else if (rawDataField) {
        // Fallback to raw_data if facility_data is empty
        facilityData = typeof rawDataField === 'string' ? 
          JSON.parse(rawDataField) : rawDataField;
      }
      
      console.log('Survey detail - facilityData keys:', Object.keys(facilityData));
      console.log('Survey detail - has facility_data:', !!survey.facility_data);
      console.log('Survey detail - has raw_data:', !!survey.raw_data);
    } catch (error) {
      console.warn('Failed to parse survey data:', error);
      facilityData = {};
    }

    // Extract comprehensive facility information from facilityData only
    // facilityData contains all transformed survey data from the import service
    const facilityInfo = {
      // Basic facility information
      name: facilityData?.name || 'Unknown Facility',
      region: facilityData?.region || 'Unknown',
      district: facilityData?.district || 'Unknown', 
      facilityType: facilityData?.facilityType || facilityData?.subsectorActivities?.[0] || 'Health Post',
      
      // GPS coordinates for mapping functionality
      latitude: facilityData?.latitude || null,
      longitude: facilityData?.longitude || null,
      
      // Additional facility details
      ownership: facilityData?.ownership || null,
      electricitySource: facilityData?.electricitySource || null,
      catchmentPopulation: facilityData?.catchmentPopulation || null,
      operationalDays: facilityData?.operationalDays || null,
      numberOfBeds: facilityData?.numberOfBeds || null,
      
      // Infrastructure access
      waterAccess: facilityData?.infrastructure?.waterAccess || false,
      nationalGridAccess: facilityData?.infrastructure?.nationalGrid || false,
      transportAccess: facilityData?.infrastructure?.transportationAccess || null,
      
      // Staff information
      supportStaff: facilityData?.supportStaff || null,
      technicalStaff: facilityData?.technicalStaff || null,
      nightStaff: facilityData?.nightStaff || false,
      
      // Equipment count
      equipmentCount: Array.isArray(facilityData?.equipment) ? facilityData.equipment.length : 0,
      
      // Critical needs
      criticalNeeds: Array.isArray(facilityData?.criticalNeeds) ? facilityData.criticalNeeds : [],
      mostImportantNeed: facilityData?.mostImportantNeed || null
    };
    
    console.log('✅ Comprehensive facility info extracted:', {
      name: facilityInfo.name,
      region: facilityInfo.region,
      district: facilityInfo.district,
      facilityType: facilityInfo.facilityType,
      coordinates: facilityInfo.latitude && facilityInfo.longitude ? `${facilityInfo.latitude}, ${facilityInfo.longitude}` : 'Not available',
      equipmentCount: facilityInfo.equipmentCount
    });

    // Calculate completeness from both structured and raw data
    const countAnsweredQuestions = (data: any): number => {
      let count = 0;
      
      if (data && typeof data === 'object') {
        for (const [key, value] of Object.entries(data)) {
          if (value !== null && value !== undefined && value !== '') {
            if (typeof value === 'object' && !Array.isArray(value)) {
              count += countAnsweredQuestions(value);
            } else {
              count++;
            }
          }
        }
      }
      
      return count;
    };

    // Count from facilityData (only source available)
    const questionsAnswered = countAnsweredQuestions(facilityData);
    const completeness = questionsAnswered > 0 ? Math.round((questionsAnswered / Math.max(questionsAnswered, 100)) * 100) : 0;

    // Format the comprehensive response with all extracted data
    const surveyDetail = {
      survey: {
        id: survey.id,
        externalId: survey.externalId,
        
        // Basic facility information
        facilityName: facilityInfo.name,
        region: facilityInfo.region,
        district: facilityInfo.district,
        facilityType: facilityInfo.facilityType,
        
        // GPS coordinates for mapping
        latitude: facilityInfo.latitude,
        longitude: facilityInfo.longitude,
        
        // Additional facility details
        ownership: facilityInfo.ownership,
        electricitySource: facilityInfo.electricitySource,
        catchmentPopulation: facilityInfo.catchmentPopulation,
        operationalDays: facilityInfo.operationalDays,
        numberOfBeds: facilityInfo.numberOfBeds,
        
        // Infrastructure
        waterAccess: facilityInfo.waterAccess,
        nationalGridAccess: facilityInfo.nationalGridAccess,
        transportAccess: facilityInfo.transportAccess,
        
        // Staff information
        supportStaff: facilityInfo.supportStaff,
        technicalStaff: facilityInfo.technicalStaff,
        nightStaff: facilityInfo.nightStaff,
        
        // Equipment and needs
        equipmentCount: facilityInfo.equipmentCount,
        criticalNeeds: facilityInfo.criticalNeeds,
        mostImportantNeed: facilityInfo.mostImportantNeed,
        
        // Survey metadata
        completionDate: survey.submissionDate,
        completeness,
        questionsAnswered,
        repeatGroups: {
          departments: survey.departments || [],
          equipment: survey.equipment || []
        }
      },
      facilityData: facilityData,
      rawData: survey.raw_data || survey.rawData || facilityData || {} // CRITICAL FIX: Include rawData for frontend question display
    };

    res.json(surveyDetail);
  } catch (error) {
    console.error('Error fetching survey details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed survey data by ID
router.get('/detailed/:id', async (req: Request, res: Response) => {
  try {
    const surveyId = parseInt(req.params.id);
    
    console.log(`📊 Fetching detailed survey data for ID: ${surveyId}`);
    
    const survey = await Survey.findByPk(surveyId, {
      include: [
        {
          model: Facility,
          as: 'facility',
          attributes: ['id', 'name', 'region', 'district', 'facilityType', 'location']
        }
      ]
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const surveyData = survey as any;
    const rawData: { [key: string]: any } = surveyData.rawData || {};
    const facilityData: { [key: string]: any } = surveyData.facilityData || {};

    // Extract and structure repeat group data for detailed analysis
    const departments = rawData.group_department || [];
    const equipment = rawData.group_electric_equipment || [];
    
    // Process repeat groups for detailed visualization
    const repeatGroupAnalysis = {
      departments: departments.map((dept: any, index: number) => ({
        groupPath: `group_department[${index}]`,
        instanceCount: 1,
        completenessData: [
          { label: 'Department Type', value: dept['group_department/Which_departments_have_electri_001'] ? 100 : 0 },
          { label: 'Room Count', value: dept['group_department/rooms_number'] ? 100 : 0 },
          { label: 'Position', value: dept['group_department/department_position'] ? 100 : 0 }
        ],
        consistencyScore: Math.random() * 30 + 70, // Mock consistency score
        data: dept
      })),
      equipment: equipment.map((equip: any, index: number) => ({
        groupPath: `group_electric_equipment[${index}]`,
        instanceCount: equip['group_electric_equipment/numb_elec_equip_depart']?.length || 0,
        completenessData: [
          { label: 'Department', value: equip['group_electric_equipment/medical_department'] ? 100 : 0 },
          { label: 'Equipment Count', value: equip['group_electric_equipment/electric_equip_number'] ? 100 : 0 },
          { label: 'Equipment Details', value: equip['group_electric_equipment/numb_elec_equip_depart']?.length > 0 ? 100 : 0 }
        ],
        consistencyScore: Math.random() * 30 + 70, // Mock consistency score
        data: equip,
        nestedEquipment: equip['group_electric_equipment/numb_elec_equip_depart'] || []
      }))
    };

    const detailedResponse = {
      survey: {
        id: surveyData.id,
        externalId: surveyData.external_id,
        facilityName: rawData['general_information/Name_HF'] || 'Unknown Facility',
        region: rawData['general_information/Q3_Region'] || 'Unknown',
        district: rawData['general_information/Q9_District'] || 'Unknown',
        completionDate: surveyData.createdAt,
        rawData,
        facilityData
      },
      repeatGroups: repeatGroupAnalysis,
      facility: surveyData.facility,
      metadata: {
        totalFields: Object.keys(rawData).length,
        completedFields: Object.values(rawData).filter(v => v !== null && v !== '').length,
        departmentCount: departments.length,
        equipmentCount: equipment.length,
        lastUpdated: surveyData.updatedAt
      }
    };

    console.log(`📊 Detailed survey data prepared for ID: ${surveyId}`);
    res.json(detailedResponse);
  } catch (error) {
    console.error('❌ Error fetching survey details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch survey details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get repeat group analytics for all surveys
router.get('/analytics/repeat-groups', async (req: Request, res: Response) => {
  try {
    console.log('📊 Generating repeat group analytics...');
    
    const surveys = await Survey.findAll({
      attributes: ['id', 'rawData', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const repeatGroupAnalytics = surveys.map((survey: any) => {
      const rawData: { [key: string]: any } = survey.rawData || {};
      const departments = rawData.group_department || [];
      const equipment = rawData.group_electric_equipment || [];
      
      return {
        surveyId: survey.id,
        departmentGroups: departments.length,
        equipmentGroups: equipment.length,
        totalRepeatInstances: departments.length + equipment.reduce((sum: number, eq: any) => 
          sum + (eq['group_electric_equipment/numb_elec_equip_depart']?.length || 0), 0
        ),
        completionDate: survey.createdAt
      };
    });

    // Aggregate analytics
    const analytics = {
      totalSurveys: surveys.length,
      surveysWithRepeatGroups: repeatGroupAnalytics.filter(s => s.departmentGroups > 0 || s.equipmentGroups > 0).length,
      averageDepartmentsPerSurvey: repeatGroupAnalytics.reduce((sum, s) => sum + s.departmentGroups, 0) / surveys.length,
      averageEquipmentPerSurvey: repeatGroupAnalytics.reduce((sum, s) => sum + s.equipmentGroups, 0) / surveys.length,
      totalRepeatInstances: repeatGroupAnalytics.reduce((sum, s) => sum + s.totalRepeatInstances, 0),
      surveys: repeatGroupAnalytics
    };

    console.log('📊 Repeat group analytics generated:', analytics);
    res.json(analytics);
  } catch (error) {
    console.error('❌ Error generating repeat group analytics:', error);
    res.status(500).json({ 
      error: 'Failed to generate repeat group analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
