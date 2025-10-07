/**
 * Test script to verify DataImportService functionality
 */

import { DataImportService } from '../services/dataImportService';

console.log('===== Starting Test Script =====');
console.log('Current directory:', process.cwd());

async function runTests() {
  try {
    console.log('\n===== Testing DataImportService =====');
    const importService = new DataImportService();
    console.log('✅ DataImportService instance created');
    
    // Test database connection
    console.log('\n===== Testing Database Connection =====');
    await importService.testConnection();
    console.log('✅ Database connection successful');
    
    // Test importing a survey
    console.log('\n===== Testing Survey Import =====');
    const result = await importService.importSurveyById('test123');
    
    console.log('✅ Import test completed');
    console.log('\n===== Import Result =====');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);
