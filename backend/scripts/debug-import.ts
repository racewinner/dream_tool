console.log('🚀 Starting debug-import.ts script...');

// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Log environment configuration
console.log('\n🔧 Environment Configuration:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- DATA_COLLECTION_API_URL: ${process.env.DATA_COLLECTION_API_URL || 'not set'}`);
console.log(`- DATA_COLLECTION_API_KEY: ${process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'not set'}`);

// Test database connection
async function testDatabaseConnection() {
  console.log('\n🔌 Testing database connection...');
  const { Sequelize } = require('sequelize');
  
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Test KoboToolbox API connection
async function testKoboApi() {
  console.log('\n🌐 Testing KoboToolbox API connection...');
  
  if (!process.env.DATA_COLLECTION_API_URL || !process.env.DATA_COLLECTION_API_KEY) {
    console.error('❌ Missing required environment variables');
    return false;
  }

  const axios = require('axios');
  
  try {
    const response = await axios.get(process.env.DATA_COLLECTION_API_URL, {
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ KoboToolbox API connection successful!');
    console.log(`📊 Found ${response.data.count || 0} records`);
    return true;
  } catch (error) {
    console.error('❌ KoboToolbox API connection failed:');
    if (error.response) {
      console.error(`- Status: ${error.response.status}`);
      console.error(`- Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('- No response received from server');
    } else {
      console.error(`- Error: ${error.message}`);
    }
    return false;
  }
}

// Main function
async function main() {
  console.log('\n🚀 Starting DREAM TOOL import debug...');
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  
  // Test KoboToolbox API connection
  const apiConnected = await testKoboApi();
  
  console.log('\n📋 Debug Summary:');
  console.log(`- Database connection: ${dbConnected ? '✅ Success' : '❌ Failed'}`);
  console.log(`- KoboToolbox API connection: ${apiConnected ? '✅ Success' : '❌ Failed'}`);
  
  if (!dbConnected || !apiConnected) {
    console.log('\n❌ Debug complete with errors. Please check the logs above for details.');
    process.exit(1);
  }
  
  console.log('\n✅ Debug complete. All tests passed successfully!');
  
  // Import and test DataImportService
  console.log('\n🔍 Testing DataImportService...');
  try {
    const { DataImportService } = require('../src/services/dataImportService');
    const importService = new DataImportService();
    
    // Set date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    console.log(`\n📅 Testing import for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Test the import
    const result = await importService.importSurveysByDateRange(startDate, endDate);
    
    console.log('\n📊 Import Results:');
    console.log(`- Success: ${result.success}`);
    console.log(`- Imported: ${result.imported} surveys`);
    console.log(`- Failed: ${result.failed} surveys`);
    console.log(`- Message: ${result.message}`);
    
  } catch (error) {
    console.error('\n❌ Error testing DataImportService:');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('\n❌ Unhandled error in main function:');
  console.error(error);
  process.exit(1);
});
