// Test script to directly require the DataImportService with exact filename case
console.log('🔍 Testing direct require of DataImportService...');

// Helper function to log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Path to the DataImportService with exact case
const servicePath = path.join(__dirname, '..', 'src', 'services', 'dataImportService.ts');
log(`1. Using DataImportService path: ${servicePath}`);

// Check if the file exists
const fs = require('fs');
const path = require('path');

if (fs.existsSync(servicePath)) {
  log('   - File exists');
  
  // Test 2: Directly require the module
  log('2. Attempting to require the module...');
  
  try {
    // Clear the require cache to ensure a fresh import
    delete require.cache[require.resolve(servicePath)];
    
    // Require the module
    const module = require(servicePath);
    log('   - Successfully required the module');
    
    // Log the exported keys
    const exportedKeys = Object.keys(module);
    log(`   - Exported keys: ${exportedKeys.join(', ')}`);
    
    // Check if DataImportService is exported
    if ('DataImportService' in module) {
      log('   - Found DataImportService in exports');
      
      // Try to create an instance
      log('3. Attempting to create DataImportService instance...');
      try {
        const service = new module.DataImportService();
        log('   - Successfully created DataImportService instance');
        
        // List available methods
        const methods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(service)
        ).filter(m => m !== 'constructor' && typeof service[m] === 'function');
        
        log(`   - Available methods: ${methods.join(', ')}`);
        
      } catch (error) {
        log(`❌ Error creating DataImportService instance: ${error.message}`);
        if (error.stack) {
          log('   - Stack trace (first 3 lines):');
          log(error.stack.split('\n').slice(0, 3).join('\n'));
        }
      }
    } else {
      log('❌ DataImportService not found in exports');
    }
    
  } catch (error) {
    log(`❌ Error requiring the module: ${error.message}`);
    if (error.code) log(`   - Error code: ${error.code}`);
    if (error.requireStack) {
      log('   - Require stack:');
      error.requireStack.slice(0, 3).forEach((path, i) => 
        log(`      ${i+1}. ${path}`)
      );
    }
    
    if (error.stack) {
      log('   - Stack trace (first 3 lines):');
      log(error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
  
} else {
  log(`❌ File not found at: ${servicePath}`);
  
  // List files in the directory for debugging
  const dir = path.join(__dirname, '..', 'src', 'services');
  log(`\nListing files in: ${dir}`);
  
  try {
    const files = fs.readdirSync(dir);
    log('Files in directory:');
    files.forEach((file, i) => log(`   ${i+1}. ${file}`));
  } catch (error) {
    log(`   - Error listing directory: ${error.message}`);
  }
}

log('\n🏁 Test script completed');
