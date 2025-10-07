// Minimal test script to verify TypeScript/ts-node execution
console.log('🔍 Testing TypeScript/ts-node execution...');

// Test basic TypeScript features
const testObj = { a: 1, b: 2 };
const spreadTest = { ...testObj, c: 3 };
console.log('1. TypeScript features test:', spreadTest);

// Test dynamic import
async function testDynamicImport() {
  try {
    console.log('2. Testing dynamic import...');
    const util = await import('util');
    console.log('   - Successfully imported util module');
    
    // Try to import a local module
    console.log('3. Testing local module import...');
    const models = await import('../src/models');
    console.log('   - Successfully imported local module: models');
    
    // Try to import the problematic service
    console.log('4. Testing DataImportService import...');
    const { DataImportService } = await import('../src/services/dataImportService');
    console.log('   - Successfully imported DataImportService');
    
    // Try to create an instance
    console.log('5. Testing DataImportService instantiation...');
    const service = new DataImportService();
    console.log('   - Successfully created DataImportService instance');
    
  } catch (error) {
    console.error('❌ Error in dynamic import test:');
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
      console.error('   - Stack trace:');
      console.error(error.stack.split('\n').slice(0, 5).join('\n'));
    }
    
    process.exit(1);
  }
}

// Run the test
testDynamicImport()
  .then(() => console.log('\n✨ TypeScript/ts-node test completed'))
  .catch(console.error);
