/**
 * End-to-End Test Script for DREAM TOOL
 * 
 * This script validates the complete data pipeline:
 * 1. Fetches data from KoboToolbox API
 * 2. Processes and imports it into the database
 * 3. Verifies data is accessible through API endpoints
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { Sequelize } from 'sequelize';
import { DataImportService } from '../src/services/dataImportService';
import { KoboToolboxProvider } from '../src/providers/dataCollectionProvider';
import db from '../src/models';

// Load environment variables
dotenv.config();

// Define test configuration
const TEST_CONFIG = {
  apiUrl: process.env.DATA_COLLECTION_API_URL,
  apiKey: process.env.DATA_COLLECTION_API_KEY,
  backendUrl: 'http://localhost:3001',
};

// Validate required environment variables
if (!TEST_CONFIG.apiUrl || !TEST_CONFIG.apiKey) {
  console.error('Missing required environment variables: DATA_COLLECTION_API_URL, DATA_COLLECTION_API_KEY');
  process.exit(1);
}

/**
 * Run end-to-end test
 */
async function runEndToEndTest() {
  console.log('Starting end-to-end test of the DREAM TOOL data pipeline');
  console.log('=====================================================');
  
  try {
    // STEP 1: Test KoboToolbox connection
    console.log('\n1. Testing KoboToolbox API connection...');
    const koboProvider = new KoboToolboxProvider();
    const surveys = await koboProvider.fetchSurveys();
    console.log(`✓ Successfully fetched ${surveys.length} surveys from KoboToolbox`);
    
    // STEP 2: Test data import into database
    console.log('\n2. Testing data import into database...');
    await testDataImport(koboProvider);
    
    // STEP 3: Test API endpoints
    console.log('\n3. Testing API endpoints...');
    await testApiEndpoints();
    
    console.log('\n✅ End-to-end test completed successfully!');
  } catch (error) {
    console.error('\n❌ End-to-end test failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

/**
 * Test data import into database
 */
async function testDataImport(koboProvider: KoboToolboxProvider) {
  // Create import service
  const importService = new DataImportService();
  
  // Fetch survey data from KoboToolbox
  const surveys = await koboProvider.fetchSurveys();
  
  if (surveys.length === 0) {
    console.log('No surveys found to import');
    return;
  }
  
  console.log(`Found ${surveys.length} surveys to import`);
  
  // Import surveys and track results
  let successCount = 0;
  let failureCount = 0;
  
  for (const survey of surveys.slice(0, 5)) { // Limit to 5 for testing
    try {
      await importService.importSurvey(survey);
      console.log(`✓ Successfully imported survey: ${survey.id}`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to import survey: ${survey.id}`, error);
      failureCount++;
    }
  }
  
  console.log(`Import results: ${successCount} succeeded, ${failureCount} failed`);
  
  // Verify data was saved to database
  const surveyCount = await db.Survey.count();
  const facilityCount = await db.Facility.count();
  
  console.log(`Database contains ${surveyCount} surveys and ${facilityCount} facilities`);
  
  if (surveyCount > 0 && facilityCount > 0) {
    console.log('✓ Data successfully saved to database');
  } else {
    throw new Error('Data import verification failed - no records found in database');
  }
}

/**
 * Test API endpoints
 */
async function testApiEndpoints() {
  const apiClient = axios.create({
    baseURL: TEST_CONFIG.backendUrl,
    validateStatus: () => true, // Don't throw on non-2xx
  });
  
  // Test health endpoint
  console.log('Testing API health endpoint...');
  const healthResponse = await apiClient.get('/health');
  
  if (healthResponse.status === 200) {
    console.log('✓ Health endpoint is responding properly');
  } else {
    throw new Error(`Health endpoint failed with status ${healthResponse.status}`);
  }
  
  // Test surveys endpoint
  console.log('Testing surveys endpoint...');
  const surveysResponse = await apiClient.get('/api/v1/surveys');
  
  if (surveysResponse.status === 200) {
    console.log(`✓ Surveys endpoint returned ${surveysResponse.data.length} surveys`);
    
    if (surveysResponse.data.length > 0) {
      // Test individual survey endpoint
      const surveyId = surveysResponse.data[0].id;
      const surveyResponse = await apiClient.get(`/api/v1/surveys/${surveyId}`);
      
      if (surveyResponse.status === 200) {
        console.log('✓ Individual survey endpoint is working');
      } else {
        throw new Error(`Individual survey endpoint failed with status ${surveyResponse.status}`);
      }
    }
  } else {
    throw new Error(`Surveys endpoint failed with status ${surveysResponse.status}`);
  }
  
  // Test facilities endpoint
  console.log('Testing facilities endpoint...');
  const facilitiesResponse = await apiClient.get('/api/v1/facilities');
  
  if (facilitiesResponse.status === 200) {
    console.log(`✓ Facilities endpoint returned ${facilitiesResponse.data.length} facilities`);
  } else {
    throw new Error(`Facilities endpoint failed with status ${facilitiesResponse.status}`);
  }
  
  // All API tests passed
  console.log('✓ All API endpoints are working correctly');
}

// Run the test
runEndToEndTest().catch(console.error);
