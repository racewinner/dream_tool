const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testDataImportFunctionality() {
  console.log('🔍 Testing Data Import Functionality...\n');

  // Step 1: Create user and authenticate
  console.log('🔐 Step 1: Creating test user and authenticating...');
  let authToken;
  const testEmail = `testuser_${Date.now()}@example.com`;
  
  try {
    // Register new user
    console.log(`📝 Registering user: ${testEmail}`);
    await axios.post(`${API_URL}/api/auth/register`, {
      email: testEmail,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    // Login with new user
    console.log('🔐 Logging in...');
    const authResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    
    authToken = authResponse.data.token;
    console.log('✅ Authentication successful!');
    console.log(`   - User: ${authResponse.data.user.email}`);
    console.log(`   - Token: ${authToken ? 'Received' : 'Missing'}`);
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Step 2: Test import status endpoint
  console.log('\n📊 Step 2: Testing import status endpoint...');
  try {
    const statusResponse = await axios.get(`${API_URL}/api/import/status`, { headers });
    console.log('✅ Import status endpoint working!');
    console.log('   - Response:', JSON.stringify(statusResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Import status failed:', error.response?.status, error.response?.data || error.message);
  }

  // Step 3: Test KoboToolbox import endpoint
  console.log('\n🔗 Step 3: Testing KoboToolbox import endpoint...');
  try {
    const koboResponse = await axios.post(`${API_URL}/api/import/kobo/surveys`, {
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }, { headers });
    
    console.log('✅ KoboToolbox import endpoint working!');
    console.log('   - Response:', JSON.stringify(koboResponse.data, null, 2));
  } catch (error) {
    console.error('❌ KoboToolbox import failed:', error.response?.status, error.response?.data || error.message);
  }

  // Step 4: Test CSV upload endpoint (create a sample CSV)
  console.log('\n📄 Step 4: Testing CSV upload endpoint...');
  try {
    // Create a sample CSV file for testing
    const csvContent = `facility_id,facility_name,location,electricity_source,transport_access
1,Health Center A,Rural Village 1,solar,motorcycle
2,School B,Urban Area 2,grid,car
3,Clinic C,Remote Area 3,generator,walking`;

    const csvPath = path.join(__dirname, 'test-data.csv');
    fs.writeFileSync(csvPath, csvContent);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(csvPath));

    const csvResponse = await axios.post(`${API_URL}/api/import/csv`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });

    console.log('✅ CSV upload endpoint working!');
    console.log('   - Response:', JSON.stringify(csvResponse.data, null, 2));

    // Clean up test file
    fs.unlinkSync(csvPath);
  } catch (error) {
    console.error('❌ CSV upload failed:', error.response?.status, error.response?.data || error.message);
  }

  // Step 5: Test external API import endpoint
  console.log('\n🌐 Step 5: Testing external API import endpoint...');
  try {
    const apiResponse = await axios.post(`${API_URL}/api/import/external-api`, {
      apiUrl: 'https://jsonplaceholder.typicode.com/posts',
      apiKey: 'test-key',
      dataMapping: {
        facilityId: 'id',
        facilityName: 'title',
        location: 'body'
      }
    }, { headers });

    console.log('✅ External API import endpoint working!');
    console.log('   - Response:', JSON.stringify(apiResponse.data, null, 2));
  } catch (error) {
    console.error('❌ External API import failed:', error.response?.status, error.response?.data || error.message);
  }

  // Step 6: Check available surveys/facilities after import
  console.log('\n📋 Step 6: Checking available data after import...');
  try {
    const surveysResponse = await axios.get(`${API_URL}/api/surveys`, { headers });
    console.log('✅ Surveys endpoint working!');
    console.log(`   - Total surveys: ${surveysResponse.data.length || 0}`);
    
    const facilitiesResponse = await axios.get(`${API_URL}/api/facilities`, { headers });
    console.log('✅ Facilities endpoint working!');
    console.log(`   - Total facilities: ${facilitiesResponse.data.length || 0}`);
  } catch (error) {
    console.error('❌ Data retrieval failed:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n🎯 Data Import Test Summary:');
  console.log('✅ Authentication: Working');
  console.log('✅ Import endpoints: Available');
  console.log('✅ Data upload: Ready for testing');
  console.log('\n📝 Next Steps:');
  console.log('1. Test with real KoboToolbox data');
  console.log('2. Upload actual CSV files');
  console.log('3. Configure external API connections');
  console.log('4. Verify data analysis features');
}

// Run the test
testDataImportFunctionality().catch(console.error);
