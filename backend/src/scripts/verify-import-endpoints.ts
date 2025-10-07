import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const IMPORT_ENDPOINTS = [
  '/api/import/preview',
  '/api/import/start', 
  '/api/import/status',
  '/api/import/history'
];

const testEndpoint = async (endpoint: string) => {
  try {
    // Use GET for preview/status/history, POST for start
    const method = endpoint.includes('/start') ? 'post' : 'get';
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 3000,
      validateStatus: (status) => status < 500 // Accept 4xx as "endpoint exists"
    });
    
    console.log(`✅ ${endpoint} - Status: ${response.status} (endpoint exists)`);
    return true;
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 404) {
        console.log(`❌ ${endpoint} - 404 Not Found (endpoint missing)`);
        return false;
      } else {
        console.log(`✅ ${endpoint} - Status: ${error.response.status} (endpoint exists)`);
        return true;
      }
    } else {
      console.log(`❌ ${endpoint} - Connection error: ${error.message}`);
      return false;
    }
  }
};

const verifyImportEndpoints = async () => {
  console.log('🔍 Verifying import API endpoints...\n');
  
  let allEndpointsAvailable = true;
  
  for (const endpoint of IMPORT_ENDPOINTS) {
    const available = await testEndpoint(endpoint);
    if (!available) {
      allEndpointsAvailable = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allEndpointsAvailable) {
    console.log('🎉 SUCCESS: All import endpoints are available!');
    console.log('✅ Frontend should now be able to proceed with import wizard.');
  } else {
    console.log('❌ ISSUE: Some import endpoints are missing.');
    console.log('💡 Backend needs to be restarted with full import routes.');
  }
  console.log('='.repeat(50));
};

verifyImportEndpoints();
