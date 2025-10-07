// Configure environment first
process.env.DEBUG = 'kobo-import:*';
process.env.DEBUG_COLORS = 'true';

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🚀 Testing KoboToolbox import functionality...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

// Simple test function
async function testImport() {
  try {
    console.log('\n🔧 Loading DataImportService...');
    try {
      const modulePath = require.resolve('../dist/services/dataImportService');
      console.log(`✅ Found DataImportService at: ${modulePath}`);
      
      const { DataImportService } = require(modulePath);
      console.log('🚀 Creating DataImportService instance...');
      
      // Add debug event listeners
      process.on('unhandledRejection', (reason, promise) => {
        console.error('\n⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
      });
      
      process.on('uncaughtException', (error) => {
        console.error('\n⚠️  Uncaught Exception:', error);
      });
      
      const importService = new DataImportService();
      console.log('✅ DataImportService instance created');
      return importService;
    } catch (error) {
      console.error('❌ Failed to load DataImportService:');
      console.error('- Error:', error.message);
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error('- Missing dependency:', error.requireStack?.[0] || 'unknown');
      }
      throw error;
    }
    
    // Set date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    console.log('\n📅 Import Configuration:');
    console.log('- Start Date:', startDate.toISOString());
    console.log('- End Date:  ', endDate.toISOString());
    console.log('- API URL:   ', process.env.DATA_COLLECTION_API_URL);
    console.log('- API Key:   ', process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set');
    
    // Run the import with timeout
    console.log('\n🚦 Starting import process...');
    const importPromise = importService.importSurveysByDateRange(startDate, endDate);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Import timed out after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([importPromise, timeoutPromise]);
    
    console.log('\n📊 Import Results:');
    console.log('- Success: ', result.success);
    console.log('- Imported:', result.imported, 'surveys');
    console.log('- Failed:  ', result.failed, 'surveys');
    console.log('- Message: ', result.message || 'No message');
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}.`, error.message || 'Unknown error');
      });
      if (result.errors.length > 3) {
        console.log(`  ...and ${result.errors.length - 3} more errors`);
      }
    }
    
    if (result.success) {
      console.log('\n✅ Import completed successfully!');
    } else {
      console.log('\n⚠️  Import completed with issues');
    }
    
  } catch (error) {
    console.error('\n❌ Error during import:');
    console.error('- Name:', error.name);
    console.error('- Message:', error.message);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack.split('\n').slice(0, 5).join('\n') + '\n...');
    }
    
    process.exit(1);
  }
}

// Run the test
testImport().catch(console.error);
