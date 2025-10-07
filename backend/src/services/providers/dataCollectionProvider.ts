import axios, { AxiosError, AxiosResponse } from 'axios';
import { config } from '../../config';
import { ElectricitySource, FacilityData, TimeOfDay, TransportAccess } from '../../models/survey';

/**
 * Custom error class for data collection API errors
 */
export class DataCollectionError extends Error {
  statusCode?: number;
  errorCode?: string;
  responseData?: any;
  requestData?: any;
  cause?: Error;
  
  constructor(message: string, options?: {
    statusCode?: number;
    errorCode?: string;
    responseData?: any;
    requestData?: any;
    cause?: Error;
  }) {
    super(message);
    this.name = 'DataCollectionError';
    this.statusCode = options?.statusCode;
    this.errorCode = options?.errorCode;
    this.responseData = options?.responseData;
    this.requestData = options?.requestData;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataCollectionError);
    }
    
    // Set cause if provided
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Interface for raw data from external data collection tool
 * This will be refined based on the actual API response structure
 */
export interface RawCollectionData {
  id: string;
  timestamp: string;
  respondent: {
    id: string;
    name?: string;
    email?: string;
  };
  responses: Record<string, any>; // Flexible structure for various question responses
  metadata?: Record<string, any>;
  // GPS/Geolocation fields for KoboToolbox compatibility
  _geolocation?: Array<number>; // KoboToolbox GPS array format [lat, lng, altitude, accuracy]
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
}

/**
 * Transformed survey data ready for import into our system
 */
export interface TransformedSurveyData {
  externalId: string;
  collectionDate: Date;
  respondentId: string;
  facilityData: FacilityData;
  rawData: RawCollectionData; // Store the original data for reference
}

/**
 * Data Collection Provider interface
 */
export interface DataCollectionProvider {
  /**
   * Get surveys collected within a date range
   */
  getSurveys(startDate: Date, endDate: Date): Promise<TransformedSurveyData[]>;
  
  /**
   * Get a specific survey by its ID
   */
  getSurveyById(surveyId: string): Promise<TransformedSurveyData>;
  
  /**
   * Get all surveys for a specific facility
   */
  getSurveysByFacility(facilityId: string): Promise<TransformedSurveyData[]>;
}

/**
 * Implementation for external data collection tool API
 * Replace "ExternalToolName" with actual tool name
 */
export class ExternalDataCollectionProvider implements DataCollectionProvider {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    // Get API credentials directly from environment variables
    this.apiKey = process.env.DATA_COLLECTION_API_KEY || '';
    this.baseUrl = process.env.DATA_COLLECTION_API_URL || 'https://eu.kobotoolbox.org/api/v2/assets/aPefWkJpTpYTWvGb5GG7Mz/data/';
    
    // Log for debugging
    console.log(`Initialized data collection provider with API URL: ${this.baseUrl}`);
  }
  
  /**
   * Get surveys collected within a date range
   */
  async getSurveys(startDate: Date, endDate: Date): Promise<TransformedSurveyData[]> {
    try {
      console.log(`Fetching surveys from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Validate inputs
      if (!startDate || !endDate) {
        throw new DataCollectionError('Invalid date range: start or end date is missing');
      }
      
      if (startDate > endDate) {
        throw new DataCollectionError('Invalid date range: start date is after end date', {
          requestData: { startDate, endDate }
        });
      }
      
      // Validate API configuration
      if (!this.baseUrl) {
        throw new DataCollectionError('API base URL is not configured', {
          errorCode: 'CONFIG_ERROR'
        });
      }
      
      console.log(`Using KoboToolbox API at: ${this.baseUrl}`);
      console.log('Using KoboToolbox v2 API format');
      
      // Clean URL (remove any trailing slashes if needed)
      const cleanBaseUrl = this.baseUrl.endsWith('/')
        ? this.baseUrl
        : `${this.baseUrl}/`;
      
      console.log('==== KoboToolbox API Request ====');
      console.log('URL:', cleanBaseUrl);
      console.log('API Key (first 5 chars):', this.apiKey.substring(0, 5) + '...');
      
      // Make API request to KoboToolbox v2 API
      const response = await axios.get(cleanBaseUrl, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });
      
      console.log(`Successfully received ${response.data?.results?.length || 0} surveys`);
      
      const transformed = this.transformSurveyData(response.data.results);
      return transformed;
    } catch (error) {
      // Handle specific axios errors with more context
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Handle different error types
        if (axiosError.code === 'ECONNREFUSED') {
          console.error(`Connection refused to ${this.baseUrl}`);
          throw new DataCollectionError('Unable to connect to data collection API', {
            errorCode: 'CONNECTION_REFUSED',
            cause: error
          });
        }
        
        if (axiosError.code === 'ETIMEDOUT') {
          console.error(`Connection to ${this.baseUrl} timed out`);
          throw new DataCollectionError('API connection timed out', {
            errorCode: 'CONNECTION_TIMEOUT',
            cause: error
          });
        }
        
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error(`API error ${axiosError.response.status}: ${JSON.stringify(axiosError.response.data)}`);
          throw new DataCollectionError(`API error: ${axiosError.response.status}`, {
            statusCode: axiosError.response.status,
            responseData: axiosError.response.data,
            requestData: { startDate, endDate },
            cause: error
          });
        } else if (axiosError.request) {
          // The request was made but no response was received
          console.error('No response received from API');
          throw new DataCollectionError('No response received from API', {
            errorCode: 'NO_RESPONSE',
            cause: error
          });
        } else {
          // Something happened in setting up the request
          console.error('Error setting up API request:', axiosError.message);
          throw new DataCollectionError(`Error setting up API request: ${axiosError.message}`, {
            cause: error
          });
        }
      }
      
      // Generic error handling as fallback
      console.error('Error fetching surveys from data collection API:', error);
      throw new DataCollectionError(`Failed to fetch surveys: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error instanceof Error ? error : undefined
      });
    }
  }
  
  /**
   * Get a specific survey by its ID
   */
  async getSurveyById(surveyId: string): Promise<TransformedSurveyData> {
    try {
      console.log(`Fetching survey with ID ${surveyId} from ${this.baseUrl}/surveys/${surveyId}`);
      
      // Validate input
      if (!surveyId) {
        throw new DataCollectionError('Invalid survey ID: value is missing');
      }
      
      // Validate API configuration
      if (!this.baseUrl) {
        throw new DataCollectionError('API base URL is not configured', {
          errorCode: 'CONFIG_ERROR'
        });
      }
      
      const response = await axios.get(`${this.baseUrl}/surveys/${surveyId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging requests
        timeout: 10000
      });
      
      console.log(`Successfully received survey data for ID ${surveyId}`);
      
      const transformed = this.transformSurveyData([response.data]);
      if (transformed.length === 0) {
        throw new DataCollectionError(`No survey found with ID: ${surveyId}`, {
          statusCode: 404,
          errorCode: 'SURVEY_NOT_FOUND',
          requestData: { surveyId }
        });
      }
      
      return transformed[0];
    } catch (error) {
      // Handle specific axios errors with more context
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response?.status === 404) {
          console.error(`Survey with ID ${surveyId} not found`);
          throw new DataCollectionError(`Survey with ID ${surveyId} not found`, {
            statusCode: 404,
            errorCode: 'SURVEY_NOT_FOUND',
            cause: error
          });
        }
        
        if (axiosError.response) {
          console.error(`API error ${axiosError.response.status}: ${JSON.stringify(axiosError.response.data)}`);
          throw new DataCollectionError(`API error: ${axiosError.response.status}`, {
            statusCode: axiosError.response.status,
            responseData: axiosError.response.data,
            requestData: { surveyId },
            cause: error
          });
        } else if (axiosError.request) {
          console.error('No response received from API');
          throw new DataCollectionError('No response received from API', {
            errorCode: 'NO_RESPONSE',
            cause: error
          });
        }
      }
      
      // For non-Axios errors or other exceptions
      console.error(`Error fetching survey ${surveyId} from data collection API:`, error);
      throw new DataCollectionError(`Failed to fetch survey: ${error instanceof Error ? error.message : String(error)}`, {
        requestData: { surveyId },
        cause: error instanceof Error ? error : undefined
      });
    }
  }
  
  /**
   * Get all surveys for a specific facility
   */
  async getSurveysByFacility(facilityId: string): Promise<TransformedSurveyData[]> {
    try {
      console.log(`Fetching surveys for facility ${facilityId} from ${this.baseUrl}/facilities/${facilityId}/surveys`);
      
      // Validate input
      if (!facilityId) {
        throw new DataCollectionError('Invalid facility ID: value is missing');
      }
      
      // Validate API configuration
      if (!this.baseUrl) {
        throw new DataCollectionError('API base URL is not configured', {
          errorCode: 'CONFIG_ERROR'
        });
      }
      
      const response = await axios.get(`${this.baseUrl}/facilities/${facilityId}/surveys`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging requests
        timeout: 10000
      });
      
      console.log(`Successfully received ${response.data?.length || 0} surveys for facility ${facilityId}`);
      
      const transformed = this.transformSurveyData(response.data);
      return transformed;
    } catch (error) {
      // Handle specific axios errors with more context
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response?.status === 404) {
          console.error(`Facility with ID ${facilityId} not found`);
          throw new DataCollectionError(`Facility with ID ${facilityId} not found`, {
            statusCode: 404,
            errorCode: 'FACILITY_NOT_FOUND',
            cause: error
          });
        }
        
        if (axiosError.response) {
          console.error(`API error ${axiosError.response.status}: ${JSON.stringify(axiosError.response.data)}`);
          throw new DataCollectionError(`API error: ${axiosError.response.status}`, {
            statusCode: axiosError.response.status,
            responseData: axiosError.response.data,
            requestData: { facilityId },
            cause: error
          });
        } else if (axiosError.request) {
          console.error('No response received from API');
          throw new DataCollectionError('No response received from API', {
            errorCode: 'NO_RESPONSE',
            cause: error
          });
        }
      }
      
      // For non-Axios errors or other exceptions
      console.error(`Error fetching surveys for facility ${facilityId}:`, error);
      throw new DataCollectionError(`Failed to fetch facility surveys: ${error instanceof Error ? error.message : String(error)}`, {
        requestData: { facilityId },
        cause: error instanceof Error ? error : undefined
      });
    }
  }
  
  /**
   * Transform raw API data to our application's data structure
   * This is the single source of truth for transforming data from the API to our internal format
   */
  private transformSurveyData(rawData: any[]): TransformedSurveyData[] {
    if (!rawData) {
      console.warn('Received null or undefined rawData');
      return [];
    }
    
    if (!Array.isArray(rawData)) {
      console.warn(`Expected array of survey data, got: ${typeof rawData}`);
      if (typeof rawData === 'object') {
        console.log('Attempting to wrap object in array for processing');
        rawData = [rawData];
      } else {
        console.error('Cannot process non-array, non-object data:', rawData);
        return [];
      }
    }
    
    if (rawData.length === 0) {
      console.log('Received empty array of survey data');
      return [];
    }
    
    return rawData.map(item => {
      try {
        console.log(`🔄 Starting comprehensive KoboToolbox data transformation for provider...`);
        console.log(`📋 Raw data keys:`, Object.keys(item));
        
        // Extract basic survey identifiers
        const externalId = String(item._id || item.id || `survey_${Date.now()}`);
        const submissionTime = item._submission_time || item.submissionTime || new Date().toISOString();
        const respondentId = item._submitted_by || item.submittedBy || 'anonymous';
        
        console.log(`📊 Processing survey ${externalId} submitted at ${submissionTime}`);
        
        // Comprehensive facility data extraction from KoboToolbox fields
        // Try multiple field name variations for each data point
        const facilityName = item.Name_HF || item.facility_name || item.name_facility || 
                            this.extractStringField(item, 'general_information/Name_HF') || 
                            this.extractStringField(item, 'general_information/facility_name') || 
                            this.extractStringField(item, 'facility_info/name') || 'Unknown Facility';
        
        const region = item.Q3_Region || item.region || item.facility_region || item.location_region || 
                      this.extractStringField(item, 'general_information/Q3_Region') ||
                      this.extractStringField(item, 'location/region') || 
                      this.extractStringField(item, 'general_information/region') || 'Unknown';
        
        const district = item.Q9_District || item.district || item.facility_district || item.location_district || 
                        this.extractStringField(item, 'general_information/Q9_District') ||
                        this.extractStringField(item, 'location/district') || 
                        this.extractStringField(item, 'general_information/district') || 'Unknown';
        
        const facilityTypeRaw = item.facility_type || item.type_facility || item.facilityType || 
                               this.extractStringField(item, 'general_information/type_healthcare_facility') || 
                               this.extractStringField(item, 'facility_info/type') || 'health_post';
        
        const facilityType = this.mapFacilityType(facilityTypeRaw);
        const subsectorActivities = facilityType ? [facilityType] : ['Health Post'];
        
        // Extract electricity source with multiple field variations
        const electricitySourceRaw = item.electricity_source || item.power_source || item.main_power_source || 
                                     this.extractStringField(item, 'power_supply_quality/main_electricity') || 
                                     this.extractStringField(item, 'power/source') || 'unknown';
        
        const electricitySource = this.mapElectricitySource(electricitySourceRaw);
        
        // Parse transport access data to enum
        const transportAccessCode = this.extractStringField(item, 'electric_needs_technology/road_access') || 
                                   item.transport_access || item.road_access;
        const transportAccess = this.mapTransportAccess(transportAccessCode);
        
        console.log(`✅ Extracted facility data:`, {
          name: facilityName,
          region: region,
          district: district,
          facilityType: facilityType,
          electricitySource: electricitySource
        });
        
        // Map the flat structure to our FacilityData structure
        const facilityData: FacilityData = {
          // === BASIC FACILITY INFORMATION === (CRITICAL FIX)
          name: facilityName,
          region: region,
          district: district,
          facilityType: facilityType || undefined, // Fix type mismatch: convert null to undefined
          
          // Productive use sectors and activities
          productiveSectors: ['health facility'],
          subsectorActivities: subsectorActivities,
          
          // Facility information
          ownership: this.mapOwnershipType(this.extractStringField(item, 'general_information/ownership_facility')),
          catchmentPopulation: this.extractNumberField(item, 'staffing_HR_roster/total_patient_number'),
          coreServices: this.mapCoreServices(this.extractStringField(item, 'health_services/general_clinical_services')),
          
          // Electricity information
          electricitySource: electricitySource,
          electricityReliability: this.mapReliability(this.extractStringField(item, 'power_supply_quality/Q15_Is_the_electric_e_facility_reliable_')),
          electricityAvailability: this.extractStringField(item, 'power_supply_quality/Electricity_hours_access'),
          operationalDays: this.extractNumberField(item, 'general_information/operating_days_of'),
          operationalHours: {
            day: this.extractNumberField(item, 'water_supply_patient_numbers/time_close') || 0,
            night: 0, // Default value if not available
          },
          criticalNeeds: [this.extractStringField(item, 'water_supply_patient_numbers/most_important_need')].filter(Boolean),
          
          // Staff information
          supportStaff: this.extractNumberField(item, 'staffing_HR_roster/support_staff'),
          technicalStaff: this.extractNumberField(item, 'staffing_HR_roster/technical_staff'),
          nightStaff: this.extractStringField(item, 'staffing_HR_roster/staff_staying') === "1",
          
          // Building information
          buildings: {
            total: this.extractNumberField(item, 'staffing_HR_roster/separate_buidlings') || 0,
            departmentsWithWiring: this.extractNumberField(item, 'number_departments') || 0,
            rooms: this.extractNumberField(item, 'staffing_HR_roster/buidlings_staff') || 0,
            roomsWithConnection: this.extractNumberField(item, 'staffing_HR_roster/housing_power_access') === 1 ? 
              this.extractNumberField(item, 'staffing_HR_roster/buidlings_staff') : 0,
          },
          
          // Equipment information - now using the nested array structure
          equipment: this.extractEquipmentData(item),
          
          // Infrastructure access
          infrastructure: {
            waterAccess: this.extractStringField(item, 'water_supply_patient_numbers/water_source_available') !== '0',
            nationalGrid: electricitySource === ElectricitySource.NATIONAL_GRID,
            transportationAccess: transportAccess || null,
            communication: this.mapCommunication(this.extractStringField(item, 'communication/functioning_mobile_stff')),
            digitalConnectivity: this.mapDigitalConnectivity(this.extractStringField(item, 'communication/Q35_Does_this_facil_eed_internet_access')),
          },
          
          // Additional required facility fields with default values
          secondaryElectricitySource: this.mapElectricitySource(this.extractStringField(item, 'power_supply_quality/secondary_elect_source_001')),
          monthlyDieselCost: this.extractNumberField(item, 'power_supply_quality/Electricity_bill'),
          monthlyFuelConsumption: null,
          annualMaintenanceCost: null,
          electricityMaintenanceProvider: null,
          hasFacilityPhone: this.extractStringField(item, 'communication/functioning_mobile_stff') === "1",
          numberOfWaterPumps: this.extractNumberField(item, 'water_supply_patient_numbers/water_pumps_num'),
          waterPumpPowerSource: null,
          waterTreatmentMethod: this.extractStringField(item, 'water_supply_patient_numbers/water_treatment_type'),
          inpatientOutpatient: null,
          numberOfBeds: null,
          mostImportantNeed: this.extractStringField(item, 'water_supply_patient_numbers/most_important_need'),
          averageMonthlyPatients: this.extractNumberField(item, 'staffing_HR_roster/total_patient_number'),
          numberOfBuildings: this.extractNumberField(item, 'staffing_HR_roster/separate_buidlings'),
          numberOfStaffQuarters: this.extractNumberField(item, 'staffing_HR_roster/buidlings_staff'),
          staffQuartersPowered: this.extractStringField(item, 'staffing_HR_roster/housing_power_access') === "1",
          departmentsNeedingSockets: [this.extractStringField(item, 'electric_needs_technology/sockets_needed')].filter(Boolean),
          futureEquipmentNeeds: [this.extractStringField(item, 'electric_needs_technology/Q136_Which_equipmen_electricity_on_site')].filter(Boolean)
        };

        // Extract geolocation from the _geolocation array if available
        let latitude = null;
        let longitude = null;
        
        if (item._geolocation && Array.isArray(item._geolocation) && item._geolocation.length >= 2) {
          latitude = parseFloat(item._geolocation[0]);
          longitude = parseFloat(item._geolocation[1]);
        }
        
        // Add GPS coordinates to facilityData for proper storage
        if (latitude !== null && longitude !== null) {
          facilityData.latitude = latitude;
          facilityData.longitude = longitude;
        }
        
        // Create the transformed survey data with the facility data nested
        const transformed: TransformedSurveyData = {
          externalId: externalId,
          collectionDate: new Date(item._submission_time || item.start || new Date().toISOString()),
          respondentId: this.extractStringField(item, 'general_information/Enumerator_s_name') || 'unknown',
          facilityData: facilityData,
          // Ensure facility_name is included in rawData for getOrCreateFacility to find
          rawData: {
            ...item,
            responses: {
              ...(item.responses || {}),
              facility_name: facilityName,
              // Include GPS coordinates if available for facility location
              ...(latitude !== null && longitude !== null && {
                latitude: latitude,
                longitude: longitude
              })
            }
          }
        };

        return transformed;
      } catch (error) {
        console.error('Error transforming survey data:', error);
        // Return a minimal valid object with error information
        return {
          externalId: `error-${Date.now()}`,
          collectionDate: new Date(),
          respondentId: 'error',
          facilityData: this.createDefaultFacilityData(),
          rawData: { 
            error: 'Transformation failed', 
            original: item, 
            errorMessage: error instanceof Error ? error.message : String(error) 
          }
        };
      }
    }).filter(Boolean) as TransformedSurveyData[]; // Filter out any null/undefined entries
  }
  
  /**
   * Extracts equipment data from the nested array structure in the API response
   */
  private extractEquipmentData(data: any): FacilityData['equipment'] {
    try {
      // Check if the group_electric_equipment array exists
      if (!data.group_electric_equipment || !Array.isArray(data.group_electric_equipment) || data.group_electric_equipment.length === 0) {
        return [];
      }
      
      const equipmentItems: FacilityData['equipment'] = [];
      
      // Process each department in the equipment array
      data.group_electric_equipment.forEach((department: any) => {
        // Check if the department has equipment items
        if (department['group_electric_equipment/numb_elec_equip_depart'] && 
            Array.isArray(department['group_electric_equipment/numb_elec_equip_depart'])) {
          
          // Process each equipment item in the department
          department['group_electric_equipment/numb_elec_equip_depart'].forEach((item: any) => {
            const equipmentName = this.mapEquipmentType(
              item['group_electric_equipment/numb_elec_equip_depart/Select_all_the_electric_medica']
            );
            
            if (equipmentName) {
              // Extract numeric hours, handling potential string values like "8hr"
              let hoursPerDay = 0;
              const hoursStr = item['group_electric_equipment/numb_elec_equip_depart/equip_hours_use'];
              if (typeof hoursStr === 'string') {
                // Extract numeric part from strings like "8hr"
                const numericHours = parseInt(hoursStr.replace(/[^0-9]/g, ''));
                if (!isNaN(numericHours)) {
                  hoursPerDay = numericHours;
                }
              } else if (typeof hoursStr === 'number') {
                hoursPerDay = hoursStr;
              }
              
              // Map the time of day value
              const timeOfDayValue = item['group_electric_equipment/numb_elec_equip_depart/time_of_use'];
              
              equipmentItems.push({
                name: equipmentName,
                powerRating: 0, // Default as we don't have this information
                quantity: parseInt(item['group_electric_equipment/numb_elec_equip_depart/equip_number']) || 1,
                hoursPerDay: hoursPerDay,
                hoursPerNight: 0, // Default as we don't have specific night hours
                timeOfDay: this.mapTimeOfDay(timeOfDayValue),
                weeklyUsage: this.mapWeeklyUsage(item['group_electric_equipment/numb_elec_equip_depart/Q64_How_often_do_yo_e_selected_equipment']),
              });
            }
          });
        }
      });
      
      return equipmentItems;
    } catch (error) {
      console.error('Error extracting equipment data:', error);
      return [];
    }
  }
  
  // Helper methods for data extraction with type safety
  
  private extractStringField(data: any, fieldPath: string): string {
    const value = this.getNestedValue(data, fieldPath);
    return typeof value === 'string' ? value : '';
  }
  
  private extractNumberField(data: any, fieldPath: string): number {
    const value = this.getNestedValue(data, fieldPath);
    return typeof value === 'number' ? value : 0;
  }
  
  private extractBooleanField(data: any, fieldPath: string): boolean {
    const value = this.getNestedValue(data, fieldPath);
    return Boolean(value);
  }
  
  private extractArrayField(data: any, fieldPath: string): string[] {
    const value = this.getNestedValue(data, fieldPath);
    if (Array.isArray(value)) {
      return value.map(item => String(item));
    }
    return [];
  }
  
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
  
  private mapTimeOfDay(value: any): TimeOfDay {
    if (!value) return TimeOfDay.MORNING; // Default value
    
    const strValue = String(value).toLowerCase();
    
    // Handle text descriptions
    if (strValue.includes('morn')) return TimeOfDay.MORNING;
    if (strValue.includes('after')) return TimeOfDay.AFTERNOON;
    if (strValue.includes('even')) return TimeOfDay.EVENING;
    if (strValue.includes('night')) return TimeOfDay.NIGHT;
    
    // Handle numeric codes from KoboToolbox API
    if (strValue === '1') return TimeOfDay.MORNING;
    if (strValue === '2') return TimeOfDay.AFTERNOON;
    if (strValue === '3') return TimeOfDay.EVENING;
    if (strValue === '4') return TimeOfDay.NIGHT;
    
    return TimeOfDay.MORNING; // Default value
  }
  
  /**
   * Maps equipment type code to string name
   */
  private mapEquipmentType(code: string | undefined): string | null {
    if (!code) return null;
    
    // Map based on the codes in the API
    const equipmentMap: Record<string, string> = {
      'lab_incubator': 'Laboratory Incubator',
      'dry_steriliser': 'Dry Sterilizer',
      'mobile_phone': 'Mobile Phone',
      'autoclave': 'Autoclave',
      'fridge': 'Refrigerator',
      'computer': 'Computer',
      'centrifuge': 'Centrifuge',
      'microscope': 'Microscope',
      'xray': 'X-Ray Machine',
      'ultrasound': 'Ultrasound',
      'patient_monitor': 'Patient Monitor',
      '1': 'Laboratory Incubator',
      '2': 'Dry Sterilizer',
      '3': 'Mobile Phone',
      '4': 'Autoclave',
      '5': 'Refrigerator',
      '6': 'Computer',
      '7': 'Centrifuge',
      '8': 'Microscope',
      '9': 'X-Ray Machine',
      '10': 'Ultrasound',
      '11': 'Patient Monitor'
    };
    
    return equipmentMap[code] || code; // Return the mapped name or the original code if not found
  }
  
  /**
   * Maps weekly usage text or code to numeric value
   */
  private mapWeeklyUsage(value: any): number {
    if (!value) return 5; // Default to 5 days a week
    
    const strValue = String(value).toLowerCase();
    
    // Handle numeric codes
    if (strValue === '1') return 7; // daily
    if (strValue === '2') return 5; // weekdays
    if (strValue === '3') return 1; // weekly
    if (strValue === '4') return 0.25; // monthly
    
    // Handle text descriptions
    if (strValue.includes('daily')) return 7;
    if (strValue.includes('weekday')) return 5;
    if (strValue.includes('weekly')) return 1;
    if (strValue.includes('monthly')) return 0.25;
    
    // Default to 5 days a week (weekdays)
    return 5;
  }
  
  /**
   * Helper method to map string or numeric codes to ElectricitySource enum
   */
  private mapElectricitySource(value: string | undefined): ElectricitySource | null {
    if (!value) return null;
    
    // Map based on the numeric codes in the API
    switch (value) {
      case '1': return ElectricitySource.NATIONAL_GRID;
      case '2': return ElectricitySource.DIESEL_GENERATOR;
      case '3': return ElectricitySource.MINI_GRID;
      case '4': return ElectricitySource.HYBRID;
      case '5': return ElectricitySource.SOLAR;
      case '6': return ElectricitySource.NONE;
    }
    
    // Fallback to text matching
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('solar')) return ElectricitySource.SOLAR;
    if (lowerValue.includes('generator')) return ElectricitySource.DIESEL_GENERATOR;
    if (lowerValue.includes('grid')) return ElectricitySource.NATIONAL_GRID;
    return ElectricitySource.OTHER;
  }
  
  /**
   * Helper method to map string values to TransportAccess enum
   */
  private mapTransportAccess(value: string | undefined): TransportAccess | null {
    if (!value) return null;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('paved')) return TransportAccess.PAVED_ROAD;
    if (lowerValue.includes('unpaved')) return TransportAccess.UNPAVED_ROAD;
    if (lowerValue.includes('seasonal')) return TransportAccess.SEASONAL_ACCESS;
    if (lowerValue.includes('difficult')) return TransportAccess.DIFFICULT_ACCESS;
    return null;
  }
  
  /**
   * Helper method to map string values to FacilityType enum
   */
  private mapFacilityType(value: string | undefined): string | null {
    if (!value) return null;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('hospital')) return 'Hospital';
    if (lowerValue.includes('health center')) return 'Health Center';
    if (lowerValue.includes('clinic')) return 'Clinic';
    if (lowerValue.includes('dispensary')) return 'Dispensary';
    return null;
  }
  
  /**
   * Helper method to map string values to OwnershipType enum
   */
  private mapOwnershipType(value: string | undefined): string | null {
    if (!value) return null;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('public')) return 'Public';
    if (lowerValue.includes('private')) return 'Private';
    if (lowerValue.includes('ngo')) return 'NGO';
    if (lowerValue.includes('faith')) return 'Faith-Based';
    return null;
  }
  
  /**
   * Helper method to map string values to CoreServices enum
   * Always returns string[] (never null) as required by FacilityData interface
   */
  private mapCoreServices(value: string | undefined): string[] {
    if (!value) return [];
    
    const lowerValue = value.toLowerCase();
    const services = [];
    if (lowerValue.includes('maternity')) services.push('Maternity');
    if (lowerValue.includes('outpatient')) services.push('Outpatient');
    if (lowerValue.includes('inpatient')) services.push('Inpatient');
    if (lowerValue.includes('surgery')) services.push('Surgery');
    if (lowerValue.includes('laboratory')) services.push('Laboratory');
    if (lowerValue.includes('x-ray')) services.push('X-ray');
    return services;
  }
  
  /**
   * Helper method to map string values to Reliability enum
   */
  private mapReliability(value: string | undefined): string | null {
    if (!value) return null;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('reliable')) return 'Reliable';
    if (lowerValue.includes('unreliable')) return 'Unreliable';
    return null;
  }
  
  /**
   * Helper method to map string values to Communication enum
   */
  private mapCommunication(value: string | undefined): string | null {
    if (!value) return null;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('yes')) return 'Yes';
    if (lowerValue.includes('no')) return 'No';
    return null;
  }
  
  /**
   * Helper method to map string values to DigitalConnectivity enum
   */
  private mapDigitalConnectivity(value: string | undefined): string | null {
    if (!value) return null;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('yes')) return 'Yes';
    if (lowerValue.includes('no')) return 'No';
    return null;
  }
  
  /**
   * Creates a default FacilityData object with all required fields
   * This ensures type safety and consistent defaults
   */
  private createDefaultFacilityData(): FacilityData {
    return {
      // Productive use sectors and activities
      productiveSectors: [],
      subsectorActivities: [],
      
      // Facility information
      ownership: null,
      catchmentPopulation: null,
      coreServices: [],
      
      // Electricity information
      electricitySource: null,
      electricityReliability: null,
      electricityAvailability: null,
      operationalDays: null,
      operationalHours: {
        day: 0,
        night: 0
      },
      criticalNeeds: [],
      
      // Staff information
      supportStaff: null,
      technicalStaff: null,
      nightStaff: false,
      
      // Building information
      buildings: {
        total: 0,
        departmentsWithWiring: 0,
        rooms: 0,
        roomsWithConnection: 0
      },
      
      // Equipment information
      equipment: [],
      
      // Infrastructure access
      infrastructure: {
        waterAccess: false,
        nationalGrid: false,
        transportationAccess: null,
        communication: null,
        digitalConnectivity: null
      },
      
      // Additional facility fields
      secondaryElectricitySource: null,
      monthlyDieselCost: null,
      monthlyFuelConsumption: null,
      annualMaintenanceCost: null,
      electricityMaintenanceProvider: null,
      hasFacilityPhone: false,
      numberOfWaterPumps: null,
      waterPumpPowerSource: null,
      waterTreatmentMethod: null,
      inpatientOutpatient: null,
      numberOfBeds: null,
      mostImportantNeed: null,
      averageMonthlyPatients: null,
      numberOfBuildings: null,
      numberOfStaffQuarters: null,
      staffQuartersPowered: false,
      departmentsNeedingSockets: [],
      futureEquipmentNeeds: []
    };
  }
}
