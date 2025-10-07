/**
 * Full data import test script
 * 
 * This script tests the complete data import process from the external API 
 * to database persistence using mock data
 */

console.log('===== Starting test-full-data-import.ts script =====');

import '../config'; // Load configuration first
import { DataImportService } from '../services/dataImportService';
import { 
  ExternalDataCollectionProvider, 
  TransformedSurveyData,
  DataCollectionError
} from '../services/providers/dataCollectionProvider';
import { sequelize } from '../models';

/**
 * Create a mock implementation of the ExternalDataCollectionProvider
 * for controlled testing
 */
class MockDataCollectionProvider extends ExternalDataCollectionProvider {
  private mockSuccessData: TransformedSurveyData[] = [];
  private shouldFail: boolean = false;
  private failureMode: 'network' | 'timeout' | 'validation' | 'server' = 'network';
  
  constructor() {
    super();
    // Initialize with some mock data
    this.setupMockData();
  }
  
  /**
   * Set up mock survey data for testing
   */
  private setupMockData() {
    console.log('Setting up mock survey data for testing');
    
    // Create 3 mock survey entries
    for (let i = 1; i <= 3; i++) {
      this.mockSuccessData.push({
        externalId: `mock-survey-${i.toString().padStart(3, '0')}`,
        collectionDate: new Date(),
        respondentId: `mock-respondent-${i.toString().padStart(3, '0')}`,
        facilityData: {
          productiveSectors: ['Healthcare'],
          subsectorActivities: ['Primary care'],
          ownership: i % 2 === 0 ? 'Public' : 'Private',
          catchmentPopulation: 1000 * i,
          coreServices: ['Outpatient services', 'Immunization'],
          electricitySource: 'Grid',
          electricityReliability: 'Frequent outages',
          electricityAvailability: '8-12 hours',
          operationalDays: 6,
          operationalHours: {
            day: 8,
            night: i > 1 ? 4 : 0
          },
          criticalNeeds: ['Reliable power', 'Medical equipment'],
          supportStaff: 5 + i,
          technicalStaff: 2 + i,
          nightStaff: i > 1,
          buildings: {
            total: 2,
            departmentsWithWiring: 2,
            rooms: 6 + i,
            roomsWithConnection: 4 + i
          },
          equipment: {
            refrigerator: true,
            freezer: i > 1,
            ultrasound: i === 3,
            xray: false,
            ventilator: i === 3,
            ecg: i > 1,
            otherEquipment: i === 3 ? ['Centrifuge', 'Microscope'] : []
          },
          infrastructure: {
            waterAccess: true,
            internetAccess: i > 1,
            cellSignal: true
          }
        },
        // Include raw data for reference
        rawData: {
          id: `mock-survey-${i.toString().padStart(3, '0')}`,
          timestamp: new Date().toISOString(),
          respondent: {
            id: `mock-respondent-${i.toString().padStart(3, '0')}`,
            name: `Test Respondent ${i}`,
            email: `respondent${i}@example.com`
          },
          responses: {
            facility_name: `Test Facility ${i}`,
            productive_sectors: ['Healthcare'],
            subsector_activities: ['Primary care'],
            ownership: i % 2 === 0 ? 'Public' : 'Private',
            catchment_population: 1000 * i,
            // Other fields would be populated here
          },
          metadata: {
            source: 'mock-data',
            test_run: true
          }
        }
      });
    }
    
    console.log(`Created ${this.mockSuccessData.length} mock surveys for testing`);
  }
  
  /**
   * Configure the mock provider for different test scenarios
   */
  public configureForTest(options: {
    shouldFail?: boolean;
    failureMode?: 'network' | 'timeout' | 'validation' | 'server';
  }) {
    this.shouldFail = options.shouldFail || false;
    this.failureMode = options.failureMode || 'network';
    
    console.log(`Mock provider configured: shouldFail=${this.shouldFail}, mode=${this.failureMode}`);
  }
  
  /**
   * Mock implementation that returns controlled data or fails predictably
   */
  async getSurveys(startDate: Date, endDate: Date): Promise<TransformedSurveyData[]> {
    console.log(`Mock getSurveys called with dates: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    if (this.shouldFail) {
      console.log(`Simulating ${this.failureMode} failure`);
      this.simulateFailure();
    }
    
    // Simulate a delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Returning ${this.mockSuccessData.length} mock surveys`);
    return [...this.mockSuccessData];
  }
  
  /**
   * Mock implementation for single survey retrieval
   */
  async getSurveyById(surveyId: string): Promise<TransformedSurveyData> {
    console.log(`Mock getSurveyById called with ID: ${surveyId}`);
    
    if (this.shouldFail) {
      console.log(`Simulating ${this.failureMode} failure`);
      this.simulateFailure();
    }
    
    // Simulate a delay for realism
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const survey = this.mockSuccessData.find(s => s.externalId === surveyId);
    
    if (!survey) {
      throw new DataCollectionError(`Survey with ID ${surveyId} not found`, {
        statusCode: 404,
        errorCode: 'SURVEY_NOT_FOUND'
      });
    }
    
    console.log(`Returning mock survey with ID: ${surveyId}`);
    return survey;
  }
  
  /**
   * Simulate different types of failures
   */
  private simulateFailure() {
    switch (this.failureMode) {
      case 'network':
        throw new DataCollectionError('Unable to connect to data collection API', {
          errorCode: 'CONNECTION_REFUSED'
        });
      
      case 'timeout':
        throw new DataCollectionError('API connection timed out', {
          errorCode: 'CONNECTION_TIMEOUT'
        });
      
      case 'validation':
        throw new DataCollectionError('Invalid request parameters', {
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
          responseData: { 
            error: 'Bad Request',
            message: 'Invalid date range' 
          }
        });
      
      case 'server':
        throw new DataCollectionError('Internal server error', {
          statusCode: 500,
          errorCode: 'SERVER_ERROR'
        });
        
      default:
        throw new DataCollectionError('Unknown error occurred');
    }
  }
}

/**
 * Test database connection and setup
 */
async function testDatabaseSetup(): Promise<boolean> {
  console.log('🔄 Testing database connection...');
  
  try {
    // Test connection with small timeout
    await sequelize.authenticate({ timeout: 5000 });
    console.log('✅ Database connection successful');
    
    // Check if needed tables exist
    // You could add more checks here if needed
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Test data import functionality
 */
async function testDataImport(): Promise<boolean> {
  console.log('\n===== Starting test-full-data-import.ts script =====');
  
  // Check database tables first
  console.log('\n🔍 VERIFYING DATABASE STRUCTURE');
  try {
    // Check if tables exist
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`📊 Found ${tables.length} tables in database:`);
    tables.forEach((table: any) => console.log(`  - ${table.table_name}`));
    
    // Check survey table structure
    const [surveyColumns] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'surveys' ORDER BY ordinal_position"
    ) as [any[], any];
    
    console.log('\n📋 Survey table structure:');
    if (surveyColumns.length === 0) {
      console.error('❌ Survey table not found in database!');
    } else {
      surveyColumns.forEach((col: any) => console.log(`  - ${col.column_name}: ${col.data_type}`));
    }
    
    // Check facility table structure
    const [facilityColumns] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'facilities' ORDER BY ordinal_position"
    ) as [any[], any];
    
    console.log('\n📋 Facility table structure:');
    if (facilityColumns.length === 0) {
      console.error('❌ Facility table not found in database!');
    } else {
      facilityColumns.forEach((col: any) => console.log(`  - ${col.column_name}: ${col.data_type}`));
    }
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
  }
  
  // Initialize test components
  const mockProvider = new MockDataCollectionProvider();
  const importService = new DataImportService();
  (importService as any).provider = mockProvider;
  
  try {
    // Test 1: Successful import
    console.log('\n📋 TEST 1: Successful data import');
    mockProvider.configureForTest({ shouldFail: false });
    
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');
    
    // Verify Facility and Survey model structure before import
    console.log('\n🔍 Verifying model structures before import:');
    const facilityModel = sequelize.models.Facility;
    const surveyModel = sequelize.models.Survey;
    
    if (facilityModel) {
      console.log('📊 Facility model structure:');
      console.log(`- Table name: ${facilityModel.tableName}`);
      console.log(`- Attributes: ${Object.keys(facilityModel.getAttributes()).join(', ')}`);
    } else {
      console.error('❌ Facility model not found in Sequelize!');
    }
    
    if (surveyModel) {
      console.log('📊 Survey model structure:');
      console.log(`- Table name: ${surveyModel.tableName}`);
      console.log(`- Attributes: ${Object.keys(surveyModel.getAttributes()).join(', ')}`);
    } else {
      console.error('❌ Survey model not found in Sequelize!');
    }
    
    // Execute and time the import operation
    console.log('\n⏱️ Starting import operation...');
    const startTime = Date.now();
    const result1 = await importService.importSurveysByDateRange(startDate, endDate);
    const endTime = Date.now();
    console.log(`⏱️ Import completed in ${(endTime - startTime)/1000} seconds`);
    console.log('Import result:', result1);
    
    if (!result1.success) {
      console.error('❌ Expected successful import but got failure');
      return false;
    }
    
    // Test 2: Error handling (network error)
    console.log('\n📋 TEST 2: Network error handling');
    mockProvider.configureForTest({ shouldFail: true, failureMode: 'network' });
    
    const result2 = await importService.importSurveysByDateRange(startDate, endDate);
    console.log('Import result (should fail):', result2);
    
    if (result2.success) {
      console.error('❌ Expected failure but got success');
      return false;
    }
    
    // Test 3: Single survey import
    console.log('\n📋 TEST 3: Single survey import');
    mockProvider.configureForTest({ shouldFail: false });
    
    const result3 = await importService.importSurveyById('mock-survey-001');
    console.log('Import result:', result3);
    
    if (!result3.success) {
      console.error('❌ Expected successful single import but got failure');
      return false;
    }
    
    console.log('\n✅ All data import tests completed');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during data import tests:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting full data import test...');
  
  const results = {
    database: false,
    dataImport: false
  };
  
  // Step 1: Test database connection
  results.database = await testDatabaseSetup();
  
  if (!results.database) {
    console.error('❌ Database connection failed, cannot proceed with import tests');
    return false;
  }
  
  // Step 2: Test data import
  results.dataImport = await testDataImport();
  
  // Output summary
  console.log('\n📋 Test Summary:');
  console.log('-------------------');
  console.log(`Database connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Data import: ${results.dataImport ? '✅ PASS' : '❌ FAIL'}`);
  console.log('-------------------');
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`Overall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  console.log('⏱️ Test start time:', new Date().toISOString());
  runTests()
    .then(success => {
      console.log('⏱️ Test end time:', new Date().toISOString());
      process.exit(success ? 0 : 1);
    })
    .catch((error: any) => {
      console.error('❌ Unexpected error during tests:', error?.message || 'Unknown error');
      console.log('⏱️ Test end time:', new Date().toISOString());
      process.exit(1);
    });
}
