// Debug script for DataImportService import issues
console.log('🔍 Starting debug script for DataImportService...');

async function debugDataImportService() {
  console.log('1. Starting debug process...');
  
  // Test basic TypeScript features
  console.log('2. Testing basic TypeScript features...');
  const testObj = { a: 1, b: 2 };
  console.log('   - Object spread test:', { ...testObj, c: 3 });
  
  // Test module imports
  console.log('\n3. Testing module imports...');
  
  try {
    console.log('   - Attempting to import DataImportService...');
    const modulePath = '../src/services/dataImportService';
    console.log(`   - Module path: ${modulePath}`);
    
    // Try dynamic import
    const module = await import(modulePath);
    console.log('   - Successfully imported module:', Object.keys(module));
    
    if (module.DataImportService) {
      console.log('   - Found DataImportService in module');
      
      try {
        console.log('   - Attempting to create DataImportService instance...');
        const importService = new module.DataImportService();
        console.log('   - Successfully created DataImportService instance');
        
        // List available methods
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(importService))
          .filter(method => method !== 'constructor' && typeof importService[method as keyof typeof importService] === 'function');
        
        console.log('\n4. Available methods in DataImportService:');
        methods.forEach((method, index) => console.log(`   ${index + 1}. ${method}`));
        
      } catch (instanceError) {
        console.error('❌ Error creating DataImportService instance:', instanceError);
        console.error('Stack:', instanceError instanceof Error ? instanceError.stack : 'No stack trace available');
      }
      
    } else {
      console.error('❌ DataImportService not found in module');
    }
    
  } catch (importError) {
    console.error('❌ Error importing module:', importError);
    console.error('Stack:', importError instanceof Error ? importError.stack : 'No stack trace available');
    
    // Try to get more details about the error
    if (importError instanceof Error && 'code' in importError) {
      console.error('Error code:', (importError as any).code);
    }
  }
  
  console.log('\n✨ Debug script completed');
}

// Run the debug
debugDataImportService().catch(error => {
  console.error('Unhandled error in debug script:', error);
  process.exit(1);
});
