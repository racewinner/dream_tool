/**
 * Import surveys collected within a specific date range
 * 
 * Usage:
 *   ts-node src/scripts/import-surveys-by-date.ts --start=YYYY-MM-DD --end=YYYY-MM-DD
 *   or
 *   node dist/scripts/import-surveys-by-date.js --start=YYYY-MM-DD --end=YYYY-MM-DD
 */

import '../config'; // Load environment variables first
import { DataImportService } from '../services/dataImportService';
import { parseArgs } from 'node:util';

// Parse command line arguments
const { values } = parseArgs({
  options: {
    start: {
      type: 'string',
    },
    end: {
      type: 'string',
    },
    help: {
      type: 'boolean',
    }
  },
  strict: false,
});

// Parse dates from strings (YYYY-MM-DD format)
function parseDate(dateString: string, isEnd = false): Date {
  try {
    // If just a date is provided (YYYY-MM-DD), set appropriate time
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateString);
      if (isEnd) {
        // End of day for end date
        date.setHours(23, 59, 59, 999);
      } else {
        // Start of day for start date
        date.setHours(0, 0, 0, 0);
      }
      return date;
    }
    
    // Otherwise parse as is
    return new Date(dateString);
  } catch (error) {
    console.error(`Invalid date format: ${dateString}`);
    console.error('Please use YYYY-MM-DD format');
    process.exit(1);
  }
}

// Show help if requested or if required args missing
if (values.help || !values.start || !values.end) {
  console.log(`
Usage: 
  ts-node src/scripts/import-surveys-by-date.ts --start=YYYY-MM-DD --end=YYYY-MM-DD
  node dist/scripts/import-surveys-by-date.js --start=YYYY-MM-DD --end=YYYY-MM-DD

Options:
  --start=YYYY-MM-DD    Start date for survey collection (inclusive)
  --end=YYYY-MM-DD      End date for survey collection (inclusive)
  --help                Display this help message
  
Example:
  ts-node src/scripts/import-surveys-by-date.ts --start=2025-07-01 --end=2025-07-24
  `);
  process.exit(values.help ? 0 : 1);
}

const startDate = parseDate(values.start);
const endDate = parseDate(values.end, true);

// Validate date range
if (endDate < startDate) {
  console.error('Error: End date must be after start date');
  process.exit(1);
}

async function importSurveys() {
  console.log(`===== Starting import for date range: ${startDate.toISOString()} to ${endDate.toISOString()} =====`);
  
  const importService = new DataImportService();
  
  try {
    console.log('⏱️ Import started at:', new Date().toISOString());
    
    const result = await importService.importSurveysByDateRange(startDate, endDate);
    
    console.log('\n===== Import Results =====');
    if (result.success) {
      console.log(`✅ Success: ${result.message}`);
    } else {
      console.error(`❌ Failed: ${result.message}`);
    }
    
    console.log(`📊 Imported: ${result.imported} survey(s)`);
    console.log(`❌ Failed: ${result.failed} survey(s)`);
    
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
importSurveys()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
