/**
 * Direct test script for KoboToolbox API
 * Does not require TypeScript compilation
 */

// Load env variables directly
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const fs = require('fs');

// Get API credentials
let apiUrl = process.env.DATA_COLLECTION_API_URL || '';
const apiKey = process.env.DATA_COLLECTION_API_KEY || '';

console.log('=== KoboToolbox Direct Test ===');
console.log('Original API URL:', apiUrl);

// Fix double slashes in URL (except after http:// or https://)
apiUrl = apiUrl.replace(/([^:]\/)\/+/g, '$1');
console.log('Cleaned URL:', apiUrl);

// Analyze URL parts
const urlParts = apiUrl.split('/');
console.log('URL parts:', urlParts);

// Determine if the URL is in the expected format
const isExpectedFormat = urlParts.includes('assets') && urlParts[urlParts.length - 1].includes('.json');
console.log('URL appears to be in expected KoboToolbox format:', isExpectedFormat ? 'Yes' : 'No');

// Try to determine asset ID
const assetIdIndex = urlParts.indexOf('assets') + 1;
const possibleAssetId = assetIdIndex < urlParts.length ? urlParts[assetIdIndex] : '';
console.log('Possible Asset ID:', possibleAssetId);

// Test variations of the URL
async function testUrlVariations() {
  console.log('\n=== Testing URL Variations ===');
  
  // URL variations to try
  const variations = [
    { name: 'Original URL', url: apiUrl },
    { name: 'API v2 format', url: `${urlParts[0]}//${urlParts[2]}/api/v2/assets/${possibleAssetId}/data/` },
    { name: 'No .json suffix', url: apiUrl.replace('.json', '') },
    { name: 'With .json suffix', url: apiUrl.endsWith('.json') ? apiUrl : `${apiUrl}.json` },
  ];
  
  // Authentication variations to try
  const authMethods = [
    { name: 'Token Auth', headers: { 'Authorization': `Token ${apiKey}` } },
    { name: 'Bearer Auth', headers: { 'Authorization': `Bearer ${apiKey}` } }
  ];
  
  // Track successful connections
  const successes = [];
  
  // Try each URL variation with each auth method
  for (const variation of variations) {
    console.log(`\nTesting: ${variation.name}`);
    console.log(`URL: ${variation.url}`);
    
    for (const auth of authMethods) {
      console.log(`\n  Auth method: ${auth.name}`);
      
      try {
        const response = await axios({
          method: 'GET',
          url: variation.url,
          headers: {
            ...auth.headers,
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        
        console.log('  ✓ SUCCESS!');
        console.log(`  Status: ${response.status}`);
        
        // Log info about the response
        if (typeof response.data === 'object') {
          if (Array.isArray(response.data)) {
            console.log(`  Response is array with ${response.data.length} items`);
            
            if (response.data.length > 0) {
              const firstItem = response.data[0];
              console.log('  First item keys:', Object.keys(firstItem).join(', '));
            }
          } else {
            console.log(`  Response is object with keys: ${Object.keys(response.data).join(', ')}`);
          }
        } else {
          console.log(`  Response type: ${typeof response.data}`);
        }
        
        // Save successful configs
        successes.push({
          url: variation.url,
          authMethod: auth.name,
          response: {
            status: response.status,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data),
            length: Array.isArray(response.data) ? response.data.length : undefined,
            keys: typeof response.data === 'object' ? Object.keys(response.data) : undefined
          }
        });
        
        // Write the first successful response to a file
        if (successes.length === 1) {
          const samplePath = `${__dirname}/kobo-sample-response.json`;
          fs.writeFileSync(samplePath, JSON.stringify(response.data, null, 2));
          console.log(`  Sample response saved to: ${samplePath}`);
        }
        
      } catch (error) {
        console.log('  ✗ FAILED');
        
        if (axios.isAxiosError(error)) {
          console.log(`  Status: ${error.response?.status || 'No status'}`);
          console.log(`  Message: ${error.message}`);
          
          // Check for HTML responses (common with auth issues)
          const contentType = error.response?.headers?.['content-type'] || '';
          if (contentType.includes('text/html')) {
            console.log('  Received HTML response - likely auth or URL format issue');
          }
        } else {
          console.log(`  Error: ${error.message}`);
        }
      }
    }
  }
  
  return successes;
}

// Run the tests
async function runTests() {
  try {
    console.log('\nStarting KoboToolbox API tests...');
    const successes = await testUrlVariations();
    
    console.log('\n=== Test Results ===');
    if (successes.length > 0) {
      console.log(`Found ${successes.length} successful configurations!`);
      
      // Recommend the best configuration
      const bestConfig = successes[0];
      console.log('\n=== RECOMMENDED CONFIGURATION ===');
      console.log(`URL: ${bestConfig.url}`);
      console.log(`Auth method: ${bestConfig.authMethod}`);
      console.log('Response info:', bestConfig.response);
      
      // Update instructions
      console.log('\n=== HOW TO FIX YOUR CODE ===');
      console.log('1. Update your .env file:');
      console.log(`   DATA_COLLECTION_API_URL=${bestConfig.url}`);
      
      console.log('2. Update your provider code to use this auth method:');
      if (bestConfig.authMethod === 'Token Auth') {
        console.log("   headers: { 'Authorization': `Token ${this.apiKey}` }");
      } else {
        console.log("   headers: { 'Authorization': `Bearer ${this.apiKey}` }");
      }
    } else {
      console.log('No successful configurations found.');
      console.log('\nPossible issues:');
      console.log('1. The KoboToolbox API endpoint might be incorrect');
      console.log('2. Your API key might be invalid or expired');
      console.log('3. The asset might not exist or you might not have permission to access it');
      console.log('\nRecommendations:');
      console.log('- Verify your KoboToolbox account has access to this form/asset');
      console.log('- Check if you can access the data through the KoboToolbox web interface');
      console.log('- Verify your API token is correct and has not expired');
      console.log('- Try generating a new API token from your KoboToolbox account settings');
    }
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Execute tests
runTests()
  .then(() => console.log('\nTest complete!'))
  .catch(err => console.error('Error running tests:', err));
