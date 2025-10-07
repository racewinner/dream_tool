// Simple test script to verify basic functionality
console.log('===== Starting Test Script =====');
console.log('Current directory:', process.cwd());

// Try to require the DataImportService
try {
  console.log('\n===== Testing DataImportService =====');
  const { DataImportService } = require('../services/dataImportService');
  console.log('✅ DataImportService loaded successfully');
  
  // Create an instance
  const importService = new DataImportService();
  console.log('✅ DataImportService instance created');
  
  // Test connection
  console.log('\n===== Testing Database Connection =====');
  importService.testConnection()
    .then(() => {
      console.log('✅ Database connection successful');
      
      // Test importing a survey
      console.log('\n===== Testing Survey Import =====');
      return importService.importSurveyById('test123');
    })
    .then(result => {
      console.log('✅ Import test completed');
      console.log('Result:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Error during test:', error);
    });
} catch (error) {
  console.error('❌ Error loading DataImportService:', error);
}
