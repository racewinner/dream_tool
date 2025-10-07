// Configure environment
process.env.DEBUG = 'kobo-import:*';
process.env.DEBUG_COLORS = 'true';

console.log('🚀 Starting single survey import test...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Add global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️  Unhandled Rejection at:');
  console.error('- Promise:', promise);
  console.error('- Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('\n⚠️  Uncaught Exception:');
  console.error(error);
  process.exit(1);
});

async function importSingleSurvey() {
  try {
    console.log('🔍 Initializing...');
    
    // Load DataImportService with error handling
    console.log('\n🔍 Loading DataImportService...');
    let importService;
    try {
      const modulePath = require.resolve('../dist/services/dataImportService');
      console.log(`✅ Found DataImportService at: ${modulePath}`);
      
      const { DataImportService } = require(modulePath);
      importService = new DataImportService();
      console.log('✅ DataImportService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize DataImportService:');
      console.error('- Error:', error.message);
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error('- Missing dependency:', error.requireStack?.[0] || 'unknown');
      }
      throw error;
    }
    
    // Import a single survey by ID
    console.log('\n🔍 Fetching a single survey...');
    const surveyId = 'latest'; // This will get the most recent survey
    
    console.log('🔧 Import configuration:');
    console.log('- API URL:', process.env.DATA_COLLECTION_API_URL);
    console.log('- API Key:', process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set');
    console.log('- Survey ID:', surveyId);
    
    console.log('\n🚀 Starting import...');
    const startTime = Date.now();
    
    try {
      const result = await importService.importSurveyById(surveyId);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`\n✅ Import completed in ${duration}s`);
      return result;
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`\n❌ Import failed after ${duration}s`);
      throw error;
    }
    
    console.log('\n📊 Import Result:');
    console.log('- Success:', result.success);
    console.log('- Survey ID:', result.surveyId);
    console.log('- Message:', result.message);
    
    if (result.error) {
      console.error('\n❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ Import failed with error:');
    console.error(error);
  } finally {
    console.log('\n🏁 Test completed!');
    process.exit(0);
  }
}

// Run the import
importSingleSurvey();
