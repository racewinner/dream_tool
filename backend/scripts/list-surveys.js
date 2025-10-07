const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listSurveys() {
  try {
    console.log('🔍 Fetching surveys from KoboToolbox...');
    console.log(`- API URL: ${process.env.DATA_COLLECTION_API_URL}`);
    
    const response = await axios.get(process.env.DATA_COLLECTION_API_URL, {
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const surveys = response.data.results || [];
    console.log(`\n✅ Found ${surveys.length} surveys:\n`);
    
    if (surveys.length === 0) {
      console.log('No surveys found. Please check your API URL and permissions.');
      return;
    }
    
    surveys.forEach((survey, index) => {
      console.log(`📋 Survey #${index + 1}`);
      console.log(`   ID: ${survey._id}`);
      console.log(`   Submission Time: ${new Date(survey._submission_time).toLocaleString()}`);
      console.log(`   URL: ${process.env.DATA_COLLECTION_API_URL}/${survey._id}`);
      
      // Show some metadata if available
      if (survey._xform_id_string) {
        console.log(`   Form ID: ${survey._xform_id_string}`);
      }
      if (survey._attachments && survey._attachments.length > 0) {
        console.log(`   Has Attachments: Yes (${survey._attachments.length})`);
      }
      console.log(''); // Add empty line between surveys
    });

  } catch (error) {
    console.error('\n❌ Error fetching surveys:');
    if (error.response) {
      console.error(`- Status: ${error.response.status}`);
      console.error(`- URL: ${error.config.url}`);
      if (error.response.data) {
        console.error('- Response:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      console.error('- No response received from server');
      console.error('- Request config:', error.config);
    } else {
      console.error('- Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the function
listSurveys();
