import { ExternalDataCollectionProvider } from './services/providers/dataCollectionProvider';
import { config } from './config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Display API configuration for verification
console.log('== API Configuration ==');
console.log('DATA_COLLECTION_API_URL:', config.dataCollectionApiUrl);
console.log('API Key exists:', !!config.dataCollectionApiKey);

async function testDataCollectionProvider() {
  try {
    console.log('\n== Creating provider instance ==');
    const provider = new ExternalDataCollectionProvider();
    
    // Test getSurveys
    console.log('\n== Testing getSurveys ==');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Get last 30 days of surveys
    
    console.log(`Fetching surveys from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    const surveys = await provider.getSurveys(startDate, endDate);
    
    console.log(`\n== Retrieved ${surveys.length} surveys ==`);
    
    if (surveys.length > 0) {
      // Display a sample of the first survey
      console.log('\n== First Survey Sample ==');
      const sample = surveys[0];
      
      console.log('External ID:', sample.externalId);
      console.log('Collection Date:', sample.collectionDate);
      console.log('Respondent ID:', sample.respondentId);
      
      // Show key fields from the transformed FacilityData
      console.log('\n== Transformed FacilityData Sample ==');
      console.log('Ownership:', sample.facilityData.ownership);
      console.log('Catchment Population:', sample.facilityData.catchmentPopulation);
      console.log('Electricity Source:', sample.facilityData.electricitySource);
      console.log('Operational Days:', sample.facilityData.operationalDays);
      console.log('Operational Hours (day):', sample.facilityData.operationalHours.day);
      console.log('Infrastructure - Transport Access:', sample.facilityData.infrastructure.transportationAccess);
      
      // Check that enums are correctly mapped
      console.log('\n== Enum Mapping Check ==');
      console.log('Electricity Source (should be enum value):', sample.facilityData.electricitySource);
      
      // Check equipment data if available
      if (sample.facilityData.equipment && sample.facilityData.equipment.length > 0) {
        console.log('\n== Equipment Sample ==');
        console.log('First equipment item:', sample.facilityData.equipment[0]);
      }
    } else {
      console.log('No surveys found in date range - API may be empty or check connection settings');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDataCollectionProvider().then(() => {
  console.log('\nTest completed.');
}).catch(err => {
  console.error('Fatal error:', err);
});
