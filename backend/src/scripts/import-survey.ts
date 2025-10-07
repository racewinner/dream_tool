/**
 * Import a specific survey by its external ID
 * 
 * Usage:
 *   ts-node src/scripts/import-survey.ts --id=SURVEY_ID
 *   or
 *   node dist/scripts/import-survey.js --id=SURVEY_ID
 */

import '../config'; // Load environment variables first
import { DataImportService } from '../services/dataImportService';
import { parseArgs } from 'node:util';

// Define command line argument types
interface ImportSurveyArgs {
  id?: string;
  help?: boolean;
}

// Parse command line arguments
const { values } = parseArgs({
  options: {
    id: {
      type: 'string',
    },
    help: {
      type: 'boolean',
    }
  },
  strict: false,
}) as { values: ImportSurveyArgs };

// Show help if requested or if no ID provided
if (values.help || !values.id) {
  console.log(`
Usage: 
  ts-node src/scripts/import-survey.ts --id=SURVEY_ID
  node dist/scripts/import-survey.js --id=SURVEY_ID

Options:
  --id=SURVEY_ID    External ID of the survey to import
  --help            Display this help message
  `);
  process.exit(values.help ? 0 : 1);
}

// At this point, we know values.id is defined and is a string
const surveyId = values.id as string;

// Enable debug logging
process.env.DEBUG = 'backend:*,sequelize:sql';

// Import debug after setting the DEBUG env var
const debug = require('debug')('backend:import-script');

async function importSurvey() {
  console.log(`===== Starting import for survey ID: ${surveyId} =====`);
  console.log('⏱️ Import started at:', new Date().toISOString());
  
  try {
    // Log environment info
    console.log('\n===== Environment Info =====');
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL: ${process.env.DATABASE_URL ? 'set' : 'not set'}`);
    
    console.log('\n🔍 Initializing DataImportService...');
    const importService = new DataImportService();
    
    // Test database connection first
    console.log('\n🔌 Testing database connection...');
    try {
      await importService.testConnection();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      throw new Error('Failed to connect to database');
    }
    
    console.log('\n🚀 Starting import process...');
    console.log(`📤 Fetching survey with ID: ${surveyId}`);
    
    const startTime = Date.now();
    const result = await importService.importSurveyById(surveyId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n===== Import Results =====');
    console.log(`⏱️  Duration: ${duration} seconds`);
    
    if (result.success) {
      console.log(`✅ Success: ${result.message}`);
    } else {
      console.error(`❌ Failed: ${result.message}`);
    }
    
    console.log(`📊 Imported: ${result.imported} survey(s)`);
    console.log(`❌ Failed: ${result.failed} survey(s)`);
    
    // Log memory usage
    const used = process.memoryUsage();
    console.log('\n===== Memory Usage =====');
    for (let [key, value] of Object.entries(used)) {
      console.log(`${key} ${Math.round(value / 1024 / 1024 * 100) / 100} MB`);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Unhandled error during import:');
    if (error instanceof Error) {
      console.error(`- Error name: ${error.name}`);
      console.error(`- Error message: ${error.message}`);
      console.error(`- Stack trace: ${error.stack}`);
    } else {
      console.error('- Unknown error:', error);
    }
    return false;
  } finally {
    console.log('⏱️ Import ended at:', new Date().toISOString());
  }
}

// Execute the import
importSurvey()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
