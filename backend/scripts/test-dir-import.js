// Test script to investigate directory import issues
console.log('🔍 Testing directory imports...');

// Import path module for path manipulation
const path = require('path');
const fs = require('fs');

// Helper function to log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Test 1: Check if the models directory exists
const modelsDir = path.join(__dirname, '../src/models');
log(`1. Checking if models directory exists: ${modelsDir}`);

if (fs.existsSync(modelsDir)) {
  log('   - Directory exists');
  
  // List files in the directory
  const files = fs.readdirSync(modelsDir);
  log(`   - Files in directory: ${files.join(', ')}`);
  
  // Check for index.ts/index.js
  const hasIndex = files.includes('index.ts') || files.includes('index.js');
  log(`   - Has index file: ${hasIndex}`);
  
  if (hasIndex) {
    // Test 2: Try to import using require (CommonJS)
    log('\n2. Testing require() with directory path...');
    try {
      const models = require(modelsDir);
      log('   - Successfully required models directory');
      log(`   - Exported keys: ${Object.keys(models).join(', ')}`);
    } catch (error) {
      log(`❌ Error requiring models directory: ${error.message}`);
      if (error.code) log(`   - Error code: ${error.code}`);
    }
    
    // Test 3: Try to import using dynamic import
    log('\n3. Testing dynamic import with directory path...');
    import(modelsDir)
      .then(module => {
        log('   - Successfully dynamically imported models directory');
        log(`   - Exported keys: ${Object.keys(module).join(', ')}`);
      })
      .catch(error => {
        log(`❌ Error in dynamic import: ${error.message}`);
        if (error.code) log(`   - Error code: ${error.code}`);
      });
      
    // Test 4: Try to import using explicit index file path
    const indexPath = path.join(modelsDir, 'index.js');
    if (fs.existsSync(indexPath)) {
      log(`\n4. Testing import with explicit index file: ${indexPath}`);
      
      // First with require
      try {
        const models = require(indexPath);
        log('   - Successfully required index.js');
        log(`   - Exported keys: ${Object.keys(models).join(', ')}`);
      } catch (error) {
        log(`❌ Error requiring index.js: ${error.message}`);
      }
      
      // Then with dynamic import
      import(indexPath)
        .then(module => {
          log('   - Successfully dynamically imported index.js');
          log(`   - Exported keys: ${Object.keys(module).join(', ')}`);
        })
        .catch(error => {
          log(`❌ Error in dynamic import of index.js: ${error.message}`);
        });
    }
  }
} else {
  log('❌ Models directory does not exist');
}

// Keep the process alive for async operations
setTimeout(() => {
  log('\n🏁 Test script completed');
}, 5000);
