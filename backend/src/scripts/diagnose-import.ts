/**
 * Detailed diagnostic script for survey data import
 * 
 * This script traces the complete data flow from mock data through the import process,
 * with detailed logging at each step to pinpoint exactly where failures occur.
 */

console.log('===== Starting detailed import diagnosis =====');

try {
  console.log('Loading config and imports...');
  require('../config'); // Load environment variables first
  
  // Separate import statements to identify any problematic imports
  console.log('Importing sequelize...');
  const { sequelize } = require('../models');
  console.log('Sequelize imported successfully');
  
  console.log('Importing DataImportService...');
  const { DataImportService } = require('../services/dataImportService');
  console.log('DataImportService imported successfully');
  
  console.log('Importing ExternalDataCollectionProvider and TransformedSurveyData...');
  const { 
    ExternalDataCollectionProvider, 
    TransformedSurveyData 
  } = require('../services/providers/dataCollectionProvider');
  console.log('ExternalDataCollectionProvider and TransformedSurveyData imported successfully');
  
  console.log('Importing util...');
  const util = require('util');
  console.log('All imports successful');
} catch (importError) {
  console.error('ERROR DURING IMPORTS:');
  console.error(importError);
  process.exit(1);
}

// Get the model references from sequelize
const Survey = sequelize.models.Survey;
const Facility = sequelize.models.Facility;

class DiagnosticDataImportService extends DataImportService {
  // Expose protected/private methods for diagnostic purposes
  public async diagnoseProcessSurvey(surveyData: TransformedSurveyData): Promise<any> {
    console.log('\n====== DIAGNOSTIC SURVEY PROCESSING ======');
    
    let transaction;
    try {
      console.log('🔍 Verifying Sequelize connection and models...');
      console.log(`- Sequelize initialized: ${sequelize ? 'Yes' : 'No'}`);
      console.log(`- Survey model: ${Survey ? 'Found' : 'Not found'}`);
      console.log(`- Survey tableName: ${Survey?.tableName || 'undefined'}`);
      console.log(`- Facility model: ${Facility ? 'Found' : 'Not found'}`);
      console.log(`- Facility tableName: ${Facility?.tableName || 'undefined'}`);
      
      // Check if tables exist in database
      console.log('\n🔍 Checking actual database tables...');
      const [tables] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
      ) as [any[], any];
      
      const tableNames = tables.map((t: any) => t.table_name);
      console.log(`- Database tables found: ${tableNames.join(', ')}`);
      console.log(`- 'surveys' table exists: ${tableNames.includes('surveys') ? 'Yes' : 'No'}`);
      console.log(`- 'facilities' table exists: ${tableNames.includes('facilities') ? 'Yes' : 'No'}`);
      
      // Check survey table structure
      if (tableNames.includes('surveys')) {
        const [surveyColumns] = await sequelize.query(
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'surveys' ORDER BY ordinal_position"
        ) as [any[], any];
        console.log(`- Survey table columns: ${surveyColumns.map((c: any) => c.column_name).join(', ')}`);
      }
      
      console.log('\n⚠️ STARTING TRANSACTION...');
      transaction = await sequelize.transaction();
      console.log('✅ Transaction started');
      
      // Log incoming survey data 
      console.log('\n📋 INCOMING SURVEY DATA (SANITIZED):');
      console.log(util.inspect({
        externalId: surveyData.externalId,
        collectionDate: surveyData.collectionDate,
        respondentId: surveyData.respondentId,
        facilityDataKeys: Object.keys(surveyData.facilityData),
      }, { depth: 1, colors: false }));
      
      // Step 1: Check for existing survey
      console.log('\n🔍 STEP 1: Checking for existing survey...');
      const existingSurvey = await Survey.findOne({
        where: { externalId: surveyData.externalId },
        transaction
      });
      
      console.log(`- Existing survey found: ${existingSurvey ? 'Yes' : 'No'}`);
      
      if (existingSurvey) {
        console.log('- Survey already exists, skipping further processing');
        await transaction.commit();
        console.log('✅ Transaction committed - survey skipped (already exists)');
        return true;
      }
      
      // Step 2: Get or create facility
      console.log('\n🔍 STEP 2: Getting or creating facility...');
      
      // Extract facility name for search/creation
      const facilityName = surveyData.rawData?.responses?.facility_name || 'Unknown Facility';
      console.log(`- Facility name from survey data: "${facilityName}"`);
      
      // Try to find existing facility
      let facility = await Facility.findOne({
        where: { name: facilityName },
        transaction
      });
      
      console.log(`- Existing facility found: ${facility ? 'Yes' : 'No'}`);
      
      if (!facility) {
        console.log('- Creating new facility...');
        try {
          // Create new facility with required fields
          facility = await Facility.create({
            name: facilityName,
            type: 'healthcare', // Default type
            latitude: 0, // Default values for required fields
            longitude: 0, // Default values for required fields
            status: 'survey'
          }, { transaction });
          
          console.log(`✅ New facility created with ID: ${facility.id}`);
        } catch (facilityError) {
          console.error('❌ ERROR CREATING FACILITY:');
          console.error(`- Error type: ${facilityError instanceof Error ? facilityError.constructor.name : typeof facilityError}`);
          console.error(`- Error message: ${facilityError instanceof Error ? facilityError.message : String(facilityError)}`);
          throw facilityError; // Re-throw to handle in outer catch
        }
      } else {
        console.log(`- Using existing facility with ID: ${facility.id}`);
      }
      
      // Step 3: Create survey record
      console.log('\n🔍 STEP 3: Creating survey record...');
      
      try {
        // Log the survey data we'll attempt to create
        console.log('- Survey creation payload:');
        const surveyPayload = {
          externalId: surveyData.externalId,
          facilityId: facility.id,
          facilityData: surveyData.facilityData,
          collectionDate: surveyData.collectionDate,
          respondentId: surveyData.respondentId
        };
        console.log(util.inspect(surveyPayload, { depth: 1, colors: false }));
        
        // Create survey record
        const survey = await Survey.create(surveyPayload, { transaction });
        
        console.log(`✅ Survey created successfully with ID: ${survey.id}`);
      } catch (surveyError) {
        console.error('❌ ERROR CREATING SURVEY:');
        console.error(`- Error type: ${surveyError instanceof Error ? surveyError.constructor.name : typeof surveyError}`);
        console.error(`- Error message: ${surveyError instanceof Error ? surveyError.message : String(surveyError)}`);
        
        // Additional error details for Sequelize errors
        if (surveyError.name === 'SequelizeValidationError') {
          console.error('- Validation errors:');
          for (const validationError of surveyError.errors) {
            console.error(`  - ${validationError.path}: ${validationError.message}`);
          }
        } else if (surveyError.name === 'SequelizeDatabaseError') {
          console.error('- Database error (likely data type mismatch or constraint violation)');
          console.error('- SQL state:', surveyError.original?.code);
          
          // Check if it's a column type mismatch
          const typeMismatchMatch = surveyError.message.match(/column "([^"]+)" is of type ([^ ]+) but expression is of type ([^ ]+)/);
          if (typeMismatchMatch) {
            console.error(`- Column type mismatch: column "${typeMismatchMatch[1]}" expects ${typeMismatchMatch[2]} but received ${typeMismatchMatch[3]}`);
            
            // Inspect the problematic value if possible
            if (surveyData[typeMismatchMatch[1]]) {
              console.error(`- Problem value: ${util.inspect(surveyData[typeMismatchMatch[1]], { depth: 2 })}`);
            }
          }
        }
        
        throw surveyError; // Re-throw to handle in outer catch
      }
      
      // Step 4: Commit transaction
      console.log('\n🔍 STEP 4: Committing transaction...');
      await transaction.commit();
      console.log('✅ Transaction committed successfully');
      
      return true;
    } catch (error) {
      console.error('\n❌ ERROR DURING SURVEY PROCESSING:');
      console.error(`- Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
      console.error(`- Error message: ${error instanceof Error ? error.message : String(error)}`);
      
      if (error instanceof Error && error.stack) {
        console.error('\n- Stack trace:');
        console.error(error.stack.split('\n').slice(0, 10).join('\n'));
      }
      
      // Rollback transaction if it was started
      if (transaction) {
        try {
          console.log('\n⚠️ Rolling back transaction...');
          await transaction.rollback();
          console.log('✅ Transaction rolled back');
        } catch (rollbackError) {
          console.error('❌ ERROR DURING ROLLBACK:');
          console.error(`- Error message: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }
      
      return false;
    }
  }
  
  // Expose the method to get or create a facility for testing
  public async diagnoseGetOrCreateFacility(surveyData: TransformedSurveyData): Promise<any> {
    const transaction = await sequelize.transaction();
    
    try {
      const facilityName = surveyData.rawData?.responses?.facility_name || 'Test Facility';
      console.log(`Looking for facility with name: "${facilityName}"`);
      
      let facility = await Facility.findOne({
        where: { name: facilityName },
        transaction
      });
      
      if (!facility) {
        console.log('Facility not found, creating new one...');
        
        // Get the model attributes to see what fields are required
        const facilityAttributes = Facility.getAttributes();
        console.log('Facility model attributes:', Object.keys(facilityAttributes));
        
        const requiredFields = Object.entries(facilityAttributes)
          .filter(([_, attr]) => attr.allowNull === false && !attr.defaultValue && !attr.autoIncrement)
          .map(([key]) => key);
          
        console.log('Required fields for Facility:', requiredFields);
        
        // Create with all required fields
        facility = await Facility.create({
          name: facilityName,
          type: 'healthcare', // Default type
          latitude: 0, // Default values for required fields
          longitude: 0, // Default values for required fields
          status: 'survey'
        }, { transaction });
      }
      
      await transaction.commit();
      return facility;
    } catch (error) {
      console.error('Error in diagnoseGetOrCreateFacility:');
      console.error(error);
      await transaction.rollback();
      throw error;
    }
  }
}

class MockProvider extends ExternalDataCollectionProvider {
  private mockSurveys: TransformedSurveyData[] = [];
  
  constructor() {
    super();
    this.setupMockData();
  }
  
  private setupMockData() {
    // Create a single mock survey for testing
    this.mockSurveys.push({
      externalId: 'diagnostic-survey-001',
      collectionDate: new Date(),
      respondentId: 'test-user',
      facilityData: {
        productiveSectors: ['healthcare'],
        subsectorActivities: ['primary care'],
        ownership: 'public',
        catchmentPopulation: 5000,
        coreServices: ['outpatient', 'inpatient', 'emergency'],
        electricitySource: 'grid',
        electricityReliability: 'good',
        electricityAvailability: '24h',
        operationalDays: 7,
        operationalHours: {
          day: 12,
          night: 12
        },
        criticalNeeds: ['lighting', 'refrigeration'],
        supportStaff: 10,
        technicalStaff: 5,
        nightStaff: true,
        buildings: {
          total: 3,
          departmentsWithWiring: 3,
          rooms: 20,
          roomsWithConnection: 20
        },
        equipment: [
          {
            name: 'X-Ray',
            powerRating: 1500,
            quantity: 1,
            hoursPerDay: 8,
            hoursPerNight: 0,
            timeOfDay: 'morning',
            weeklyUsage: 5
          }
        ],
        infrastructure: {
          waterAccess: true,
          nationalGrid: true,
          transportationAccess: 'good',
          communication: 'phone',
          digitalConnectivity: 'broadband'
        }
      },
      rawData: {
        id: 'diagnostic-survey-001',
        timestamp: new Date().toISOString(),
        respondent: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com'
        },
        responses: {
          facility_name: 'Diagnostic Test Facility',
          productive_sectors: ['healthcare'],
          // Other fields would be populated here
        }
      }
    });
  }
  
  async getSurveyById(surveyId: string): Promise<TransformedSurveyData> {
    const survey = this.mockSurveys.find(s => s.externalId === surveyId);
    if (!survey) {
      throw new Error(`Survey with ID ${surveyId} not found`);
    }
    return survey;
  }
  
  async getSurveys(): Promise<TransformedSurveyData[]> {
    return [...this.mockSurveys];
  }
}

async function diagnoseImportProcess() {
  try {
    console.log('🔍 STEP 1: Checking database connection and tables');
    
    // Verify database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check tables
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`📊 Found ${tables.length} tables in database:`, tables.map(t => t.table_name).join(', '));
    
    // Set up diagnostic service with mock provider
    const mockProvider = new MockProvider();
    const diagnosticService = new DiagnosticDataImportService();
    (diagnosticService as any).provider = mockProvider;
    
    // Get a test survey from the mock provider
    console.log('\n🔍 STEP 2: Fetching test survey data');
    const testSurvey = await mockProvider.getSurveyById('diagnostic-survey-001');
    console.log(`✅ Test survey retrieved with ID: ${testSurvey.externalId}`);
    
    // Process survey through diagnostic service
    console.log('\n🔍 STEP 3: Processing test survey through diagnostic service');
    const result = await diagnosticService.diagnoseProcessSurvey(testSurvey);
    
    if (result) {
      console.log('✅ Survey processed successfully');
    } else {
      console.error('❌ Survey processing failed');
    }
    
    // Verify survey was actually saved
    console.log('\n🔍 STEP 4: Verifying survey was saved to database');
    const savedSurvey = await Survey.findOne({
      where: { externalId: testSurvey.externalId }
    });
    
    if (savedSurvey) {
      console.log('✅ Survey record found in database');
      console.log(`- Survey ID: ${savedSurvey.id}`);
      console.log(`- External ID: ${savedSurvey.externalId}`);
      console.log(`- Facility ID: ${savedSurvey.facilityId}`);
    } else {
      console.error('❌ Survey record not found in database');
    }
    
    return result;
  } catch (error) {
    console.error('❌ ERROR DURING DIAGNOSIS:');
    if (error instanceof Error) {
      console.error(`- Error name: ${error.name}`);
      console.error(`- Error message: ${error.message}`);
      console.error(`- Error stack: ${error.stack}`);
    } else {
      console.error('- Unknown error:', error);
    }
    return false;
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed');
  }
}

// Run the diagnostic
console.log(`⏱️ Diagnosis start time: ${new Date().toISOString()}`);

diagnoseImportProcess()
  .then(result => {
    console.log(`\n====== DIAGNOSIS SUMMARY ======`);
    console.log(`Result: ${result ? '✅ SUCCESS' : '❌ FAILURE'}`);
    console.log(`⏱️ Diagnosis end time: ${new Date().toISOString()}`);
    process.exit(result ? 0 : 1);
  })
  .catch(error => {
    console.error('\n====== UNHANDLED ERROR ======');
    console.error(error);
    console.log(`⏱️ Diagnosis end time: ${new Date().toISOString()}`);
    process.exit(1);
  });
