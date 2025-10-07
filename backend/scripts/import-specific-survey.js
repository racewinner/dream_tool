// Configure environment
process.env.DEBUG = '*';
process.env.DEBUG_COLORS = 'true';

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Get survey ID from command line argument or use the first one from the list
const surveyId = process.argv[2] || '643695471'; // Using the first survey ID from our list

async function importSurvey() {
  try {
    console.log(`🚀 Starting import for survey ID: ${surveyId}`);
    
    // Load DataImportService
    console.log('\n🔍 Loading DataImportService...');
    const { DataImportService } = require('../dist/services/dataImportService');
    const importService = new DataImportService();
    console.log('✅ DataImportService initialized');
    
    // Set up logging for the import process
    console.log(`\n🔧 Import configuration:`);
    console.log(`- Survey ID: ${surveyId}`);
    console.log(`- API URL: ${process.env.DATA_COLLECTION_API_URL}`);
    
    // Run the import with error handling
    console.log('\n🚀 Starting import process...');
    const startTime = Date.now();
    
    try {
      const result = await importService.importSurveyById(surveyId);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`\n✅ Import completed in ${duration}s`);
      console.log('\n📊 Import Result:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎉 Successfully imported survey!');
      } else {
        console.log('\n⚠️  Import completed with issues');
      }
      
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`\n❌ Import failed after ${duration}s`);
      console.error('Error details:');
      console.error('- Name:', error.name);
      console.error('- Message:', error.message);
      
      if (error.response) {
        console.error('\nAPI Response:');
        console.error('- Status:', error.response.status);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack.split('\n').slice(0, 5).join('\n'));
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during import:');
    console.error(error);
    process.exit(1);
  }
}

// Run the import
importSurvey();
