/**
 * Test script to verify data import with equipment preservation
 * 
 * This script:
 * 1. Imports a specific survey from KoboToolbox
 * 2. Verifies equipment data is correctly preserved during import
 * 3. Checks the database for correct storage of the data
 * 
 * Run with: npx ts-node scripts/test-data-import.ts
 */

import { DataImportService } from '../src/services/dataImportService';
import { sequelize } from '../src/models';
import { FacilityData } from '../src/models/survey';

/**
 * Get a specific survey by ID and verify equipment data
 */
async function testSurveyImport() {
  console.log('🧪 TESTING DATA IMPORT WITH EQUIPMENT PRESERVATION');
  console.log('================================================');

  try {
    // Create a new import service instance
    const importService = new DataImportService();
    console.log('✅ Import service created');

    // Import a specific survey by ID
    const surveyId = '643695471'; // Using a known survey ID from existing scripts
    console.log(`🔍 Importing survey with ID: ${surveyId}`);
    
    const importResult = await importService.importSurveyById(surveyId);
    console.log(`📊 Import result: ${JSON.stringify(importResult, null, 2)}`);

    // Check if import was successful
    if (!importResult.success) {
      console.error('❌ Import failed:', importResult.message);
      return;
    }

    // Verify the data in the database
    console.log('🔍 Checking database for imported survey...');
    const Survey = sequelize.models.Survey;
    
    const importedSurvey = await Survey.findOne({
      where: { externalId: surveyId }
    });

    if (!importedSurvey) {
      console.error('❌ Survey not found in database after import');
      return;
    }

    console.log('✅ Survey found in database');
    
    // Check equipment data specifically
    const facilityData = (importedSurvey as any).facilityData as FacilityData;
    const equipment = facilityData?.equipment || [];
    
    console.log(`📋 Found ${equipment.length} equipment items in imported survey`);
    
    if (equipment.length > 0) {
      console.log('📋 Sample equipment items:');
      equipment.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (${item.quantity}x) - ${item.hoursPerDay}hrs/day`);
      });
    } else {
      console.warn('⚠️ No equipment data found in imported survey');
    }
    
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Add process unhandled rejection handler for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Starting test script - environment check:');
console.log('- DATA_COLLECTION_API_URL:', process.env.DATA_COLLECTION_API_URL || 'Not set');
console.log('- DATA_COLLECTION_API_KEY:', process.env.DATA_COLLECTION_API_KEY ? 'Set (hidden)' : 'Not set');
console.log('- DATABASE_URL:', process.env.DATABASE_URL || 'Not set');

// Run the test
testSurveyImport().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
