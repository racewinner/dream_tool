console.log('🚀 Starting KoboToolbox import debug script...');
console.log('🔍 Current working directory:', process.cwd());

// Load environment variables
console.log('\n🔧 Loading environment variables...');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Verify environment variables
console.log('\n✅ Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- DATA_COLLECTION_API_URL:', process.env.DATA_COLLECTION_API_URL || 'not set');
console.log('- DATA_COLLECTION_API_KEY:', process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set');
console.log('- DB_HOST:', process.env.DB_HOST || 'not set');
console.log('- DB_PORT:', process.env.DB_PORT || 'not set');
console.log('- DB_NAME:', process.env.DB_NAME || 'not set');
console.log('- DB_USER:', process.env.DB_USER || 'not set');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '****' + process.env.DB_PASSWORD.slice(-4) : 'not set');

// Test database connection
console.log('\n🔌 Testing database connection...');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
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

async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Test KoboToolbox API connection
async function testKoboApi() {
  console.log('\n🌐 Testing KoboToolbox API connection...');
  
  if (!process.env.DATA_COLLECTION_API_URL || !process.env.DATA_COLLECTION_API_KEY) {
    console.error('❌ Missing required environment variables for KoboToolbox API');
    return false;
  }

  const axios = require('axios');
  const url = process.env.DATA_COLLECTION_API_URL;
  
  console.log('Sending request to:', url);
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Successfully connected to KoboToolbox API');
    console.log('Response status:', response.status);
    
    if (response.data && response.data.count !== undefined) {
      console.log(`📊 Found ${response.data.count} survey records`);
    } else {
      console.log('📦 Response data:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to KoboToolbox API:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('- Status:', error.response.status);
      console.error('- Headers:', error.response.headers);
      console.error('- Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('- No response received');
      console.error('- Request config:', error.config);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('- Error message:', error.message);
    }
    
    return false;
  }
}

// Main function
async function main() {
  console.log('\n🔍 Starting debug process...');
  
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
  process.exit(0);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('\n❌ Unhandled error in main function:', error);
  process.exit(1);
});
