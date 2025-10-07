import { ExternalDataCollectionProvider, TransformedSurveyData, RawCollectionData } from './providers/dataCollectionProvider';
import { sequelize } from '../models';
import { FacilityData, ElectricitySource, TransportAccess } from '../models/survey';
import { Transaction, QueryTypes, Model } from 'sequelize';
import { SurveyAnalysisService } from './surveyAnalysisService';

// Get model references from sequelize
const Survey = sequelize.models.Survey;
const Facility = sequelize.models.Facility;

/**
 * Service for importing data from external collection tools into the application
 */
export class DataImportService {
  private provider: ExternalDataCollectionProvider;
  private surveyAnalysis: SurveyAnalysisService;

  constructor() {
    this.provider = new ExternalDataCollectionProvider();
    this.surveyAnalysis = SurveyAnalysisService.getInstance();
  }

  /**
   * Test database connection and verify schema
   * @throws Error if connection or schema verification fails
   */
  async testConnection(): Promise<void> {
    try {
      // Test basic connection
      await sequelize.authenticate();
      
      // Verify required tables exist
      const tableCheck = await sequelize.query(
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name IN ('surveys', 'facilities')`,
        { type: QueryTypes.SELECT }
      );
      
      const requiredTables = ['surveys', 'facilities'];
      const foundTables = tableCheck.map((t: any) => t.table_name);
      const missingTables = requiredTables.filter(t => !foundTables.includes(t));
      
      if (missingTables.length > 0) {
        throw new Error(`Missing required database tables: ${missingTables.join(', ')}`);
      }
      
      // Verify we can query the surveys table
      await sequelize.query('SELECT 1 FROM surveys LIMIT 1', { type: QueryTypes.SELECT });
      
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import surveys from a date range into the database
   * @param startDate Beginning date range for import
   * @param endDate Ending date range for import
   * @returns Summary of the import operation
   */
  async importSurveysByDateRange(startDate: Date, endDate: Date): Promise<ImportSummary> {
    try {
      console.log(`🚀 Starting survey import for period ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Fetch data from external API
      const surveys = await this.provider.getSurveys(startDate, endDate);
      console.log(`📊 Retrieved ${surveys.length} surveys from external API`);
      
      if (surveys.length === 0) {
        return {
          success: true,
          imported: 0,
          failed: 0,
          message: 'No surveys found in the specified date range'
        };
      }
      
      // Process each survey with transaction support
      const results = await this.processSurveyBatch(surveys);
      
      // Run post-import analysis if surveys were successfully imported
      if (results.imported > 0) {
        try {
          console.log('📊 Running post-import analysis on imported surveys...');
          // Skip analysis for batch imports to avoid performance issues
          console.log('📊 Analysis skipped for batch import - use individual survey analysis instead');
        } catch (analyzeError) {
          console.error('Post-import analysis failed:', analyzeError);
          // Continue despite analysis failure
        }
      }
      
      return {
        success: results.failed === 0,
        imported: results.imported,
        failed: results.failed,
        message: `Imported ${results.imported} surveys, ${results.failed} failed`
      };
    } catch (error) {
      console.error('Survey import failed:', error);
      return {
        success: false,
        imported: 0,
        failed: 0,
        message: `Import failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Import a specific survey by its external ID
   * @param surveyId External survey identifier
   * @returns Summary of the import operation
   */
  async importSurveyById(surveyId: string): Promise<ImportSummary> {
    try {
      console.log(`🚀 Starting import for survey ID: ${surveyId}`);
      
      // Fetch specific survey from external API
      const survey = await this.provider.getSurveyById(surveyId);
      
      // Process this single survey
      const result = await this.processSurvey(survey);
      
      // Run post-import analysis if the survey was successfully imported
      if (result) {
        try {
          console.log('📊 Running post-import analysis on imported survey...');
          // Find the imported survey by external ID to get the database ID
          const importedSurvey = await sequelize.models.Survey.findOne({
            where: { externalId: survey.externalId }
          });
          
          if (importedSurvey) {
            const analysisResult = await this.surveyAnalysis.analyzeSurvey((importedSurvey as any).id);
            console.log('📊 Analysis complete:', analysisResult.summary);
            
            if (analysisResult.recommendedActions && analysisResult.recommendedActions.length > 0) {
              console.log('📊 Recommended actions:');
              analysisResult.recommendedActions.forEach((action: string) => {
                console.log(`  - ${action}`);
              });
            }
          } else {
            console.warn('⚠️ Could not find imported survey for analysis');
          }
        } catch (analysisError) {
          console.warn('⚠️ Post-import analysis failed:', analysisError);
        }
      }
      
      return {
        success: result,
        imported: result ? 1 : 0,
        failed: result ? 0 : 1,
        message: result 
          ? `Successfully imported survey ${surveyId}` 
          : `Failed to import survey ${surveyId}`
      };
    } catch (error) {
      console.error(`Failed to import survey ${surveyId}:`, error);
      return {
        success: false,
        imported: 0,
        failed: 1,
        message: `Import failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Process a batch of surveys
   * @param surveys Surveys to import
   * @returns Summary of processing results
   */
  private async processSurveyBatch(surveys: TransformedSurveyData[]): Promise<{
    imported: number;
    failed: number;
  }> {
    let imported = 0;
    let failed = 0;

    for (const survey of surveys) {
      try {
        const success = await this.processSurvey(survey);
        if (success) {
          imported++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error processing survey ${survey.externalId}:`, error);
        failed++;
      }
    }

    return { imported, failed };
  }

  /**
   * Create default FacilityData object with all required properties
   * @returns Default FacilityData object
   */
  private createDefaultFacilityData(): FacilityData {
    return {
      // === BASIC FACILITY INFORMATION ===
      name: undefined,
      region: undefined,
      district: undefined,
      facilityType: undefined,
      
      // Productive use sectors and activities
      productiveSectors: [],
      subsectorActivities: [],
      
      // Facility information
      ownership: null,
      catchmentPopulation: 0,
      coreServices: [],
      
      // Electricity information
      electricitySource: null,
      electricityReliability: null,
      electricityAvailability: null,
      operationalDays: 0,
      operationalHours: {
        day: 0,
        night: 0
      },
      criticalNeeds: [],
      
      // Staff information
      supportStaff: 0,
      technicalStaff: 0,
      nightStaff: false,
      
      // Building and infrastructure
      buildings: {
        total: 0,
        departmentsWithWiring: 0,
        rooms: 0,
        roomsWithConnection: 0
      },
      equipment: [],
      infrastructure: {
        waterAccess: false,
        nationalGrid: false,
        transportationAccess: null,
        communication: null,
        digitalConnectivity: null
      },
      
      // Additional facility details
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

  /**
   * Validate if a value is a valid ElectricitySource
   */
  private isValidElectricitySource(value: any): value is ElectricitySource {
    if (value === null || value === undefined) return false;
    return Object.values(ElectricitySource).includes(value as ElectricitySource);
  }

  /**
   * Validate if a value is a valid TransportAccess
   */
  private isValidTransportAccess(value: any): value is TransportAccess {
    if (value === null || value === undefined) return false;
    return Object.values(TransportAccess).includes(value as TransportAccess);
  }

  /**
   * Safely set facility data with validation
   */
  private setFacilityDataValue<T>(data: any, key: string, value: any, validator: (v: any) => v is T | null): void {
    if (validator(value)) {
      data[key] = value;
    } else {
      console.warn(`Invalid value '${value}' for ${key}, setting to null`);
      data[key] = null;
    }
  }

  /**
   * Transform raw survey data from external source to our internal format
   */
  private transformSurveyData(rawData: any): TransformedSurveyData {
    console.log(`🔄 Starting comprehensive KoboToolbox data transformation...`);
    console.log(`📋 Raw data keys:`, Object.keys(rawData));
    
    // Extract basic survey identifiers
    const externalId = String(rawData._id || rawData.id || `survey_${Date.now()}`);
    const submissionTime = rawData._submission_time || rawData.submissionTime || new Date().toISOString();
    const respondentId = rawData._submitted_by || rawData.submittedBy || 'anonymous';
    
    console.log(`📊 Processing survey ${externalId} submitted at ${submissionTime}`);
    
    // Comprehensive facility data extraction from KoboToolbox fields
    const facilityData: FacilityData = {
      // Basic facility information
      name: rawData.facility_name || rawData.facilityName || rawData.name_facility || 'Unknown Facility',
      region: rawData.region || rawData.facility_region || rawData.location_region || 'Unknown',
      district: rawData.district || rawData.facility_district || rawData.location_district || 'Unknown',
      facilityType: rawData.facility_type || rawData.type_facility || rawData.facilityType || 'Health Post',
      ownership: rawData.ownership || rawData.facility_ownership || null,
      catchmentPopulation: parseInt(rawData.catchment_population || rawData.population_served || '0'),
      
      // Operational information
      operationalDays: parseInt(rawData.operational_days || rawData.days_per_week || '7'),
      operationalHours: {
        day: parseFloat(rawData.hours_per_day || rawData.daily_hours || '8'),
        night: parseFloat(rawData.night_hours || rawData.emergency_hours || '0')
      },
      coreServices: this.extractArrayFromString(rawData.core_services || rawData.services_offered || ''),
      inpatientOutpatient: rawData.inpatient_outpatient || rawData.service_type || null,
      averageMonthlyPatients: parseInt(rawData.patients_per_month || rawData.monthly_patients || '0') || null,
      numberOfBeds: parseInt(rawData.number_of_beds || rawData.beds_count || '0') || null,
      
      // Staff information
      supportStaff: parseInt(rawData.support_staff || rawData.staff_admin || '0'),
      technicalStaff: parseInt(rawData.technical_staff || rawData.staff_technicians || '0'),
      nightStaff: rawData.night_staff === 'yes' || rawData.has_night_staff === 'yes' || false,
      
      // Electricity & power
      electricitySource: rawData.electricity_source || rawData.power_source || rawData.main_power_source || null,
      electricityReliability: rawData.electricity_reliability || rawData.power_reliability || null,
      electricityAvailability: rawData.electricity_availability || rawData.power_availability || null,
      secondaryElectricitySource: rawData.secondary_power_source || rawData.backup_power || null,
      monthlyDieselCost: parseFloat(rawData.monthly_diesel_cost || rawData.fuel_cost || '0') || null,
      monthlyFuelConsumption: parseFloat(rawData.monthly_fuel_consumption || rawData.fuel_consumption || '0') || null,
      annualMaintenanceCost: parseFloat(rawData.annual_maintenance_cost || rawData.maintenance_cost || '0') || null,
      electricityMaintenanceProvider: rawData.electricity_maintenance_provider || rawData.maintenance_provider || null,
      
      // Water & sanitation
      numberOfWaterPumps: parseInt(rawData.number_of_water_pumps || rawData.water_pumps || '0') || null,
      waterPumpPowerSource: rawData.water_pump_power_source || rawData.pump_power_source || null,
      waterTreatmentMethod: rawData.water_treatment_method || rawData.water_treatment || null,
      
      // Communication
      hasFacilityPhone: rawData.has_facility_phone === 'yes' || rawData.facility_phone === 'yes' || false,
      
      // Buildings & infrastructure
      numberOfBuildings: parseInt(rawData.number_of_buildings || rawData.buildings_count || '1') || null,
      numberOfStaffQuarters: parseInt(rawData.number_of_staff_quarters || rawData.staff_quarters || '0') || null,
      staffQuartersPowered: rawData.staff_quarters_powered === 'yes' || rawData.quarters_have_power === 'yes' || false,
      buildings: {
        total: parseInt(rawData.total_buildings || rawData.buildings_count || '1'),
        departmentsWithWiring: parseInt(rawData.departments_with_wiring || rawData.wired_departments || '0'),
        rooms: parseInt(rawData.total_rooms || rawData.rooms_count || '1'),
        roomsWithConnection: parseInt(rawData.rooms_with_connection || rawData.connected_rooms || '0')
      },
      
      // Equipment extraction from repeat groups
      equipment: this.extractEquipmentData(rawData),
      
      // Infrastructure access
      infrastructure: {
        waterAccess: rawData.water_access === 'yes' || rawData.has_water === 'yes' || false,
        nationalGrid: rawData.national_grid === 'yes' || rawData.grid_connection === 'yes' || false,
        transportationAccess: rawData.transportation_access || rawData.transport_access || null,
        communication: rawData.communication_access || rawData.communication || null,
        digitalConnectivity: rawData.digital_connectivity || rawData.internet_access || null
      },
      
      // Needs & requirements
      criticalNeeds: this.extractArrayFromString(rawData.critical_needs || rawData.priority_needs || ''),
      mostImportantNeed: rawData.most_important_need || rawData.top_priority || null,
      departmentsNeedingSockets: this.extractArrayFromString(rawData.departments_needing_sockets || rawData.socket_needs || ''),
      futureEquipmentNeeds: this.extractArrayFromString(rawData.future_equipment_needs || rawData.equipment_needs || ''),
      
      // Productive use (legacy fields)
      productiveSectors: this.extractArrayFromString(rawData.productive_sectors || rawData.sectors || ''),
      subsectorActivities: this.extractArrayFromString(rawData.subsector_activities || rawData.activities || '')
    };
    
    console.log(`✅ Extracted facility data:`, {
      name: facilityData.name,
      region: facilityData.region,
      district: facilityData.district,
      facilityType: facilityData.facilityType,
      equipmentCount: facilityData.equipment?.length || 0,
      electricitySource: facilityData.electricitySource
    });
    
    return {
      externalId,
      facilityData,
      collectionDate: new Date(submissionTime),
      respondentId,
      rawData // Keep raw data for debugging
    };
  }
  
  /**
   * Extract equipment data from KoboToolbox repeat groups
   */
  private extractEquipmentData(rawData: any): any[] {
    const equipment: any[] = [];
    
    // Common KoboToolbox repeat group field names for equipment
    const equipmentGroups = [
      rawData.group_electric_equipment,
      rawData.equipment_list,
      rawData.medical_equipment,
      rawData.electrical_equipment,
      rawData.group_equipment
    ].filter(Boolean);
    
    equipmentGroups.forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(item => {
          equipment.push({
            name: item.equipment_name || item.name || item.equipment_type || 'Unknown Equipment',
            type: item.equipment_type || item.type || item.category || 'Medical',
            quantity: parseInt(item.quantity || item.equipment_quantity || '1'),
            powerRating: parseFloat(item.power_rating || item.wattage || item.power_consumption || '0'),
            hoursPerDay: parseFloat(item.hours_per_day || item.daily_hours || item.usage_hours || '8'),
            frequency: item.frequency || item.usage_frequency || 'Daily',
            critical: item.critical === 'yes' || item.is_critical === 'yes' || false,
            condition: item.condition || item.equipment_condition || 'Good'
          });
        });
      }
    });
    
    console.log(`📊 Extracted ${equipment.length} equipment items`);
    return equipment;
  }
  
  /**
   * Extract department/service data from KoboToolbox
   */
  private extractDepartmentData(rawData: any): any[] {
    const departments: any[] = [];
    
    // Common KoboToolbox field names for departments/services
    const departmentGroups = [
      rawData.group_department,
      rawData.departments,
      rawData.services_offered,
      rawData.group_services
    ].filter(Boolean);
    
    departmentGroups.forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(item => {
          departments.push({
            name: item.department_name || item.name || item.service_name || 'Unknown Department',
            type: item.department_type || item.type || item.service_type || 'General',
            staffCount: parseInt(item.staff_count || item.staff || '0'),
            operational: item.operational === 'yes' || item.is_operational === 'yes' || true
          });
        });
      }
    });
    
    console.log(`📊 Extracted ${departments.length} departments`);
    return departments;
  }

  /**
   * Helper method to extract array from comma-separated string or existing array
   */
  private extractArrayFromString(value: string | string[] | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return [];
  }

  /**
   * Map raw electricity source to our enum value
   * Always returns a valid ElectricitySource enum value (never null)
   */
  private mapElectricitySource(source: string): ElectricitySource {
    if (!source) {
      return ElectricitySource.NONE;
    }
    
    const lowerSource = source.toLowerCase();
    
    if (lowerSource.includes('solar')) return ElectricitySource.SOLAR;
    if (lowerSource.includes('diesel') || lowerSource.includes('generator')) 
      return ElectricitySource.DIESEL_GENERATOR;
    if (lowerSource.includes('grid')) return ElectricitySource.NATIONAL_GRID;
    if (lowerSource.includes('mini_grid') || lowerSource.includes('mini-grid')) 
      return ElectricitySource.MINI_GRID;
    if (lowerSource.includes('hybrid')) return ElectricitySource.HYBRID;
    if (lowerSource === 'other') return ElectricitySource.OTHER;
    if (lowerSource === 'none' || lowerSource === 'no electricity') return ElectricitySource.NONE;
    
    console.warn(`Unknown electricity source: "${source}", defaulting to OTHER`);
    return ElectricitySource.OTHER; // Default to OTHER instead of null for unknown values
  }

  /**
   * Map raw transport access to our enum value
   * Always returns a valid TransportAccess enum value (never null)
   */
  private mapTransportAccess(access: string): TransportAccess {
    if (!access) {
      return TransportAccess.DIFFICULT_ACCESS;
    }
    
    const lowerAccess = access.toLowerCase().replace(/\s+/g, '_');
    
    if (lowerAccess in TransportAccess) {
      return TransportAccess[lowerAccess as keyof typeof TransportAccess];
    }
    
    // Try to match common descriptions to enum values
    if (lowerAccess.includes('unpaved') || lowerAccess.includes('dirt') || lowerAccess.includes('gravel')) {
      return TransportAccess.UNPAVED_ROAD;
    }
    if (lowerAccess.includes('paved') || lowerAccess.includes('good') || lowerAccess.includes('excellent')) {
      return TransportAccess.PAVED_ROAD;
    }
    if (lowerAccess.includes('seasonal') || lowerAccess.includes('weather') || lowerAccess.includes('rain')) {
      return TransportAccess.SEASONAL_ACCESS;
    }
    if (lowerAccess.includes('difficult') || lowerAccess.includes('poor') || lowerAccess.includes('no_access')) {
      return TransportAccess.DIFFICULT_ACCESS;
    }
    
    console.warn(`Unknown transport access: "${access}", defaulting to DIFFICULT_ACCESS`);
    return TransportAccess.DIFFICULT_ACCESS; // Default to DIFFICULT_ACCESS instead of null
  }

  /**
   * Process a single survey
   * @param rawSurveyData Raw survey data to import
   * @returns Success status
   */
  private async processSurvey(rawSurveyData: any): Promise<boolean> {
    const surveyId = rawSurveyData.id || rawSurveyData._id || 'unknown';
    console.log(`📝 Processing survey ${surveyId}...`);
    console.log(`📋 Raw survey data keys:`, Object.keys(rawSurveyData));
    
    try {
      // DEBUGGING: Log the entire survey data structure
      console.log(`🔍 FULL SURVEY DATA STRUCTURE:`, JSON.stringify(rawSurveyData, null, 2));
      
      // Check if this data is already transformed by the provider
      let surveyData: TransformedSurveyData;
      
      if (rawSurveyData && rawSurveyData.facilityData && rawSurveyData.externalId) {
        // Data is already transformed by the provider - use it directly
        console.log(`✅ Data already transformed by provider. External ID: ${rawSurveyData.externalId}`);
        console.log(`📊 Facility data available:`, {
          name: rawSurveyData.facilityData.name,
          region: rawSurveyData.facilityData.region,
          district: rawSurveyData.facilityData.district,
          facilityType: rawSurveyData.facilityData.facilityType,
          equipmentCount: rawSurveyData.facilityData.equipment?.length || 0
        });
        surveyData = rawSurveyData as TransformedSurveyData;
      } else {
        // Data is raw - transform it using our comprehensive logic
        console.log(`🔄 Transforming raw survey data for ${surveyId}...`);
        console.log(`🔍 BEFORE TRANSFORMATION - Raw data sample:`, {
          _id: rawSurveyData._id,
          keys: Object.keys(rawSurveyData),
          facilityName: rawSurveyData['general_information/Name_HF'],
          location: rawSurveyData['general_information/location'],
          _geolocation: rawSurveyData._geolocation
        });
        
        surveyData = this.transformSurveyData(rawSurveyData);
        console.log(`✅ Survey data transformed. External ID: ${surveyData.externalId}`);
        console.log(`🔍 AFTER TRANSFORMATION:`, {
          externalId: surveyData.externalId,
          facilityDataKeys: Object.keys(surveyData.facilityData || {}),
          facilityName: surveyData.facilityData?.name,
          rawDataKeys: Object.keys(surveyData.rawData || {})
        });
      }
      
      // Start a transaction for atomic operations
      console.log(`🔄 Starting database transaction for survey ${surveyData.externalId}...`);
      return await sequelize.transaction(async (transaction) => {
        try {
          console.log(`🏥 Getting or creating facility for survey ${surveyData.externalId}...`);
          
          // Get or create the facility
          const facility = await this.getOrCreateFacility(surveyData, transaction) as any;
          console.log(`✅ Facility ready. ID: ${facility.id}`);
          
          // Check for existing survey with the same externalId
          console.log(`🔍 Checking for existing survey with external ID: ${surveyData.externalId}`);
          const existingSurvey = await Survey.findOne({
            where: { externalId: surveyData.externalId },
            transaction
          });

          if (existingSurvey) {
            console.log(`ℹ️ Survey ${surveyData.externalId} already exists, skipping...`);
            return true; // Consider this a success case
          }

          // Create the survey record
          console.log(`💾 Creating survey record for ${surveyData.externalId}...`);
          console.log(`📊 Survey data to create:`, {
            externalId: surveyData.externalId,
            facilityId: facility.id,
            facilityDataKeys: Object.keys(surveyData.facilityData || {}),
            collectionDate: surveyData.collectionDate,
            respondentId: surveyData.respondentId
          });
          
          const createdSurvey = await Survey.create({
            externalId: String(surveyData.externalId), // Convert to string for database compatibility
            facilityId: facility.id,
            facilityData: surveyData.facilityData,
            rawData: surveyData.rawData, // CRITICAL FIX: Store original survey responses
            collectionDate: surveyData.collectionDate,
            respondentId: surveyData.respondentId
          }, { transaction });

          console.log(`✅ Successfully created survey ${surveyData.externalId} with DB ID: ${(createdSurvey as any).id}`);
          return true;
        } catch (transactionError) {
          console.error(`❌ TRANSACTION ERROR for survey ${surveyData.externalId}:`, {
            errorName: transactionError instanceof Error ? transactionError.name : 'Unknown',
            errorMessage: transactionError instanceof Error ? transactionError.message : String(transactionError),
            errorStack: transactionError instanceof Error ? transactionError.stack : undefined,
            surveyExternalId: surveyData.externalId,
            facilityDataPresent: !!surveyData.facilityData,
            facilityName: surveyData.facilityData?.name,
            facilityType: surveyData.facilityData?.facilityType
          });
          throw transactionError;
        }
      });
    } catch (error) {
      console.error(`❌ SURVEY PROCESSING ERROR for ${surveyId}:`, {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorStack: error instanceof Error ? error.stack : undefined,
        surveyId: surveyId,
        rawDataKeys: Object.keys(rawSurveyData || {}),
        hasTransformedData: !!(rawSurveyData?.facilityData && rawSurveyData?.externalId)
      });
      
      // Log specific error types for better debugging
      if (error instanceof Error && error.name === 'SequelizeValidationError') {
        console.error(`🔍 VALIDATION ERROR DETAILS:`, {
          errors: (error as any).errors?.map((e: any) => ({
            field: e.path,
            message: e.message,
            value: e.value,
            type: e.type
          }))
        });
      }
      
      if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
        console.error(`🔍 UNIQUE CONSTRAINT ERROR:`, {
          fields: (error as any).fields,
          table: (error as any).table,
          constraint: (error as any).constraint
        });
      }
      
      if (error instanceof Error && error.name === 'SequelizeForeignKeyConstraintError') {
        console.error(`🔍 FOREIGN KEY ERROR:`, {
          fields: (error as any).fields,
          table: (error as any).table,
          relatedTable: (error as any).relatedTable
        });
      }
      
      return false;
    }
  }

  /**
   * Get existing facility or create new one
   * @param surveyData Survey data containing facility information
   * @param transaction Database transaction
   * @returns Facility record
   */
  private async getOrCreateFacility(surveyData: TransformedSurveyData, transaction: Transaction) {
    console.log('🏥 Getting or creating facility...');
    
    try {
      // CRITICAL FIX: Extract facility name from the correct location
      // Our comprehensive extraction logic stores facility data in facilityData.name
      const facilityName = surveyData?.facilityData?.name || 
                          surveyData?.rawData?.responses?.facility_name || 
                          'Unknown Facility';
      console.log(`- Looking for facility with name: "${facilityName}"`);
      
      // Try to find existing facility
      let facility = await Facility.findOne({
        where: {
          name: facilityName
        },
        transaction
      });
      
      console.log(`- Existing facility found: ${facility ? 'Yes' : 'No'}`);
      
      if (!facility) {
        console.log('- Creating new facility with required fields...');
        
        // Extract location data from survey if available
        let latitude = 0;
        let longitude = 0;
        
        // KoboToolbox stores GPS in _geolocation array format
        if (surveyData?.rawData?._geolocation && Array.isArray(surveyData.rawData._geolocation)) {
          const geoLocation = surveyData.rawData._geolocation;
          if (geoLocation.length >= 2) {
            latitude = this.safeExtractNumber(geoLocation[0], 0);
            longitude = this.safeExtractNumber(geoLocation[1], 0);
            console.log(`📍 GPS extracted from _geolocation: [${latitude}, ${longitude}]`);
          }
        } else {
          // Fallback: try other possible GPS field locations
          latitude = this.safeExtractNumber(
            surveyData?.rawData?.responses?.latitude || 
            surveyData?.rawData?.latitude ||
            surveyData?.facilityData?.latitude,
            0
          );
          
          longitude = this.safeExtractNumber(
            surveyData?.rawData?.responses?.longitude || 
            surveyData?.rawData?.longitude ||
            surveyData?.facilityData?.longitude,
            0
          );
          console.log(`📍 GPS extracted from fallback fields: [${latitude}, ${longitude}]`);
        }
        
        console.log(`📍 Final GPS coordinates: [${latitude}, ${longitude}]`);
        
        // CRITICAL FIX: Force facility type to 'healthcare' to avoid enum violations
        let facilityType = 'healthcare'; // Always use valid enum value
        console.log(`- Using facility type: "${facilityType}"`);
        console.log(`- Original facility type from data: "${surveyData?.facilityData?.facilityType}"`);
        
        // Create with all required fields
        facility = await Facility.create({
          name: facilityName,
          type: facilityType,
          latitude: latitude,
          longitude: longitude,
          status: 'survey'
        }, { transaction });
        
        console.log(`✅ Created new facility: ${facilityName} (ID: ${(facility as any).id})`);
      } else {
        console.log(`✅ Using existing facility: ${facilityName} (ID: ${(facility as any).id})`);
      }
      
      return facility;
    } catch (error) {
      console.error('❌ Error in getOrCreateFacility:');
      console.error(`- Error name: ${error instanceof Error ? error.name : 'Unknown'}`);
      console.error(`- Error message: ${error instanceof Error ? error.message : String(error)}`);
      throw error; // Re-throw for handling in caller
    }
  }

  /**
   * Import data from CSV file
   * @param filePath Path to the CSV file
   * @param transaction Database transaction
   * @returns Summary of the import operation
   */
  async importFromCsv(filePath: string, transaction?: Transaction): Promise<ImportSummary> {
    try {
      console.log(`📄 Starting CSV import from: ${filePath}`);
      
      const fs = require('fs');
      const csv = require('csv-parser');
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`CSV file not found: ${filePath}`);
      }
      
      const results: any[] = [];
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data: any) => results.push(data))
          .on('end', async () => {
            try {
              console.log(`📊 Parsed ${results.length} rows from CSV`);
              
              let imported = 0;
              let failed = 0;
              
              for (const row of results) {
                try {
                  // Transform CSV row to survey format
                  const transformedData = this.transformCsvRowToSurvey(row);
                  const success = await this.processSurvey(transformedData);
                  
                  if (success) {
                    imported++;
                  } else {
                    failed++;
                  }
                } catch (error) {
                  console.error('Error processing CSV row:', error);
                  failed++;
                }
              }
              
              resolve({
                success: failed === 0,
                imported,
                failed,
                message: `CSV import completed: ${imported} imported, ${failed} failed`
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('CSV import failed:', error);
      return {
        success: false,
        imported: 0,
        failed: 0,
        message: `CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }



/**
 * Transform CSV row to survey data format
 * @param row CSV row data
 * @returns Transformed survey data
 */
private transformCsvRowToSurvey(row: any): TransformedSurveyData {
  // Start with default facility data to ensure all required properties
  const facilityData = this.createDefaultFacilityData();
  
  // Override with CSV data where available
  facilityData.name = row.facility_name || 'Unknown Facility';
  facilityData.region = row.region || 'Unknown Region';
  facilityData.district = row.district || 'Unknown District';
  facilityData.facilityType = row.facility_type || 'health_facility';
  facilityData.electricitySource = this.mapElectricitySource(row.electricity_source || 'unknown');
  
  // Handle arrays
  if (row.productive_sectors) {
    facilityData.productiveSectors = row.productive_sectors.split(',').map((s: string) => s.trim());
  }
  if (row.subsector_activities) {
    facilityData.subsectorActivities = row.subsector_activities.split(',').map((s: string) => s.trim());
  }
  if (row.core_services) {
    facilityData.coreServices = row.core_services.split(',').map((s: string) => s.trim());
  }
  
  // Handle infrastructure
  if (row.water_access !== undefined) {
    facilityData.infrastructure.waterAccess = row.water_access === 'true' || row.water_access === true;
  }
  if (row.national_grid !== undefined) {
    facilityData.infrastructure.nationalGrid = row.national_grid === 'true' || row.national_grid === true;
  }
  if (row.transport_access) {
    facilityData.infrastructure.transportationAccess = this.mapTransportAccess(row.transport_access);
  }
  
  // Handle buildings
  if (row.buildings_total !== undefined) {
    facilityData.buildings.total = this.safeExtractNumber(row.buildings_total, 1);
  }
  if (row.departments_with_wiring !== undefined) {
    facilityData.buildings.departmentsWithWiring = this.safeExtractNumber(row.departments_with_wiring, 0);
  }
  if (row.rooms !== undefined) {
    facilityData.buildings.rooms = this.safeExtractNumber(row.rooms, 1);
  }
  if (row.rooms_with_connection !== undefined) {
    facilityData.buildings.roomsWithConnection = this.safeExtractNumber(row.rooms_with_connection, 0);
  }
  
  // Handle operational hours
  if (row.operational_hours_day !== undefined) {
    facilityData.operationalHours.day = this.safeExtractNumber(row.operational_hours_day, 8);
  }
  if (row.operational_hours_night !== undefined) {
    facilityData.operationalHours.night = this.safeExtractNumber(row.operational_hours_night, 0);
  }
  
  // Handle GPS coordinates
  if (row.latitude !== undefined) {
    facilityData.latitude = this.safeExtractNumber(row.latitude);
  }
  if (row.longitude !== undefined) {
    facilityData.longitude = this.safeExtractNumber(row.longitude);
  }
  
  return {
    externalId: row.facility_id || `csv_${Date.now()}_${Math.random()}`,
    facilityData,
    collectionDate: new Date(),
    respondentId: row.respondent_id || 'csv_import',
    rawData: row // Include original CSV row data
  };
}

/**
 * Transform external API data to survey format using mapping configuration
 * @param record API record data
 * @param mapping Data mapping configuration
 * @returns Transformed survey data
 */
private transformApiDataToSurvey(record: any, mapping: any): TransformedSurveyData {
  // Start with default facility data to ensure all required properties
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
  if (mapping.facilityType && record[mapping.facilityType]) {
    facilityData.facilityType = record[mapping.facilityType];
  }
  if (mapping.electricitySource && record[mapping.electricitySource]) {
    facilityData.electricitySource = this.mapElectricitySource(record[mapping.electricitySource]);
  }
  if (mapping.transportAccess && record[mapping.transportAccess]) {
    facilityData.infrastructure.transportationAccess = this.mapTransportAccess(record[mapping.transportAccess]);
  }
  
  return {
    externalId: record[mapping.facilityId] || `api_${Date.now()}_${Math.random()}`,
    facilityData,
    collectionDate: new Date(),
    respondentId: record[mapping.respondentId] || 'api_import',
    rawData: record // Include original API record data
  };
}

/**
 * Safely extract a number from potentially undefined/non-numeric values
 * @param value Value to extract as number
 * @param defaultValue Default value if extraction fails
 * @returns Extracted number or default
 */
private safeExtractNumber(value: any, defaultValue: number = 0): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Import from external API using provided URL and data mapping
 * @param apiUrl URL of the external API
 * @param apiKey Optional API key for authentication
 * @param dataMapping Mapping configuration for transforming API data
 * @param transaction Database transaction
 * @returns Import summary
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
    const axios = require('axios');
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

} // End of DataImportService class

/**
 * Import operation summary
 */
export interface ImportSummary {
  success: boolean;
  imported: number;
  failed: number;
  message: string;
}
