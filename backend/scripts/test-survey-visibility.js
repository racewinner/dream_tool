const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testSurveyVisibility() {
  console.log('🔍 Testing Survey Visibility Issue\n');

  // Step 1: Authenticate
  console.log('🔐 Step 1: Getting authentication token...');
  let authToken;
  const testEmail = `testuser_${Date.now()}@example.com`;
  
  try {
    await axios.post(`${API_URL}/api/auth/register`, {
      email: testEmail,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    const authResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    
    authToken = authResponse.data.token;
    console.log('✅ Authentication successful');
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Step 2: Test surveys endpoint with authentication
  console.log('\n📊 Step 2: Testing surveys endpoint with auth...');
  try {
    const surveysResponse = await axios.get(`${API_URL}/api/surveys`, { headers });
    console.log('✅ Surveys endpoint accessible with auth');
    console.log(`   - Response status: ${surveysResponse.status}`);
    console.log(`   - Surveys count: ${surveysResponse.data.surveys ? surveysResponse.data.surveys.length : 'N/A'}`);
    console.log(`   - Response structure:`, Object.keys(surveysResponse.data));
    
    if (surveysResponse.data.surveys && surveysResponse.data.surveys.length > 0) {
      console.log(`   - First survey sample:`, {
        id: surveysResponse.data.surveys[0].id,
        externalId: surveysResponse.data.surveys[0].externalId,
        facilityName: surveysResponse.data.surveys[0].facilityName
      });
    }
  } catch (error) {
    console.error('❌ Surveys endpoint failed:', error.response?.status, error.response?.data || error.message);
  }

  // Step 3: Test surveys endpoint without authentication
  console.log('\n🔓 Step 3: Testing surveys endpoint without auth...');
  try {
    const surveysResponse = await axios.get(`${API_URL}/api/surveys`);
    console.log('⚠️ Surveys endpoint accessible without auth (unexpected)');
    console.log(`   - Response status: ${surveysResponse.status}`);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Surveys endpoint properly protected (401 without auth)');
    } else {
      console.error('❌ Unexpected error:', error.response?.status, error.response?.data || error.message);
    }
  }

  // Step 4: Check database directly for surveys
  console.log('\n🗄️ Step 4: Checking import status for survey count...');
  try {
    const statusResponse = await axios.get(`${API_URL}/api/import/status`, { headers });
    console.log('✅ Import status accessible');
    console.log(`   - Import status: ${statusResponse.data.status}`);
    console.log(`   - Last import: ${statusResponse.data.lastImport || 'N/A'}`);
    console.log(`   - Total imported: ${statusResponse.data.totalImported || 'N/A'}`);
  } catch (error) {
    console.error('❌ Import status failed:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n🎯 Analysis:');
  console.log('- If surveys endpoint returns 0 surveys but import status shows surveys imported,');
  console.log('  the issue is likely in the survey data transformation or query logic');
  console.log('- If surveys endpoint is not accessible, authentication middleware is the issue');
}

testSurveyVisibility();
