// Test script to verify DataImportService functionality
console.log('🔍 Testing DataImportService...');

async function testDataImportService() {
  console.log('1. Testing module imports...');
  
  try {
    // Import required modules
    const { DataImportService } = await import('../src/services/dataImportService');
    const { sequelize } = await import('../src/models');
    
    console.log('✅ Successfully imported required modules');
    
    // Test database connection
    console.log('\n2. Testing database connection...');
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return;
    }
    
    // Test DataImportService instantiation
    console.log('\n3. Testing DataImportService instantiation...');
    try {
      const importService = new DataImportService();
      console.log('✅ Successfully created DataImportService instance');
      
      // List available methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(importService))
        .filter(method => method !== 'constructor' && typeof importService[method as keyof typeof importService] === 'function');
      
      console.log('\n4. Available methods in DataImportService:');
      methods.forEach((method, index) => console.log(`   ${index + 1}. ${method}`));
      
    } catch (serviceError) {
      console.error('❌ Error creating DataImportService:', serviceError);
      return;
    }
    
  } catch (importError) {
    console.error('❌ Error importing modules:', importError);
    return;
  }
  
  console.log('\n✨ DataImportService test completed!');
}

// Run the test
testDataImportService().catch(console.error);
