/**
 * Test script to directly validate KoboToolbox API connectivity
 * 
 * Usage:
 *   ts-node src/scripts/test-kobo-api.ts
 *   or
 *   node dist/scripts/test-kobo-api.js
 */

import '../config'; // Load environment variables
import axios from 'axios';

// Get API configuration from environment variables
const API_URL = process.env.DATA_COLLECTION_API_URL || '';
const API_KEY = process.env.DATA_COLLECTION_API_KEY || '';

// Check if API credentials are available
if (!API_URL) {
  console.error('Error: DATA_COLLECTION_API_URL is not set in environment');
  process.exit(1);
}

if (!API_KEY) {
  console.error('Error: DATA_COLLECTION_API_KEY is not set in environment');
  process.exit(1);
}

console.log('===== KoboToolbox API Test =====');
console.log('API URL:', API_URL);
console.log('API Key (first 5 chars):', API_KEY.substring(0, 5) + '...');

// Test different authorization methods
const authHeaders = [
  { name: 'Token Auth', headers: { 'Authorization': `Token ${API_KEY}` } },
  { name: 'Bearer Auth', headers: { 'Authorization': `Bearer ${API_KEY}` } },
  { name: 'Basic Auth', headers: { 'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}` } }
];

/**
 * Test direct API access
 */
async function testDirectAccess() {
  console.log('\n----- Testing Direct URL Access -----');
  
  // Try all auth header combinations
  for (const auth of authHeaders) {
    console.log(`\nTrying ${auth.name}:`);
    
    try {
      const response = await axios.get(API_URL, {
        headers: {
          ...auth.headers,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ SUCCESS!');
      console.log('Status:', response.status);
      console.log('Response type:', typeof response.data);
      
      if (typeof response.data === 'object') {
        // Print summary of data structure
        const summary = summarizeResponseData(response.data);
        console.log('Data summary:', summary);
      } else {
        // Print first part of response
        console.log('Response preview:', 
          typeof response.data === 'string' 
            ? response.data.substring(0, 200) 
            : response.data);
      }
      
      return true; // Success!
    } catch (error) {
      console.error('❌ ERROR:');
      
      if (axios.isAxiosError(error)) {
        console.error('  Status:', error.response?.status);
        console.error('  Status Text:', error.response?.statusText);
        
        // Print headers
        if (error.response?.headers) {
          console.error('  Response headers:', JSON.stringify(error.response.headers, null, 2));
        }
        
        // Print response data if available
        if (error.response?.data) {
          console.error('  Response data:', 
            typeof error.response.data === 'string'
              ? error.response.data.substring(0, 500)  
              : JSON.stringify(error.response.data, null, 2).substring(0, 500));
        }
      } else {
        console.error('  Non-Axios error:', error);
      }
    }
  }
  
  return false; // All attempts failed
}

/**
 * Test possible URL variations
 */
async function testUrlVariations() {
  console.log('\n----- Testing URL Variations -----');
  
  // Common URLs for KoboToolbox API
  const urlVariations = [
    { name: 'Original URL', url: API_URL },
    { name: 'Without data.json', url: API_URL.replace('/data.json', '') },
    { name: 'API v2 endpoint', url: API_URL.replace('/assets/', '/api/v2/assets/') },
    { name: 'Submissions endpoint', url: `${API_URL.replace('/data.json', '')}/submissions` }
  ];
  
  // Use most successful auth method from previous test
  const auth = authHeaders[0]; // Token auth is most common for KoboToolbox
  
  for (const urlVar of urlVariations) {
    console.log(`\nTrying ${urlVar.name}: ${urlVar.url}`);
    
    try {
      const response = await axios.get(urlVar.url, {
        headers: {
          ...auth.headers,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ SUCCESS!');
      console.log('Status:', response.status);
      
      // Print summary of response
      if (typeof response.data === 'object') {
        const summary = summarizeResponseData(response.data);
        console.log('Data summary:', summary);
      } else {
        console.log('Response preview:', 
          typeof response.data === 'string' 
            ? response.data.substring(0, 200) 
            : response.data);
      }
    } catch (error) {
      console.error('❌ ERROR:');
      
      if (axios.isAxiosError(error)) {
        console.error('  Status:', error.response?.status);
        console.error('  Message:', error.message);
      } else {
        console.error('  Error:', error);
      }
    }
  }
}

/**
 * Create a summary of the response data structure
 */
function summarizeResponseData(data: any): string {
  if (Array.isArray(data)) {
    return `Array with ${data.length} items. First item keys: ${
      data.length > 0 ? Object.keys(data[0]).join(', ') : 'none'
    }`;
  } else if (typeof data === 'object' && data !== null) {
    return `Object with keys: ${Object.keys(data).join(', ')}`;
  } else {
    return `${typeof data}`;
  }
}

// Run tests
async function runTests() {
  console.log('\n===== Starting KoboToolbox API Tests =====\n');
  
  // Test direct access first
  const directAccessSuccessful = await testDirectAccess();
  
  // If direct access failed, try URL variations
  if (!directAccessSuccessful) {
    await testUrlVariations();
  }
  
  console.log('\n===== KoboToolbox API Test Complete =====');
}

// Execute tests
runTests()
  .then(() => {
    console.log('\nTesting complete!');
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
