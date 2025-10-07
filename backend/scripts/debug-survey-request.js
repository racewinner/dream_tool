const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// The survey ID we want to import
const SURVEY_ID = '643695471';
const API_URL = process.env.DATA_COLLECTION_API_URL;

async function debugSurveyRequest() {
  try {
    console.log('🔍 Debugging survey request...');
    console.log(`- Base URL: ${API_URL}`);
    console.log(`- Survey ID: ${SURVEY_ID}`);
    
    // Log the full request URL
    const requestUrl = `${API_URL}${API_URL.endsWith('/') ? '' : '/'}${SURVEY_ID}`;
    console.log(`\n📤 Request URL: ${requestUrl}`);
    
    // Make the request with detailed logging
    console.log('\n🚀 Sending request to KoboToolbox API...');
    const response = await axios({
      method: 'get',
      url: requestUrl,
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'DREAM-TOOL-DEBUG/1.0'
      },
      // Add request/response interceptors for detailed logging
      transformRequest: [(data, headers) => {
        console.log('\n📤 Request Headers:', JSON.stringify(headers, null, 2));
        return data;
      }]
    });
    
    console.log('\n✅ Request successful!');
    console.log(`- Status: ${response.status}`);
    console.log(`- Content-Type: ${response.headers['content-type']}`);
    
    // Save the response to a file for inspection
    const outputFile = 'survey-response.json';
    require('fs').writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
    console.log(`\n📝 Full response saved to: ${path.resolve(outputFile)}`);
    
  } catch (error) {
    console.error('\n❌ Request failed:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(`- Status: ${error.response.status}`);
      console.error(`- URL: ${error.config.url}`);
      console.error(`- Method: ${error.config.method}`);
      
      if (error.response.data) {
        const errorFile = 'survey-error.json';
        require('fs').writeFileSync(errorFile, JSON.stringify(error.response.data, null, 2));
        console.error(`- Error details saved to: ${errorFile}`);
      }
      
      console.error('\nResponse headers:', JSON.stringify(error.response.headers, null, 2));
      
    } else if (error.request) {
      // The request was made but no response was received
      console.error('- No response received from server');
      console.error('- Request config:', error.config);
    } else {
      // Something happened in setting up the request
      console.error('- Error:', error.message);
      console.error('- Stack:', error.stack);
    }
    
    process.exit(1);
  }
}

// Run the debug function
debugSurveyRequest();
