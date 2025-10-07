const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testSurveysAPI() {
  try {
    console.log('🔄 Testing surveys API endpoints...');
    
    // Test surveys endpoint without authentication
    try {
      console.log('\n1. Testing /api/surveys without auth...');
      const response = await axios.get(`${API_BASE_URL}/api/surveys`);
      console.log(`✅ Response status: ${response.status}`);
      console.log(`📊 Found ${response.data.surveys?.length || 0} surveys`);
      
      if (response.data.surveys?.length > 0) {
        console.log('📋 Sample survey data:');
        console.log(JSON.stringify(response.data.surveys[0], null, 2));
      }
    } catch (error) {
      console.log(`❌ Auth required - status: ${error.response?.status}`);
      console.log(`💡 Error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test health endpoint
    try {
      console.log('\n2. Testing server health...');
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log(`✅ Server health: ${healthResponse.status}`);
    } catch (error) {
      console.log(`❌ Health check failed: ${error.message}`);
    }
    
    // Check if we can access any public endpoints
    try {
      console.log('\n3. Testing root endpoint...');
      const rootResponse = await axios.get(`${API_BASE_URL}/`);
      console.log(`✅ Root endpoint: ${rootResponse.status}`);
    } catch (error) {
      console.log(`❌ Root endpoint failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to test API:', error.message);
  }
}

testSurveysAPI();
