import { Survey, Facility, sequelize } from '../models';
import { Transaction } from 'sequelize';
import axios from 'axios';

/**
 * Interface for transformed survey data
 */
export interface TransformedSurveyData {
  externalId: string;
  facilityData: any;
  collectionDate: Date;
  respondentId: string;
  rawData?: any;
}

/**
 * Interface for facility data structure
 */
export interface FacilityData {
  name: string;
  region: string;
  district: string;
  facilityType: string;
  electricitySource: string;
  coreServices: string[];
  infrastructure: {
    waterAccess: boolean;
    nationalGrid: boolean;
    transportationAccess: string;
  };
  buildings: {
    total: number;
    departmentsWithWiring: number;
    rooms: number;
    roomsWithConnection: number;
  };
  operationalHours: {
    day: number;
    night: number;
  };
  latitude?: number;
  longitude?: number;
}

/**
 * Import summary interface
 */
export interface ImportSummary {
  success: boolean;
  imported: number;
  failed: number;
  message: string;
}

/**
 * Data Import Service for handling various data sources
 */
export class DataImportService {
  
  /**
   * Import surveys from KoboToolbox
   */
  async importSurveys(surveys: any[]): Promise<{ imported: number; failed: number; message: string }> {
    console.log(`📊 Starting import of ${surveys.length} surveys...`);
    
    let imported = 0;
    let failed = 0;
    
    for (const surveyData of surveys) {
      try {
        const success = await this.processSurvey(surveyData);
        if (success) {
          imported++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('❌ Error processing survey:', error);
        failed++;
      }
    }
    
    const message = `Import completed: ${imported} imported, ${failed} failed`;
    console.log(`🎯 ${message}`);
    
    return { imported, failed, message };
  }

  /**
   * Import from CSV file
   */
  async importFromCsv(csvData: any[]): Promise<ImportSummary> {
    console.log(`📄 Starting CSV import of ${csvData.length} records...`);
    
    let imported = 0;
    let failed = 0;
    
    for (const row of csvData) {
      try {
        const transformedData = this.transformCsvRowToSurvey(row);
        const success = await this.processSurvey(transformedData);
        
        if (success) {
          imported++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('❌ Error processing CSV row:', error);
        failed++;
      }
    }
    
    const message = `CSV import completed: ${imported} imported, ${failed} failed`;
    console.log(`🎯 ${message}`);
    
    return {
      success: imported > 0,
      imported,
      failed,
      message
    };
  }

  /**
   * Import from external API
   */
  async importFromExternalApi(
    apiUrl: string,
    apiKey?: string,
    dataMapping?: any,
    transaction?: Transaction
  ): Promise<ImportSummary> {
    console.log(`🌐 Starting external API import from: ${apiUrl}`);
    
    let imported = 0;
    let failed = 0;
    
    try {
      // Make API request
      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'DREAM_TOOL/1.0'
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      console.log(`📡 Fetching data from external API...`);
      const response = await axios.get(apiUrl, { headers, timeout: 30000 });
      
      // Handle both single object and array responses
      const apiData = Array.isArray(response.data) ? response.data : [response.data];
      console.log(`📊 Received ${apiData.length} records from API`);
      
      // Process each record
      for (const record of apiData) {
        try {
          // Transform API data to survey format
          const transformedData = this.transformApiDataToSurvey(record, dataMapping || {});
          
          // Process the survey (create facility and survey records)
          const success = await this.processSurvey(transformedData);
          
          if (success) {
            imported++;
            console.log(`✅ Successfully imported record: ${transformedData.externalId}`);
          } else {
            failed++;
            console.log(`❌ Failed to import record: ${transformedData.externalId}`);
          }
        } catch (recordError) {
          failed++;
          console.error(`❌ Error processing record:`, recordError);
        }
      }
      
      const message = `External API import completed: ${imported} imported, ${failed} failed`;
      console.log(`🎯 ${message}`);
      
      return {
        success: imported > 0,
        imported,
        failed,
        message
      };
      
    } catch (error) {
      console.error('❌ External API import failed:', error);
      return {
        success: false,
        imported: 0,
        failed: 1,
        message: `External API import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process a single survey (create facility and survey records)
   */
  private async processSurvey(rawSurveyData: any): Promise<boolean> {
    let surveyData: TransformedSurveyData;
    
    if (rawSurveyData.facilityData && rawSurveyData.externalId) {
      surveyData = rawSurveyData as TransformedSurveyData;
    } else {
      surveyData = this.transformSurveyData(rawSurveyData);
    }
    
    return await sequelize.transaction(async (transaction) => {
      try {
        const facility = await this.getOrCreateFacility(surveyData, transaction);
        
        const existingSurvey = await Survey.findOne({
          where: { externalId: surveyData.externalId },
          transaction
        });
        
        if (existingSurvey) {
          console.log(`⚠️ Survey ${surveyData.externalId} already exists, skipping...`);
          return true;
        }
        
        await Survey.create({
          externalId: surveyData.externalId,
          facilityId: facility.id,
          facilityData: surveyData.facilityData,
          collectionDate: surveyData.collectionDate,
          respondentId: surveyData.respondentId
        }, { transaction });
        
        console.log(`✅ Successfully processed survey: ${surveyData.externalId}`);
        return true;
      } catch (error) {
        console.error(`❌ Error processing survey ${surveyData.externalId}:`, error);
        return false;
      }
    });
  }

  /**
   * Get or create facility record
   */
  private async getOrCreateFacility(surveyData: TransformedSurveyData, transaction: Transaction) {
    const facilityName = surveyData?.facilityData?.name || 'Unknown Facility';
    
    let facility = await Facility.findOne({
      where: { name: facilityName },
      transaction
    });
    
    if (!facility) {
      const latitude = surveyData.facilityData?.latitude;
      const longitude = surveyData.facilityData?.longitude;
      
      facility = await Facility.create({
        name: facilityName,
        type: 'healthcare',
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'survey'
      }, { transaction });
      
      console.log(`🏥 Created new facility: ${facilityName}`);
    }
    
    return facility;
  }

  /**
   * Transform raw survey data to standardized format
   */
  private transformSurveyData(rawData: any): TransformedSurveyData {
    // Extract facility data from KoboToolbox survey
    const facilityData = this.createDefaultFacilityData();
    
    // Map KoboToolbox fields to facility data
    if (rawData.facility_name) {
      facilityData.name = rawData.facility_name;
    }
    if (rawData.region) {
      facilityData.region = rawData.region;
    }
    if (rawData.district) {
      facilityData.district = rawData.district;
    }
    
    return {
      externalId: rawData._id || `survey_${Date.now()}`,
      facilityData,
      collectionDate: new Date(rawData._submission_time || Date.now()),
      respondentId: rawData._submitted_by || 'unknown',
      rawData
    };
  }

  /**
   * Transform CSV row to survey format
   */
  private transformCsvRowToSurvey(row: any): TransformedSurveyData {
    const facilityData = this.createDefaultFacilityData();
    
    // Override with CSV data where available
    facilityData.name = row.facility_name || 'Unknown Facility';
    facilityData.region = row.region || 'Unknown Region';
    facilityData.district = row.district || 'Unknown District';
    facilityData.facilityType = row.facility_type || 'health_facility';
    facilityData.electricitySource = this.mapElectricitySource(row.electricity_source);
    
    return {
      externalId: row.facility_id || `csv_${Date.now()}_${Math.random()}`,
      facilityData,
      collectionDate: new Date(),
      respondentId: row.respondent_id || 'csv_import',
      rawData: row
    };
  }

  /**
   * Transform API data to survey format
   */
  private transformApiDataToSurvey(record: any, mapping: any): TransformedSurveyData {
    const facilityData = this.createDefaultFacilityData();
    
    // Override with API data where available using mapping
    if (mapping.facilityName && record[mapping.facilityName]) {
      facilityData.name = record[mapping.facilityName];
    }
    if (mapping.region && record[mapping.region]) {
      facilityData.region = record[mapping.region];
    }
    if (mapping.district && record[mapping.district]) {
      facilityData.district = record[mapping.district];
    }
    
    return {
      externalId: record[mapping.facilityId] || `api_${Date.now()}_${Math.random()}`,
      facilityData,
      collectionDate: new Date(),
      respondentId: record[mapping.respondentId] || 'api_import',
      rawData: record
    };
  }

  /**
   * Create default facility data structure
   */
  private createDefaultFacilityData(): FacilityData {
    return {
      name: 'Unknown Facility',
      region: 'Unknown Region',
      district: 'Unknown District',
      facilityType: 'health_facility',
      electricitySource: 'none',
      coreServices: [],
      infrastructure: {
        waterAccess: false,
        nationalGrid: false,
        transportationAccess: 'poor'
      },
      buildings: {
        total: 1,
        departmentsWithWiring: 0,
        rooms: 1,
        roomsWithConnection: 0
      },
      operationalHours: {
        day: 8,
        night: 0
      }
    };
  }

  /**
   * Map electricity source to standardized values
   */
  private mapElectricitySource(source: string): string {
    if (!source) return 'none';
    
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('solar')) return 'solar';
    if (lowerSource.includes('diesel') || lowerSource.includes('generator')) return 'diesel_generator';
    if (lowerSource.includes('grid') || lowerSource.includes('national')) return 'national_grid';
    if (lowerSource.includes('battery')) return 'battery';
    
    return 'other';
  }
}
