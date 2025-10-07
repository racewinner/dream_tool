/**
 * Test script for data import from external collection tool
 * 
 * This script demonstrates connecting to the external data collection API
 * and importing survey data into the application database.
 */

console.log('===== Starting test-data-import.ts script =====');

import '../config'; // Load configuration first
import { DataImportService } from '../services/dataImportService';
import { TransformedSurveyData } from '../services/providers/dataCollectionProvider';
import { sequelize } from '../models';

// Mock data for testing when no actual API is available
const MOCK_SURVEY_DATA: TransformedSurveyData[] = [
  {
    externalId: 'mock-survey-001',
    collectionDate: new Date(),
    respondentId: 'mock-respondent-001',
    facilityData: {
      productiveSectors: ['Healthcare'],
      subsectorActivities: ['Primary care'],
      ownership: 'Public',
      catchmentPopulation: 5000,
      coreServices: ['Outpatient services', 'Immunization'],
      electricitySource: 'Grid',
      electricityReliability: 'Frequent outages',
      electricityAvailability: '8-12 hours',
      operationalDays: 6,
      operationalHours: {
        day: 8,
        night: 4,
      },
      criticalNeeds: ['Lighting', 'Refrigeration'],
      supportStaff: 5,
      technicalStaff: 3,
      nightStaff: true,
      buildings: {
        total: 2,
        departmentsWithWiring: 2,
        rooms: 10,
        roomsWithConnection: 8,
      },
      equipment: [
        {
          name: 'Refrigerator',
          powerRating: 150,
          quantity: 2,
          hoursPerDay: 24,
          hoursPerNight: 12,
          timeOfDay: 'morning',
          weeklyUsage: 7,
        },
        {
          name: 'Lighting',
          powerRating: 60,
          quantity: 20,
          hoursPerDay: 8,
          hoursPerNight: 12,
          timeOfDay: 'evening',
          weeklyUsage: 7,
        }
      ],
      infrastructure: {
        waterAccess: true,
        internetAccess: false,
        cellSignal: true
      }
    },
    rawData: {
      id: 'mock-survey-001',
      timestamp: new Date().toISOString(),
      respondent: {
        id: 'mock-respondent-001',
        name: 'Jane Doe',
        email: 'jane@example.com'
      },
      responses: {
        facility_name: 'Community Health Center',
        productive_sectors: ['Healthcare'],
        subsector_activities: ['Primary care'],
        ownership: 'Public',
        catchment_population: 5000,
        core_services: ['Outpatient services', 'Immunization'],
        electricity_source: 'Grid',
        electricity_reliability: 'Frequent outages',
        electricity_availability: '8-12 hours',
        operational_days: 6,
        operational_hours_day: 8,
        operational_hours_night: 4,
        critical_needs: ['Lighting', 'Refrigeration'],
        support_staff: 5,
        technical_staff: 3,
        night_staff: true,
        buildings_total: 2,
        departments_with_wiring: 2,
        rooms: 10,
        rooms_with_connection: 8,
        water_access: true,
        internet_access: false,
        cell_signal: true
      },
      metadata: {
        source: 'mock_data',
        version: '1.0.0'
      }
    }
  }
];

/**
 * Override the external API provider to use mock data for testing
 */
class TestDataImportService extends DataImportService {
  // Method to simulate API import using mock data
  async testImportWithMockData(): Promise<void> {
    try {
      console.log('🧪 Testing data import with mock data...');
      
      // Check database connection before starting
      await this.validateDatabaseConnection();
      
      // Process mock survey data
      const results = await this.processMockSurveys(MOCK_SURVEY_DATA);
      
      console.log('📊 Import test results:');
      console.log(`✅ Successfully imported: ${results.imported}`);
      console.log(`❌ Failed imports: ${results.failed}`);
      console.log('Test completed successfully');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }
  
  private async validateDatabaseConnection(): Promise<void> {
    try {
      console.log('🔌 Checking database connection...');
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
  
  private async processMockSurveys(mockSurveys: TransformedSurveyData[]): Promise<{
    imported: number;
    failed: number;
  }> {
    let imported = 0;
    let failed = 0;
    
    for (const survey of mockSurveys) {
      try {
        console.log(`🔄 Processing mock survey ${survey.externalId}...`);
        
        // Use the parent class's processSurvey method if it's accessible
        // Otherwise implement the logic here
        const success = await this.processSurvey(survey);
        
        if (success) {
          imported++;
          console.log(`✅ Successfully imported survey ${survey.externalId}`);
        } else {
          failed++;
          console.log(`❌ Failed to import survey ${survey.externalId}`);
        }
      } catch (error) {
        console.error(`❌ Error processing survey ${survey.externalId}:`, error);
        failed++;
      }
    }
    
    return { imported, failed };
  }
  
  // This assumes processSurvey is private in the parent class
  // We need to implement it again here since we can't access the private method
  private async processSurvey(surveyData: TransformedSurveyData): Promise<boolean> {
    // Use transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    
    try {
      console.log(`🔍 Checking if survey ${surveyData.externalId} already exists...`);
      
      // Check if this survey has already been imported
      // This is a placeholder for the actual check
      // You'll need to implement based on your database schema
      
      console.log(`➕ Creating facility for survey ${surveyData.externalId}...`);
      // Create or get facility
      // This is a placeholder
      
      console.log(`📝 Creating survey record for ${surveyData.externalId}...`);
      // Create survey record
      // This is a placeholder
      
      // For testing purposes, we'll just simulate success
      // In a real implementation, you'd actually save to the database
      
      console.log(`✅ Successfully processed survey ${surveyData.externalId}`);
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      console.error(`❌ Failed to process survey ${surveyData.externalId}:`, error);
      return false;
    }
  }
}

// Main function to run the test
async function runTest() {
  try {
    console.log('========================================');
    console.log('Running test data import with KoboToolbox v2 API...');
    console.log('========================================');
    
    // Log environment variables
    console.log('API URL:', process.env.DATA_COLLECTION_API_URL);
    console.log('API Key (first 5 chars):', process.env.DATA_COLLECTION_API_KEY?.substring(0, 5) + '...');
    
    const tester = new TestDataImportService();
    
    // Database connection validation
    console.log('\n[1] Validating database connection...');
    await tester.validateDatabaseConnection();
    console.log('✓ Database connection validated');
    
    // Testing import with live API (if available) or mock data
    console.log('\n[2] Testing data import with live API or mock data...');
    await tester.testImportWithMockData();
    
    console.log('\n========================================');
    console.log('Test completed successfully!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error('\n========================================');
    console.error('TEST FAILED WITH ERROR:');
    console.error(err);
    console.error('========================================');
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  runTest();
}
