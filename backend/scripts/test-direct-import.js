// Minimal test using CommonJS require to avoid any TypeScript/ts-node issues
console.log('🔍 Starting direct import test...');

// Test basic functionality
console.log('1. Testing basic functionality...');
console.log('   - Basic console.log is working');

// Test importing a core module
try {
  console.log('2. Testing core module import...');
  const util = require('util');
  console.log('   - Successfully required core module: util');
} catch (error) {
  console.error('❌ Error requiring core module:', error);
  process.exit(1);
}

// Test importing the service directly
try {
  console.log('\n3. Attempting to require DataImportService...');
  const { DataImportService } = require('../dist/services/dataImportService');
  console.log('   - Successfully required DataImportService');
  
  // Try to create an instance
  console.log('   - Attempting to create DataImportService instance...');
  const service = new DataImportService();
  console.log('   - Successfully created DataImportService instance');
  
  // Log available methods
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
    .filter(method => method !== 'constructor' && typeof service[method] === 'function');
  
  console.log('   - Available methods:', methods.join(', '));
  
} catch (error) {
  console.error('❌ Error with DataImportService:');
  console.error('   - Error name:', error.name);
  console.error('   - Error message:', error.message);
  console.error('   - Error stack:', error.stack || 'No stack trace');
  
  // Check for specific error codes or properties
  if (error.code) console.error('   - Error code:', error.code);
  if (error.requireStack) console.error('   - Require stack:', error.requireStack);
  
  process.exit(1);
}

console.log('\n✨ Direct import test completed');
