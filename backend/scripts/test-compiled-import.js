// Test script using compiled JavaScript output
console.log('🔍 Testing compiled JavaScript import...');

// Helper function to log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Test basic functionality
log('1. Testing basic functionality...');
log('   - Basic console.log is working');

// Test importing a core module
try {
  log('2. Testing core module import...');
  const util = require('util');
  log('   - Successfully required core module: util');
} catch (error) {
  log(`❌ Error requiring core module: ${error.message}`);
  process.exit(1);
}

// Test importing the compiled service
try {
  log('\n3. Attempting to require compiled DataImportService...');
  
  // Try to import the compiled version
  const compiledPath = require.resolve('../dist/services/dataImportService');
  log(`   - Resolved module path: ${compiledPath}`);
  
  // Import the module
  const dataImportModule = require(compiledPath);
  log('   - Successfully required compiled module');
  
  // Log all exports
  const exportNames = Object.keys(dataImportModule);
  log(`   - Module exports: ${exportNames.join(', ')}`);
  
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
        .filter(method => method !== 'constructor' && typeof service[method] === 'function');
      
      log(`   - Available methods: ${methods.join(', ')}`);
      
    } catch (instanceError) {
      log(`❌ Error creating DataImportService instance: ${instanceError.message}`);
      if (instanceError.stack) {
        log(`   - Stack trace: ${instanceError.stack.split('\n').slice(0, 3).join('\n      ')}`);
      }
    }
    
  } else {
    log('❌ DataImportService not found in exports');
    log('   - Available exports:', JSON.stringify(exportNames, null, 2));
  }
  
} catch (error) {
  log(`❌ Error with compiled module import: ${error.message}`);
  if (error.stack) {
    log(`   - Stack trace: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
  }
  
  // Additional debug information
  if (error.code === 'MODULE_NOT_FOUND') {
    log('   - This is a module not found error');
    if (error.requireStack) {
      log('   - Require stack:');
      error.requireStack.slice(0, 3).forEach((path, i) => log(`      ${i+1}. ${path}`));
    }
  }
  
  process.exit(1);
}

log('\n✨ Compiled import test completed');
