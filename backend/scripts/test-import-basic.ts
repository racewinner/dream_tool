console.log('🔍 Starting basic import test...');

// Simple test to verify script execution
console.log('✅ Script is running!');
console.log('Current working directory:', process.cwd());

// Try to import the DataImportService
try {
  console.log('\n🔍 Attempting to import DataImportService...');
  const { DataImportService } = await import('../src/services/dataImportService');
  console.log('✅ Successfully imported DataImportService');
  
  // Create an instance of the service
  console.log('\n🔍 Creating DataImportService instance...');
  const importService = new DataImportService();
  console.log('✅ Successfully created DataImportService instance');
  
  // Test the service methods
  console.log('\n🔍 Testing DataImportService methods...');
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(importService)));
  
} catch (error) {
  console.error('❌ Error in basic import test:', error);
}

console.log('\n✨ Basic import test completed!');
