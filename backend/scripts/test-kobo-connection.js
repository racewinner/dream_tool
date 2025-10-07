console.log('🔍 Testing KoboToolbox API connection...');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Check required environment variables
const requiredVars = ['DATA_COLLECTION_API_URL', 'DATA_COLLECTION_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('🔧 Using configuration:');
console.log(`- API URL: ${process.env.DATA_COLLECTION_API_URL}`);
console.log(`- API Key: ${process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set'}`);

// Simple test function
async function testConnection() {
  const axios = require('axios');
  const url = process.env.DATA_COLLECTION_API_URL;
  
  console.log('\n🌐 Sending test request to KoboToolbox API...');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Success! API is responding.');
    console.log('Status:', response.status);
    
    if (response.data) {
      console.log('\n📊 Response data summary:');
      console.log(`- Count: ${response.data.count || 'N/A'}`);
      console.log(`- Next: ${response.data.next ? 'Yes' : 'No'}`);
      console.log(`- Previous: ${response.data.previous ? 'Yes' : 'No'}`);
      console.log(`- Results length: ${response.data.results ? response.data.results.length : 0}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to KoboToolbox API:');
    
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
    } else if (error.request) {
      console.error('- No response received from server');
      console.error('- Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: {
          ...error.config?.headers,
          'Authorization': 'Token *****'
        }
      });
    } else {
      console.error('- Error:', error.message);
    }
    
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
