const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure output file
const outputFile = path.resolve(__dirname, '../kobo-test-result.json');

// Clear previous output file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// Simple logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  return logMessage;
}

async function testKoboEndpoint() {
  const result = {
    startTime: new Date().toISOString(),
    config: {},
    request: {},
    response: {},
    error: null,
    endTime: null
  };

  try {
    // Load environment variables
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    
    const surveyId = '643695471';
    const apiUrl = process.env.DATA_COLLECTION_API_URL;
    const apiKey = process.env.DATA_COLLECTION_API_KEY;
    
    // Store config
    result.config = { apiUrl, apiKey: apiKey ? '***REDACTED***' : 'MISSING', surveyId };
    
    // Construct request URL
    const requestUrl = `${apiUrl.replace(/\/+$/, '')}/${surveyId}`;
    result.request = { method: 'GET', url: requestUrl };
    
    log(`Testing Kobo API endpoint with survey ID: ${surveyId}`);
    log(`Request URL: ${requestUrl}`);
    
    // Make the request with detailed logging
    const response = await axios({
      method: 'get',
      url: requestUrl,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'DREAM-TOOL-TEST/1.0'
      },
      maxRedirects: 5,
      timeout: 15000,
      validateStatus: (status) => true // Don't throw on HTTP errors
    });
    
    // Log successful response
    result.response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data // Will be truncated in logs if too large
    };
    
    log(`✅ Request successful (${response.status} ${response.statusText})`);
    
  } catch (error) {
    // Handle errors
    result.error = {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    };
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      result.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      };
      log(`❌ Request failed with status ${error.response.status}: ${error.message}`);
    } else if (error.request) {
      // The request was made but no response was received
      result.request = {
        ...result.request,
        error: 'No response received',
        code: error.code
      };
      log('❌ No response received from server');
    } else {
      // Something happened in setting up the request
      log(`❌ Error setting up request: ${error.message}`);
    }
  } finally {
    // Finalize result
    result.endTime = new Date().toISOString();
    
    // Save detailed results to file
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    log(`\n📝 Detailed results saved to: ${outputFile}`);
    
    // Show summary
    console.log('\n=== Test Summary ===');
    console.log(`Start Time: ${result.startTime}`);
    console.log(`End Time:   ${result.endTime}`);
    console.log(`Status:     ${result.error ? '❌ Failed' : '✅ Success'}`);
    
    if (result.error) {
      console.log(`\nError: ${result.error.message}`);
      if (result.response?.status) {
        console.log(`Status: ${result.response.status} ${result.response.statusText || ''}`);
      }
    } else if (result.response) {
      console.log(`Status: ${result.response.status} ${result.response.statusText || ''}`);
      console.log(`Content-Type: ${result.response.headers?.['content-type'] || 'unknown'}`);
    }
    
    console.log('===================');
  }
}

// Run the test
testKoboEndpoint();
