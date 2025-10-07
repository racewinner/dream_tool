/**
 * Simple KoboToolbox API test
 * 
 * This script tests direct connection to KoboToolbox API with minimal dependencies
 */
import axios from 'axios';
import '../config'; // Load environment variables

// Main function to test API connection
async function testKoboApi() {
  console.log('===== SIMPLE KOBOTOOLBOX API TEST =====');
  
  // Get API credentials from environment
  const apiUrl = process.env.DATA_COLLECTION_API_URL;
  const apiKey = process.env.DATA_COLLECTION_API_KEY;
  
  if (!apiUrl || !apiKey) {
    console.error('Missing API credentials in .env file');
    console.error('DATA_COLLECTION_API_URL:', apiUrl ? 'Set ✓' : 'Not set ✗');
    console.error('DATA_COLLECTION_API_KEY:', apiKey ? 'Set ✓' : 'Not set ✗');
    process.exit(1);
  }
  
  console.log('API URL:', apiUrl);
  console.log('API Key (first 5):', apiKey.substring(0, 5) + '...');
  
  // Fix potential double slashes in URL
  const cleanUrl = apiUrl.replace(/([^:]\/)\/+/g, "$1");
  if (cleanUrl !== apiUrl) {
    console.log('Fixed URL with double slashes:', cleanUrl);
  }
  
  // Try KoboToolbox API connection
  try {
    console.log('\nAttempting connection with Token auth...');
    const response = await axios({
      method: 'GET',
      url: cleanUrl,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✓ Connection successful!');
    console.log('Status:', response.status);
    console.log('Content Type:', response.headers['content-type']);
    
    if (typeof response.data === 'object') {
      if (Array.isArray(response.data)) {
        console.log(`Response: Array with ${response.data.length} items`);
        if (response.data.length > 0) {
          console.log('Sample item:', JSON.stringify(response.data[0], null, 2).substring(0, 300));
        }
      } else {
        console.log(`Response: Object with ${Object.keys(response.data).length} keys`);
        console.log('Keys:', Object.keys(response.data));
      }
    } else {
      console.log('Response:', typeof response.data);
      console.log('Preview:', String(response.data).substring(0, 300));
    }
    return true;
  } catch (error) {
    console.error('✗ Connection failed!');
    
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      
      // Check for HTML response (common in auth failures)
      const contentType = error.response?.headers?.['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.error('Received HTML response instead of JSON - likely authentication or URL issue');
      }
      
      // Print raw error data
      if (error.response?.data) {
        const dataPreview = typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 300)
          : JSON.stringify(error.response.data).substring(0, 300);
        console.error('Error response:', dataPreview);
      }
    } else {
      console.error('Error:', error);
    }
    
    // Suggest potential fixes
    console.log('\nPotential fixes:');
    console.log('1. Check if URL is correct - KoboToolbox URLs typically follow a pattern like:');
    console.log('   https://[server]/api/v2/assets/[asset_id]/data/');
    console.log('2. Verify API token is correct and has permission to access this asset');
    console.log('3. Try accessing the URL in a browser to verify it exists');
    
    return false;
  }
}

// Run the test
testKoboApi()
  .then(() => {
    console.log('\nTest complete!');
  })
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
