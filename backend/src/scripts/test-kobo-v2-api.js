/**
 * Direct test script for KoboToolbox v2 API connection
 * This script doesn't require TypeScript compilation
 */

// Load environment variables
require('dotenv').config();
const axios = require('axios');

// Get credentials from environment variables
const apiUrl = process.env.DATA_COLLECTION_API_URL;
const apiKey = process.env.DATA_COLLECTION_API_KEY;

// Log configuration
console.log('========================================');
console.log('KoboToolbox v2 API Test');
console.log('========================================');
console.log('API URL:', apiUrl);
console.log('API Key (first 5 chars):', apiKey ? apiKey.substring(0, 5) + '...' : 'Not configured');
console.log('----------------------------------------');

// Ensure the URL has a trailing slash
const cleanUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';

// Test the API connection
async function testKoboV2Api() {
  try {
    console.log(`Sending request to: ${cleanUrl}`);
    console.log('Headers:', {
      'Authorization': `Token ${apiKey ? apiKey.substring(0, 5) + '...' : ''}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
    
    const response = await axios({
      method: 'GET',
      url: cleanUrl,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('----------------------------------------');
    console.log('✅ SUCCESS! Response received from KoboToolbox v2 API');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Content Type:', response.headers['content-type']);
    
    // Log response structure
    console.log('\nResponse structure:');
    if (response.data) {
      if (typeof response.data === 'object') {
        // For v2 API response
        if (response.data.results && Array.isArray(response.data.results)) {
          console.log(`Found ${response.data.results.length} results in API response`);
          console.log('Response has pagination structure with results array');
          
          // Show first item sample if available
          if (response.data.results.length > 0) {
            console.log('\nSample data (first item):');
            console.log(JSON.stringify(response.data.results[0], null, 2).substring(0, 500) + '...');
          }
        } else {
          // Other object response
          console.log('Response is an object with keys:', Object.keys(response.data).join(', '));
          console.log('\nSample data:');
          console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
        }
      } else {
        // Non-object response
        console.log('Response is not an object, type:', typeof response.data);
        console.log('Preview:', String(response.data).substring(0, 300));
      }
    } else {
      console.log('Empty response data');
    }
    
    console.log('\nAPI connection successful! ✅');
    return true;
  } catch (error) {
    console.log('----------------------------------------');
    console.log('❌ ERROR: Failed to connect to KoboToolbox v2 API');
    
    if (axios.isAxiosError(error)) {
      console.log('Status:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      
      if (error.response?.data) {
        console.log('\nError response data:');
        console.log(typeof error.response.data === 'string' 
          ? error.response.data.substring(0, 500) 
          : JSON.stringify(error.response.data, null, 2).substring(0, 500));
      }
      
      if (error.response?.status === 404) {
        console.log('\n404 ERROR SOLUTION:');
        console.log('Check if the API URL format is correct. For KoboToolbox v2, use:');
        console.log('https://[subdomain].kobotoolbox.org/api/v2/assets/[asset_id]/data/');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('\nAUTHENTICATION ERROR SOLUTION:');
        console.log('Ensure your API key is correct and that the header format is:');
        console.log('Authorization: Token YOUR_API_KEY');
      }
    } else {
      console.log('Error:', error.message || error);
    }
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify the API URL is correct (should include /api/v2/ and end with /data/)');
    console.log('2. Check that your API key is correct and has permission to access this asset');
    console.log('3. Ensure you are using the correct authentication format (Token)');
    console.log('4. Verify the asset ID exists and is accessible with your credentials');
    
    return false;
  }
}

// Run the test
testKoboV2Api()
  .then(success => {
    console.log('========================================');
    console.log(success ? 'Test completed successfully!' : 'Test failed!');
    console.log('========================================');
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });
