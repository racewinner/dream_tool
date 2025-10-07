// Test script to verify dynamic imports in TypeScript/Node.js
console.log('🔍 Testing dynamic imports...');

// Simple function to log with timestamps
function log(message: string) {
  const now = new Date();
  const timestamp = now.toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Test 1: Basic dynamic import
async function testBasicImport() {
  try {
    log('1. Testing basic dynamic import...');
    const util = await import('util');
    log('   - Successfully imported util module');
    log(`   - util.types.isDate(new Date()): ${util.types.isDate(new Date())}`);
    return true;
  } catch (error) {
    log(`❌ Basic import failed: ${error.message}`);
    return false;
  }
}

// Test 2: Local module import
async function testLocalImport() {
  try {
    log('2. Testing local module import...');
    const models = await import('../src/models');
    log('   - Successfully imported models module');
    log(`   - Models: ${Object.keys(models).join(', ')}`);
    return true;
  } catch (error) {
    log(`❌ Local module import failed: ${error.message}`);
    if (error.stack) {
      log(`   - Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
    }
    return false;
  }
}

// Test 3: DataImportService import
async function testServiceImport() {
  try {
    log('3. Testing DataImportService import...');
    
    // First, try to import the module without destructuring
    log('   3.1 Importing module...');
    const module = await import('../src/services/dataImportService');
    log('      - Successfully imported dataImportService module');
    
    // Check what's exported
    const exports = Object.keys(module);
    log(`      - Module exports: ${exports.join(', ')}`);
    
    // Try to access DataImportService
    if ('DataImportService' in module) {
      log('   3.2 Found DataImportService in exports');
      
      // Try to create an instance
      log('   3.3 Creating DataImportService instance...');
      const service = new module.DataImportService();
      log('      - Successfully created DataImportService instance');
      
      // List available methods
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(service)
      ).filter(m => m !== 'constructor' && typeof service[m] === 'function');
      
      log(`      - Available methods: ${methods.join(', ')}`);
      return true;
    } else {
      log('❌ DataImportService not found in module exports');
      return false;
    }
  } catch (error) {
    log(`❌ DataImportService import failed: ${error.message}`);
    if (error.stack) {
      log(`   - Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting dynamic import tests...');
  
  const results = {
    basicImport: await testBasicImport(),
    localImport: await testLocalImport(),
    serviceImport: await testServiceImport()
  };
  
  log('\n📊 Test Results:');
  log(`1. Basic import: ${results.basicImport ? '✅ PASS' : '❌ FAIL'}`);
  log(`2. Local module import: ${results.localImport ? '✅ PASS' : '❌ FAIL'}`);
  log(`3. DataImportService import: ${results.serviceImport ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.basicImport && results.localImport && results.serviceImport) {
    log('\n✨ All tests passed successfully!');
  } else {
    log('\n❌ Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Unhandled error in test runner: ${error.message}`);
  if (error.stack) {
    log(`   - Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
  }
  process.exit(1);
});

// Keep the process alive for async operations
setTimeout(() => {
  log('\n🏁 Test script completed');
}, 10000);
