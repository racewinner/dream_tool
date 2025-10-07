import { DataImportService } from '../src/services/dataImportService';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Enable debug logging
process.env.DEBUG = '*';
process.env.DEBUG_COLORS = 'true';

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
console.log(`🔍 Loading environment from: ${envPath}`);

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env file not found at', envPath);
  process.exit(1);
}

// Load environment variables
const envConfig = config({ path: envPath });

if (envConfig.error) {
  console.error('❌ Error loading .env file:', envConfig.error);
  process.exit(1);
}

// Log loaded environment variables (redacting sensitive info)
console.log('✅ Loaded environment variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- DATA_COLLECTION_API_URL: ${process.env.DATA_COLLECTION_API_URL ? 'set' : 'not set'}`);
console.log(`- DATA_COLLECTION_API_KEY: ${process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '****' + process.env.DB_PASSWORD.slice(-4) : 'not set'}`);

async function testKoboImport() {
  try {
    console.log('🚀 Starting KoboToolbox import test...');
    
    // Initialize the import service
    const importService = new DataImportService();
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    await importService.testConnection();
    console.log('✅ Database connection successful');
    
    // Set date range for test import (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    console.log(`📅 Importing surveys from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Run the import
    const result = await importService.importSurveysByDateRange(startDate, endDate);
    
    console.log('\n📊 Import Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📥 Imported: ${result.imported} surveys`);
    console.log(`❌ Failed: ${result.failed} surveys`);
    console.log(`💬 Message: ${result.message}`);
    
    if (result.imported > 0) {
      console.log('\n🎉 Successfully imported survey data from KoboToolbox!');
    } else {
      console.log('\nℹ️ No surveys were imported. Check if there is data in the specified date range.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    if (error instanceof Error) {
      console.error(`- Name: ${error.name}`);
      console.error(`- Message: ${error.message}`);
      console.error(`- Stack: ${error.stack}`);
      
      // Handle specific error types
      if ('statusCode' in error) {
        console.error(`- Status Code: ${(error as any).statusCode}`);
      }
      if ('errorCode' in error) {
        console.error(`- Error Code: ${(error as any).errorCode}`);
      }
      if ('responseData' in error) {
        console.error('- Response Data:', JSON.stringify((error as any).responseData, null, 2));
      }
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Run the test
testKoboImport()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with unhandled error:', error);
    process.exit(1);
  });
