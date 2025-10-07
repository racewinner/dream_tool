// Test script to check module resolution
console.log('🔍 Starting module resolution test...');

async function testModuleResolution() {
  console.log('1. Testing basic console output...');
  console.log('   - Basic console.log is working');
  
  // Test file system operations
  try {
    console.log('\n2. Testing file system operations...');
    const fs = await import('fs');
    const path = await import('path');
    
    const currentDir = process.cwd();
    console.log('   - Current working directory:', currentDir);
    
    // Check if the DataImportService file exists
    const servicePath = path.join(currentDir, 'src', 'services', 'dataImportService.ts');
    console.log('   - Checking if DataImportService exists at:', servicePath);
    
    const exists = fs.existsSync(servicePath);
    console.log(`   - DataImportService ${exists ? 'exists' : 'does not exist'}`);
    
    if (exists) {
      console.log('   - File stats:', fs.statSync(servicePath));
    }
    
  } catch (error) {
    console.error('❌ Error in file system operations:', error);
  }
  
  // Test module import
  try {
    console.log('\n3. Testing module import...');
    
    // Try to import a core module
    console.log('   - Testing core module import...');
    const util = await import('util');
    console.log('   - Successfully imported core module: util');
    
    // Try to import a local module
    console.log('   - Testing local module import...');
    const models = await import('../src/models');
    console.log('   - Successfully imported local module: models');
    
    // Try to import the problematic service
    console.log('\n4. Testing DataImportService import...');
    try {
      const { DataImportService } = await import('../src/services/dataImportService');
      console.log('   - Successfully imported DataImportService');
      
      // If we get here, try to create an instance
      console.log('   - Testing DataImportService instantiation...');
      const service = new DataImportService();
      console.log('   - Successfully created DataImportService instance');
      
    } catch (serviceError) {
      console.error('❌ Error with DataImportService:', serviceError);
      console.error('Stack:', serviceError instanceof Error ? serviceError.stack : 'No stack trace');
    }
    
  } catch (importError) {
    console.error('❌ Error importing modules:', importError);
    console.error('Stack:', importError instanceof Error ? importError.stack : 'No stack trace');
  }
  
  console.log('\n✨ Module resolution test completed');
}

// Run the test
testModuleResolution().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
});
