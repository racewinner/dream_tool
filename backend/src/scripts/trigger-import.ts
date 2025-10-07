import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const POSSIBLE_ENDPOINTS = [
  '/api/import/kobo',
  '/api/import/surveys',
  '/api/kobo/import',
  '/api/data-import/kobo',
  '/api/kobo/surveys'
];

const testEndpoint = async (endpoint: string) => {
  console.log(`🔍 Testing endpoint: ${BASE_URL}${endpoint}`);
  
  try {
    const response = await axios.post(`${BASE_URL}${endpoint}`, {}, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log(`✅ SUCCESS: ${endpoint}`);
    console.log('Response:', response.data);
    return true;
  } catch (error: any) {
    if (error.response) {
      console.log(`❌ ${endpoint} - Status: ${error.response.status}`);
      if (error.response.status !== 404) {
        console.log('Response:', error.response.data);
      }
    } else {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
    return false;
  }
};

const findWorkingEndpoint = async () => {
  console.log('🚀 Searching for working import endpoint...\n');
  
  for (const endpoint of POSSIBLE_ENDPOINTS) {
    const success = await testEndpoint(endpoint);
    if (success) {
      console.log(`\n🎉 Found working endpoint: ${endpoint}`);
      return;
    }
    console.log(''); // Add spacing between tests
  }
  
  console.log('\n❌ No working import endpoint found. Check route registration.');
};

findWorkingEndpoint();
