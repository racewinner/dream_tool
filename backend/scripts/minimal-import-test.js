console.log('🚀 Starting minimal import test...');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Simple test function
async function testMinimalImport() {
  try {
    // 1. Test environment variables
    console.log('\n🔍 Checking environment...');
    const requiredVars = [
      'NODE_ENV',
      'DATA_COLLECTION_API_URL',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      return;
    }
    
    console.log('✅ Environment variables OK');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DB:', `${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    // 2. Test database connection
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
    
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection successful!');
      
      // Check if surveys table exists
      const [tables] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveys'"
      );
      
      console.log('\n📋 Database tables:');
      console.log('- Surveys table exists:', tables.length > 0 ? '✅ Yes' : '❌ No');
      
    } finally {
      await sequelize.close();
    }
    
    // 3. Test API connection
    console.log('\n🔍 Testing KoboToolbox API connection...');
    const axios = require('axios');
    
    try {
      const response = await axios.get(process.env.DATA_COLLECTION_API_URL, {
        headers: {
          'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ API connection successful!');
      console.log(`- Status: ${response.status}`);
      console.log(`- Records found: ${response.data?.count || 'Unknown'}`);
      
    } catch (error) {
      console.error('❌ API connection failed:');
      if (error.response) {
        console.error(`- Status: ${error.response.status}`);
        console.error(`- Data: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error(`- Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
  }
}

// Run the test
testMinimalImport().then(() => {
  console.log('\n🏁 Test completed!');  process.exit(0);
});
