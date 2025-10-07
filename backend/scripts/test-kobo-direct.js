console.log('🚀 Testing KoboToolbox API directly...');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Check required variables
const requiredVars = ['DATA_COLLECTION_API_URL', 'DATA_COLLECTION_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Simple API test
async function testKoboApi() {
  const axios = require('axios');
  const url = process.env.DATA_COLLECTION_API_URL;
  
  console.log('\n🌐 Sending request to:', url);
  console.log('Using API key:', '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4));
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('\n✅ Success! API is responding.');
    console.log('Status:', response.status);
    console.log('Data count:', response.data?.count || 'N/A');
    
  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testKoboApi().catch(console.error);
