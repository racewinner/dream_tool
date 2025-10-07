// Simple JavaScript test to check equipment data flow
const { ExternalDataCollectionProvider } = require('../src/services/providers/dataCollectionProvider');
const { DataImportService } = require('../src/services/dataImportService');
const { sequelize, Survey, Facility } = require('../src/models');

async function testEquipmentImport() {
  console.log('🚀 Starting equipment import test...');
  
  // Initialize services
  const provider = new ExternalDataCollectionProvider();
  const importService = new DataImportService();
  
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
    
    const testSurvey = surveys[0];
    console.log(`✅ Fetched survey ${testSurvey.externalId}`);
    
    // Log equipment data from API
    const apiEquipment = testSurvey.facilityData?.equipment || [];
    console.log('\n📊 Equipment data from API:');
    console.log(JSON.stringify(apiEquipment, null, 2));
    
    if (apiEquipment.length === 0) {
      console.log('❌ No equipment data found in the survey');
      return;
    }
    
    // Step 2: Import the survey using the public import method
    console.log('\n🔄 Importing survey through import service...');
    const importResult = await importService.importSurveysByDateRange(startDate, endDate);
    
    if (!importResult.success) {
      console.log(`❌ Failed to import surveys: ${importResult.message}`);
      return;
    }
    
    console.log(`✅ Successfully imported ${importResult.imported} surveys`);
    
    // Step 3: Retrieve the saved survey from the database
    console.log('\n🔍 Retrieving saved survey from database...');
    const savedSurvey = await Survey.findOne({
      where: { externalId: testSurvey.externalId },
      include: [
        {
          model: Facility,
          as: 'facility'
        }
      ]
    });
    
    if (!savedSurvey) {
      console.log('❌ Failed to find saved survey in database');
      return;
    }
    
    // Log equipment data from database
    const dbEquipment = savedSurvey.facilityData?.equipment || [];
    console.log('\n📊 Equipment data from database:');
    console.log(JSON.stringify(dbEquipment, null, 2));
    
    // Step 4: Compare the equipment data
    console.log('\n🔍 Comparing equipment data...');
    
    console.log(`API equipment count: ${apiEquipment.length}`);
    console.log(`DB equipment count: ${dbEquipment.length}`);
    
    if (apiEquipment.length !== dbEquipment.length) {
      console.log(`❌ Equipment count mismatch: API=${apiEquipment.length}, DB=${dbEquipment.length}`);
    } else {
      console.log('✅ Equipment counts match');
    }
    
    // Check for any differences in equipment items
    const differences = [];
    
    for (let i = 0; i < Math.max(apiEquipment.length, dbEquipment.length); i++) {
      const apiItem = apiEquipment[i];
      const dbItem = dbEquipment[i];
      
      if (!apiItem || !dbItem) {
        differences.push(`Missing item at index ${i}: ${!apiItem ? 'API' : 'DB'}`);
        continue;
      }
      
      // Compare properties
      if (apiItem.name !== dbItem.name) {
        differences.push(`Mismatch at item ${i}.name: API=${apiItem.name}, DB=${dbItem.name}`);
      }
      if (apiItem.powerRating !== dbItem.powerRating) {
        differences.push(`Mismatch at item ${i}.powerRating: API=${apiItem.powerRating}, DB=${dbItem.powerRating}`);
      }
      if (apiItem.quantity !== dbItem.quantity) {
        differences.push(`Mismatch at item ${i}.quantity: API=${apiItem.quantity}, DB=${dbItem.quantity}`);
      }
      if (apiItem.hoursPerDay !== dbItem.hoursPerDay) {
        differences.push(`Mismatch at item ${i}.hoursPerDay: API=${apiItem.hoursPerDay}, DB=${dbItem.hoursPerDay}`);
      }
      if (apiItem.hoursPerNight !== dbItem.hoursPerNight) {
        differences.push(`Mismatch at item ${i}.hoursPerNight: API=${apiItem.hoursPerNight}, DB=${dbItem.hoursPerNight}`);
      }
      if (apiItem.timeOfDay !== dbItem.timeOfDay) {
        differences.push(`Mismatch at item ${i}.timeOfDay: API=${apiItem.timeOfDay}, DB=${dbItem.timeOfDay}`);
      }
      if (apiItem.weeklyUsage !== dbItem.weeklyUsage) {
        differences.push(`Mismatch at item ${i}.weeklyUsage: API=${apiItem.weeklyUsage}, DB=${dbItem.weeklyUsage}`);
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
testEquipmentImport()
  .then(() => console.log('\n🏁 Test completed'))
  .catch(console.error);
