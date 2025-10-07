// Test script to check TypeScript/Node.js environment
console.log('🔍 Testing TypeScript/Node.js environment...');

// Test 1: Basic console output
console.log('1. Basic console output test: PASS');

// Test 2: TypeScript features
const testObj = { a: 1, b: 2 };
const spreadTest = { ...testObj, c: 3 };
console.log('2. TypeScript spread operator test:', JSON.stringify(spreadTest));

// Test 3: Dynamic import (ESM style)
console.log('3. Testing dynamic import...');

// Use an IIFE for top-level await
(async () => {
  try {
    // Test 3.1: Core module import
    const util = await import('util');
    console.log('   3.1 Core module import test: PASS');
    
    // Test 3.2: Local module import
    const models = await import('../src/models');
    console.log('   3.2 Local module import test: PASS');
    
    // Test 3.3: DataImportService import
    console.log('   3.3 Attempting to import DataImportService...');
    const { DataImportService } = await import('../src/services/dataImportService');
    console.log('       DataImportService import test: PASS');
    
    // Test 3.4: Create DataImportService instance
    console.log('   3.4 Attempting to create DataImportService instance...');
    const service = new DataImportService();
    console.log('       DataImportService instantiation test: PASS');
    
  } catch (error) {
    console.error('❌ Error in dynamic imports:');
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
  }
})();

// This will run after the IIFE
console.log('4. Main thread continues...');

// Keep the process alive for async operations
setTimeout(() => {
  console.log('\n✨ Environment test completed');
}, 5000);
