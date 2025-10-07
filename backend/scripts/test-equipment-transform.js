// Simple script to test equipment data transformation
const { ExternalDataCollectionProvider } = require('../dist/services/providers/dataCollectionProvider');
const { DataImportService } = require('../dist/services/dataImportService');
const { sequelize } = require('../dist/models');
const { Survey, Facility } = require('../dist/models');

async function testEquipmentTransform() {
  console.log('🚀 Starting equipment data transformation test...');
  
  // Initialize provider
  const provider = new ExternalDataCollectionProvider();
  
  try {
    // Step 1: Fetch a single survey from the API
    console.log('\n🔍 Fetching survey from API...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6); // Last 6 months
    
    const surveys = await provider.getSurveys(startDate, endDate);
    
    if (!surveys || surveys.length === 0) {
      console.log('❌ No surveys found in the specified date range');
      return;
    }
    
    // Find a survey with equipment data
    const testSurvey = surveys.find(s => s.facilityData?.equipment?.length > 0) || surveys[0];
    console.log(`✅ Using survey ${testSurvey.externalId}`);
    
    // Log raw equipment data from API
    console.log('\n📊 Raw equipment data from API:');
    console.log(JSON.stringify(testSurvey.facilityData?.equipment || [], null, 2));
    
    if (!testSurvey.facilityData?.equipment?.length) {
      console.log('❌ No equipment data found in the survey');
      return;
    }
    
    // Step 2: Test the transformation
    console.log('\n🔄 Testing equipment data transformation...');
    const importService = new DataImportService();
    const transformedData = importService.transformSurveyData(testSurvey);
    
    console.log('\n📊 Transformed equipment data:');
    console.log(JSON.stringify(transformedData.facilityData.equipment || [], null, 2));
    
    // Step 3: Check if transformation preserved all equipment items
    const originalCount = testSurvey.facilityData.equipment.length;
    const transformedCount = transformedData.facilityData.equipment?.length || 0;
    
    console.log(`\n🔍 Equipment count - Original: ${originalCount}, Transformed: ${transformedCount}`);
    
    if (originalCount !== transformedCount) {
      console.log(`❌ Equipment count mismatch: Original=${originalCount}, Transformed=${transformedCount}`);
    } else {
      console.log('✅ Equipment count matches');
    }
    
    // Step 4: Check for any differences in equipment items
    const differences = [];
    const originalEquipment = testSurvey.facilityData.equipment;
    const transformedEquipment = transformedData.facilityData.equipment || [];
    
    for (let i = 0; i < Math.max(originalEquipment.length, transformedEquipment.length); i++) {
      const original = originalEquipment[i];
      const transformed = transformedEquipment[i];
      
      if (!original || !transformed) {
        differences.push(`Missing item at index ${i}: ${!original ? 'Original' : 'Transformed'}`);
        continue;
      }
      
      // Compare properties
      const props = ['name', 'powerRating', 'quantity', 'hoursPerDay', 'hoursPerNight', 'timeOfDay', 'weeklyUsage'];
      for (const prop of props) {
        if (original[prop] !== transformed[prop]) {
          differences.push(`Mismatch at item ${i}.${prop}: Original=${original[prop]}, Transformed=${transformed[prop]}`);
        }
      }
    }
    
    if (differences.length > 0) {
      console.log('\n❌ Found differences in equipment data:');
      differences.forEach(diff => console.log(`- ${diff}`));
    } else {
      console.log('✅ All equipment data matches');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
  } finally {
    try {
      await sequelize.close();
    } catch (e) {
      console.error('Error closing database connection:', e);
    }
  }
}

// Run the test
testEquipmentTransform()
  .then(() => console.log('\n🏁 Test completed'))
  .catch(console.error);
