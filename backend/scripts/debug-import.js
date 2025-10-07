// Configure environment
process.env.DEBUG = '*';
process.env.DEBUG_COLORS = 'true';

// Load environment variables first
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Set up file logging
const fs = require('fs');
const logFile = 'import-debug.log';
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

// Override console.log to write to both console and file
const originalLog = console.log;
console.log = function() {
  const message = Array.from(arguments).join(' ');
  originalLog.apply(console, arguments);
  logStream.write(message + '\n');
};

// Override console.error to write to both console and file
const originalError = console.error;
console.error = function() {
  const message = Array.from(arguments).join(' ');
  originalError.apply(console, arguments);
  logStream.write('ERROR: ' + message + '\n');
};

// Main function
async function main() {
  console.log('🚀 Starting debug import at:', new Date().toISOString());
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  
  try {
    // Test database connection
    console.log('\n🔍 Testing database connection...');
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test API connection
    console.log('\n🔍 Testing KoboToolbox API connection...');
    const axios = require('axios');
    const response = await axios.get(process.env.DATA_COLLECTION_API_URL, {
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API connection successful!');
    console.log('- Status:', response.status);
    console.log('- Records found:', response.data?.count || 'Unknown');
    
    // Load and test DataImportService
    console.log('\n🔍 Testing DataImportService...');
    try {
      const { DataImportService } = require('../dist/services/dataImportService');
      const importService = new DataImportService();
      
      console.log('✅ DataImportService loaded successfully');
      
      // Test importing a single survey
      console.log('\n🚀 Testing import of a single survey...');
      const result = await importService.importSurveyById('latest');
      
      console.log('\n📊 Import result:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Error in DataImportService:');
      console.error('- Name:', error.name);
      console.error('- Message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack.split('\n').slice(0, 5).join('\n'));
      }
      throw error;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    console.log('\n🏁 Test completed!');
    logStream.end();
    console.log(`📝 Logs saved to: ${logFile}`);
  }
}

// Run the test
main();
