// Minimal test script to isolate dynamic import issues
console.log('🔍 Starting isolated import test...');

// Test 1: Basic dynamic import
console.log('1. Testing basic dynamic import...');

import('util')
  .then(util => {
    console.log('   - Successfully imported util module');
    console.log(`   - util.types.isDate(new Date()): ${util.types.isDate(new Date())}`);
    
    // Test 2: Local module import
    console.log('\n2. Testing local module import...');
    return import('../src/models')
      .then(models => {
        console.log('   - Successfully imported models module');
        console.log(`   - Models: ${Object.keys(models).join(', ')}`);
        
        // Test 3: DataImportService import
        console.log('\n3. Testing DataImportService import...');
        return import('../src/services/dataImportService')
          .then(module => {
            console.log('   - Successfully imported dataImportService module');
            console.log(`   - Module exports: ${Object.keys(module).join(', ')}`);
            
            if ('DataImportService' in module) {
              console.log('   - Found DataImportService in exports');
              console.log('   - Attempting to create instance...');
              const service = new module.DataImportService();
              console.log('   - Successfully created DataImportService instance');
              
              const methods = Object.getOwnPropertyNames(
                Object.getPrototypeOf(service)
              ).filter(m => m !== 'constructor' && typeof service[m] === 'function');
              
              console.log(`   - Available methods: ${methods.join(', ')}`);
            } else {
              console.log('❌ DataImportService not found in exports');
            }
          });
      });
  })
  .catch(error => {
    console.error('❌ Error in import chain:');
    console.error('   - Error name:', error.name);
    console.error('   - Error message:', error.message);
    
    if (error.code) console.error('   - Error code:', error.code);
    if (error.requireStack) {
      console.error('   - Require stack:');
      error.requireStack.slice(0, 3).forEach((path, i) => 
        console.error(`      ${i+1}. ${path}`)
      );
    }
    
    if (error.stack) {
      console.error('   - Stack trace (first 5 lines):');
      console.error(error.stack.split('\n').slice(0, 5).join('\n'));
    }
    
    process.exit(1);
  });

// Keep the process alive for async operations
setTimeout(() => {
  console.log('\n🏁 Test script completed');
}, 10000);
