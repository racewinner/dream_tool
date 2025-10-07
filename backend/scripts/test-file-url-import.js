// Test script to investigate file:// URL imports in Node.js
console.log('🔍 Testing file:// URL imports...');

// Import necessary modules
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// Helper function to log with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Function to convert a file path to a file:// URL
function toFileUrl(filePath) {
  return pathToFileURL(path.resolve(filePath)).href;
}

// Test 1: Basic dynamic import with file:// URL
async function testFileUrlImport() {
  try {
    // Test with a core module first
    log('1. Testing core module import with file:// URL...');
    const utilUrl = toFileUrl(require.resolve('util'));
    log(`   - Using URL: ${utilUrl}`);
    
    const util = await import(utilUrl);
    log('   - Successfully imported util module');
    log(`   - util.types.isDate(new Date()): ${util.types.isDate(new Date())}`);
    
    // Test with a local module
    log('\n2. Testing local module import with file:// URL...');
    const modelsPath = path.join(__dirname, '../src/models/index.js');
    
    if (fs.existsSync(modelsPath)) {
      const modelsUrl = toFileUrl(modelsPath);
      log(`   - Using URL: ${modelsUrl}`);
      
      const models = await import(modelsUrl);
      log('   - Successfully imported models module');
      log(`   - Exported keys: ${Object.keys(models).join(', ')}`);
      
      // Try to access a model
      if ('Survey' in models) {
        log('   - Successfully accessed Survey model');
      } else {
        log('❌ Survey model not found in exports');
      }
    } else {
      log(`❌ Models file not found at: ${modelsPath}`);
    }
    
  } catch (error) {
    log(`❌ Error in file:// URL import: ${error.message}`);
    if (error.code) log(`   - Error code: ${error.code}`);
    if (error.stack) {
      log('   - Stack trace (first 3 lines):');
      log(error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
}

// Run the test
testFileUrlImport()
  .then(() => log('\n🏁 Test script completed'))
  .catch(error => {
    log(`❌ Unhandled error: ${error.message}`);
    if (error.stack) log(error.stack.split('\n').slice(0, 3).join('\n'));
  });
