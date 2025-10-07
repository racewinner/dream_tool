const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function importKoboToolboxData() {
  console.log('🔗 KoboToolbox Data Import\n');

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

  // Step 2: Check current data status
  console.log('\n📊 Step 2: Checking current data status...');
  try {
    const surveysResponse = await axios.get(`${API_URL}/api/surveys`, { headers });
    const facilitiesResponse = await axios.get(`${API_URL}/api/facilities`, { headers });
    
    console.log(`📋 Current data before import:`);
    console.log(`   - Surveys: ${surveysResponse.data.surveys ? surveysResponse.data.surveys.length : 0}`);
    console.log(`   - Facilities: ${facilitiesResponse.data.length || 0}`);
  } catch (error) {
    console.error('❌ Failed to check current data:', error.response?.status, error.response?.data || error.message);
  }

  // Step 3: Import from KoboToolbox
  console.log('\n🔗 Step 3: Importing from KoboToolbox...');
  try {
    const importResponse = await axios.post(`${API_URL}/api/import/kobo/surveys`, {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }, { headers });
    
    console.log('✅ KoboToolbox import completed!');
    console.log(`📊 Import Results:`);
    console.log(`   - Imported: ${importResponse.data.imported}`);
    console.log(`   - Failed: ${importResponse.data.failed}`);
    console.log(`   - Message: ${importResponse.data.message}`);
    
    if (importResponse.data.details) {
      console.log(`   - Details: ${JSON.stringify(importResponse.data.details, null, 2)}`);
    }
  } catch (error) {
    console.error('❌ KoboToolbox import failed:', error.response?.status, error.response?.data || error.message);
    return;
  }

  // Step 4: Check data after import
  console.log('\n📊 Step 4: Checking data after import...');
  try {
    const surveysResponse = await axios.get(`${API_URL}/api/surveys`, { headers });
    const facilitiesResponse = await axios.get(`${API_URL}/api/facilities`, { headers });
    
    console.log(`📋 Data after import:`);
    console.log(`   - Surveys: ${surveysResponse.data.surveys ? surveysResponse.data.surveys.length : 0}`);
    console.log(`   - Facilities: ${facilitiesResponse.data.length || 0}`);
    
    // Show sample survey data
    if (surveysResponse.data.surveys && surveysResponse.data.surveys.length > 0) {
      console.log(`\n📄 Sample Survey Data:`);
      const sample = surveysResponse.data.surveys[0];
      console.log(`   - Survey ID: ${sample.id}`);
      console.log(`   - External ID: ${sample.externalId}`);
      console.log(`   - Facility Name: ${sample.facilityName}`);
      console.log(`   - Region: ${sample.region}`);
      console.log(`   - District: ${sample.district}`);
      console.log(`   - Collection Date: ${sample.completionDate}`);
      console.log(`   - Completeness: ${sample.completeness}%`);
      console.log(`   - Quality Score: ${sample.qualityScore}`);
    }
    
    // Show sample facility data
    if (facilitiesResponse.data && facilitiesResponse.data.length > 0) {
      console.log(`\n🏥 Sample Facility Data:`);
      const facility = facilitiesResponse.data[0];
      console.log(`   - Facility ID: ${facility.id}`);
      console.log(`   - Name: ${facility.name}`);
      console.log(`   - Type: ${facility.type}`);
      console.log(`   - Status: ${facility.status}`);
      console.log(`   - Location: ${facility.latitude ? `${facility.latitude}, ${facility.longitude}` : 'Not specified'}`);
    }
  } catch (error) {
    console.error('❌ Failed to check data after import:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n🎯 KoboToolbox Import Complete!');
  console.log('✅ Real survey data has been imported and is now available in the system');
}

importKoboToolboxData();
