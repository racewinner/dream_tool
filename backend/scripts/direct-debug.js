const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configure output file
const outputFile = path.resolve(__dirname, '../debug-output-direct.log');

// Clear previous log file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// Simple logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(outputFile, logMessage);
  console.log(logMessage.trim());
}

async function testSurveyRequest() {
  try {
    // Load environment variables
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    
    const surveyId = '643695471';
    const apiUrl = process.env.DATA_COLLECTION_API_URL;
    const apiKey = process.env.DATA_COLLECTION_API_KEY;
    
    log(`Testing survey request for ID: ${surveyId}`);
    log(`API URL: ${apiUrl}`);
    
    // Make the request
    const requestUrl = `${apiUrl}${apiUrl.endsWith('/') ? '' : '/'}${surveyId}`;
    log(`\nSending request to: ${requestUrl}`);
    
    const response = await axios.get(requestUrl, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    log(`\n✅ Request successful!`);
    log(`Status: ${response.status}`);
    log(`Content-Type: ${response.headers['content-type']}`);
    
    // Save the full response
    const responseFile = path.resolve(__dirname, '../survey-response.json');
    fs.writeFileSync(responseFile, JSON.stringify(response.data, null, 2));
    log(`Full response saved to: ${responseFile}`);
    
  } catch (error) {
    log('\n❌ Request failed:');
    
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`URL: ${error.config?.url || 'Unknown'}`);
      
      const errorFile = path.resolve(__dirname, '../survey-error.json');
      fs.writeFileSync(errorFile, JSON.stringify({
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        request: {
          method: error.config?.method,
          url: error.config?.url,
          headers: error.config?.headers
        }
      }, null, 2));
      
      log(`Error details saved to: ${errorFile}`);
      
    } else if (error.request) {
      log('No response received from server');
      log(`Request config: ${JSON.stringify(error.config, null, 2)}`);
    } else {
      log(`Error: ${error.message}`);
      log(`Stack: ${error.stack}`);
    }
  } finally {
    log('\nTest completed!');
  }
}

// Run the test
testSurveyRequest();
