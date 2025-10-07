// Minimal test script to isolate DataImportService import issue
console.log('🔍 Starting isolated DataImportService test...');

// Simple function to log with timestamps
function log(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

async function testDataImportService() {
  log('1. Starting test...');
  
  try {
    // Test basic functionality first
    log('2. Testing basic functionality...');
    const testObj = { test: 'success' };
    log(`   - Basic test: ${JSON.stringify(testObj)}`);
    
    // Test importing a core module
    log('3. Testing core module import...');
    const util = await import('util');
    log('   - Successfully imported core module: util');
    
    // Test importing the service directly
    log('4. Attempting to import DataImportService...');
    
    try {
      // Import the module without destructuring to see what's exported
      const dataImportModule = await import('../src/services/dataImportService');
      log('   - Successfully imported dataImportService module');
      log(`   - Module exports: ${Object.keys(dataImportModule).join(', ')}`);
      
      // Check if DataImportService is in the exports
      if ('DataImportService' in dataImportModule) {
        log('   - Found DataImportService in exports');
        
        try {
          // Try to create an instance
          log('   - Attempting to create DataImportService instance...');
          const service = new dataImportModule.DataImportService();
          log('   - Successfully created DataImportService instance');
          
          // Log available methods
          const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
            .filter(method => method !== 'constructor' && typeof service[method as keyof typeof service] === 'function');
          
          log(`   - Available methods: ${methods.join(', ')}`);
          
        } catch (instanceError) {
          log(`❌ Error creating DataImportService instance: ${instanceError}`);
          if (instanceError instanceof Error) {
            log(`   - Error name: ${instanceError.name}`);
            log(`   - Error message: ${instanceError.message}`);
            log(`   - Error stack: ${instanceError.stack || 'No stack trace'}`);
          }
        }
        
      } else {
        log('❌ DataImportService not found in module exports');
      }
      
    } catch (importError) {
      log(`❌ Error importing dataImportService: ${importError}`);
      if (importError instanceof Error) {
        log(`   - Error name: ${importError.name}`);
        log(`   - Error message: ${importError.message}`);
        log(`   - Error stack: ${importError.stack || 'No stack trace'}`);
      }
    }
    
  } catch (error) {
    log(`❌ Unhandled error in test: ${error}`);
    if (error instanceof Error) {
      log(`   - Error name: ${error.name}`);
      log(`   - Error message: ${error.message}`);
      log(`   - Error stack: ${error.stack || 'No stack trace'}`);
    }
  }
  
  log('✨ Test completed');
}

// Run the test with error handling
(async () => {
  try {
    await testDataImportService();
  } catch (error) {
    console.error('FATAL: Unhandled error in test runner:', error);
    process.exit(1);
  }
})();
