import { Router, Request, Response } from 'express';
import { Survey, Facility } from '../models';
import { verifyToken } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Interface for geographical analytics
interface GeographicalSite {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  facilityType: string;
  powerSource: string;
  completeness: number;
  lastSurveyDate: string;
}

// Interface for regional analytics
interface RegionalBreakdown {
  region: string;
  district: string;
  facilityCounts: {
    total: number;
    byType: { [key: string]: number };
    byPowerSource: { [key: string]: number };
  };
  dataQuality: {
    averageCompleteness: number;
    surveysComplete: number;
    totalSurveys: number;
  };
}

// Interface for equipment analytics
interface EquipmentAnalytics {
  category: string;
  totalCount: number;
  facilitiesWithEquipment: number;
  averagePerFacility: number;
  byFacilityType: { [key: string]: number };
}

// Get geographical analytics for mapping
router.get('/geographical', async (req: Request, res: Response) => {
  try {
    console.log('📍 Fetching geographical analytics for mapping...');
    
    const surveys = await Survey.findAll({
      order: [['createdAt', 'DESC']]
    });

    const sites: GeographicalSite[] = surveys.map((survey: any) => {
      // Extract facility data from survey
      let facilityData: { [key: string]: any } = {};
      let rawData: { [key: string]: any } = {};
      
      try {
        facilityData = survey.facility_data ? 
          (typeof survey.facility_data === 'string' ? 
            JSON.parse(survey.facility_data) : 
            survey.facility_data) : {};
        
        if (!facilityData || Object.keys(facilityData).length === 0) {
          facilityData = survey.facilityData || {};
        }
        
        rawData = facilityData;
      } catch (error) {
        console.warn(`Failed to parse facility data for survey ${survey.id}:`, error);
        facilityData = {};
        rawData = {};
      }

      // Extract GPS coordinates
      const latitude = facilityData.latitude || rawData['_gps_latitude'] || null;
      const longitude = facilityData.longitude || rawData['_gps_longitude'] || null;
      
      // Skip sites without GPS coordinates
      if (!latitude || !longitude) {
        return null;
      }

      // Power source mapping
      const powerSourceMap: { [key: string]: string } = {
        '1': 'National Grid',
        '2': 'Generator',
        '3': 'Solar',
        '4': 'Battery',
        '5': 'No Power',
        '6': 'Other'
      };
      
      const powerSource = powerSourceMap[rawData['power_supply_quality/main_electricity']] || 'Unknown';

      // Calculate completeness
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

      return {
        id: survey.id,
        name: rawData['general_information/Name_HF'] || 
              rawData['facility_name'] || 
              `Facility ${survey.id}`,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        region: rawData['general_information/Q3_Region'] || 'Unknown',
        district: rawData['general_information/Q9_District'] || 'Unknown',
        facilityType: rawData['general_information/type_healthcare_facility'] === '1' ? 'Hospital' : 
                     rawData['general_information/type_healthcare_facility'] === '2' ? 'Health Center' : 
                     rawData['general_information/type_healthcare_facility'] === '3' ? 'Health Post' :
                     'Health Post',
        powerSource,
        completeness,
        lastSurveyDate: survey.createdAt.toISOString().split('T')[0]
      };
    }).filter(Boolean) as GeographicalSite[];

    console.log(`📍 Found ${sites.length} sites with GPS coordinates`);

    res.json({
      success: true,
      data: {
        sites,
        summary: {
          totalSitesWithGPS: sites.length,
          regions: [...new Set(sites.map(s => s.region))].length,
          districts: [...new Set(sites.map(s => s.district))].length,
          averageCompleteness: sites.length > 0 ? 
            Math.round(sites.reduce((sum, s) => sum + s.completeness, 0) / sites.length) : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching geographical analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch geographical analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get regional breakdown analytics
router.get('/regional-breakdown', async (req: Request, res: Response) => {
  try {
    console.log('🌍 Generating regional breakdown analytics...');
    
    const surveys = await Survey.findAll({
      order: [['createdAt', 'DESC']]
    });

    const regionalData: { [key: string]: { [key: string]: any } } = {};

    surveys.forEach((survey: any) => {
      let facilityData: { [key: string]: any } = {};
      let rawData: { [key: string]: any } = {};
      
      try {
        facilityData = survey.facility_data ? 
          (typeof survey.facility_data === 'string' ? 
            JSON.parse(survey.facility_data) : 
            survey.facility_data) : {};
        
        if (!facilityData || Object.keys(facilityData).length === 0) {
          facilityData = survey.facilityData || {};
        }
        
        rawData = facilityData;
      } catch (error) {
        facilityData = {};
        rawData = {};
      }

      const region = rawData['general_information/Q3_Region'] || 'Unknown';
      const district = rawData['general_information/Q9_District'] || 'Unknown';
      const facilityType = rawData['general_information/type_healthcare_facility'] === '1' ? 'Hospital' : 
                          rawData['general_information/type_healthcare_facility'] === '2' ? 'Health Center' : 
                          rawData['general_information/type_healthcare_facility'] === '3' ? 'Health Post' :
                          'Health Post';
      
      const powerSourceMap: { [key: string]: string } = {
        '1': 'National Grid',
        '2': 'Generator', 
        '3': 'Solar',
        '4': 'Battery',
        '5': 'No Power',
        '6': 'Other'
      };
      
      const powerSource = powerSourceMap[rawData['power_supply_quality/main_electricity']] || 'Unknown';

      // Calculate completeness
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

      // Initialize regional data structure
      if (!regionalData[region]) {
        regionalData[region] = {};
      }
      
      if (!regionalData[region][district]) {
        regionalData[region][district] = {
          facilityCounts: { total: 0, byType: {}, byPowerSource: {} },
          dataQuality: { completenessSum: 0, surveysComplete: 0, totalSurveys: 0 }
        };
      }

      const districtData = regionalData[region][district];
      
      // Update counts
      districtData.facilityCounts.total += 1;
      districtData.facilityCounts.byType[facilityType] = (districtData.facilityCounts.byType[facilityType] || 0) + 1;
      districtData.facilityCounts.byPowerSource[powerSource] = (districtData.facilityCounts.byPowerSource[powerSource] || 0) + 1;
      
      // Update data quality metrics
      districtData.dataQuality.totalSurveys += 1;
      districtData.dataQuality.completenessSum += completeness;
      if (completeness >= 80) {
        districtData.dataQuality.surveysComplete += 1;
      }
    });

    // Transform to final format
    const breakdown: RegionalBreakdown[] = [];
    
    Object.entries(regionalData).forEach(([region, districts]) => {
      Object.entries(districts).forEach(([district, data]: [string, any]) => {
        breakdown.push({
          region,
          district,
          facilityCounts: data.facilityCounts,
          dataQuality: {
            averageCompleteness: data.dataQuality.totalSurveys > 0 ? 
              Math.round(data.dataQuality.completenessSum / data.dataQuality.totalSurveys) : 0,
            surveysComplete: data.dataQuality.surveysComplete,
            totalSurveys: data.dataQuality.totalSurveys
          }
        });
      });
    });

    console.log(`🌍 Generated breakdown for ${breakdown.length} district entries`);

    res.json({
      success: true,
      data: {
        breakdown,
        summary: {
          totalRegions: Object.keys(regionalData).length,
          totalDistricts: breakdown.length,
          totalFacilities: breakdown.reduce((sum, b) => sum + b.facilityCounts.total, 0),
          overallCompleteness: breakdown.length > 0 ? 
            Math.round(breakdown.reduce((sum, b) => sum + b.dataQuality.averageCompleteness, 0) / breakdown.length) : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generating regional breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate regional breakdown',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get equipment analytics
router.get('/equipment', async (req: Request, res: Response) => {
  try {
    console.log('🔧 Generating equipment analytics...');
    
    const surveys = await Survey.findAll({
      order: [['createdAt', 'DESC']]
    });

    const equipmentData: { [key: string]: { 
      totalCount: number; 
      facilities: Set<number>; 
      byFacilityType: { [key: string]: number } 
    } } = {};

    surveys.forEach((survey: any) => {
      let facilityData: { [key: string]: any } = {};
      let rawData: { [key: string]: any } = {};
      
      try {
        facilityData = survey.facility_data ? 
          (typeof survey.facility_data === 'string' ? 
            JSON.parse(survey.facility_data) : 
            survey.facility_data) : {};
        
        if (!facilityData || Object.keys(facilityData).length === 0) {
          facilityData = survey.facilityData || {};
        }
        
        rawData = facilityData;
      } catch (error) {
        facilityData = {};
        rawData = {};
      }

      const facilityType = rawData['general_information/type_healthcare_facility'] === '1' ? 'Hospital' : 
                          rawData['general_information/type_healthcare_facility'] === '2' ? 'Health Center' : 
                          rawData['general_information/type_healthcare_facility'] === '3' ? 'Health Post' :
                          'Health Post';

      // Process equipment from repeat groups
      const equipment = rawData.group_electric_equipment || [];
      
      equipment.forEach((equipGroup: any) => {
        const nestedEquipment = equipGroup['group_electric_equipment/numb_elec_equip_depart'] || [];
        
        nestedEquipment.forEach((item: any) => {
          const equipmentName = item['group_electric_equipment/numb_elec_equip_depart/equipment_name'] || 'Unknown Equipment';
          const quantity = parseInt(item['group_electric_equipment/numb_elec_equip_depart/quantity']) || 1;
          
          if (!equipmentData[equipmentName]) {
            equipmentData[equipmentName] = {
              totalCount: 0,
              facilities: new Set(),
              byFacilityType: {}
            };
          }
          
          equipmentData[equipmentName].totalCount += quantity;
          equipmentData[equipmentName].facilities.add(survey.id);
          equipmentData[equipmentName].byFacilityType[facilityType] = 
            (equipmentData[equipmentName].byFacilityType[facilityType] || 0) + quantity;
        });
      });
    });

    // Transform to final format
    const analytics: EquipmentAnalytics[] = Object.entries(equipmentData).map(([category, data]) => ({
      category,
      totalCount: data.totalCount,
      facilitiesWithEquipment: data.facilities.size,
      averagePerFacility: data.facilities.size > 0 ? Math.round(data.totalCount / data.facilities.size * 100) / 100 : 0,
      byFacilityType: data.byFacilityType
    })).sort((a, b) => b.totalCount - a.totalCount);

    console.log(`🔧 Generated analytics for ${analytics.length} equipment categories`);

    res.json({
      success: true,
      data: {
        equipment: analytics,
        summary: {
          totalEquipmentTypes: analytics.length,
          totalEquipmentCount: analytics.reduce((sum, e) => sum + e.totalCount, 0),
          facilitiesWithEquipment: new Set(Object.values(equipmentData).flatMap(d => Array.from(d.facilities))).size,
          mostCommonEquipment: analytics[0]?.category || 'None'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generating equipment analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate equipment analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
