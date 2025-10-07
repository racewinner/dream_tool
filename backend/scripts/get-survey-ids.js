const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const outputFile = 'survey-ids.json';

async function getSurveyIds() {
  try {
    console.log('🔍 Fetching surveys from KoboToolbox...');
    const response = await axios.get(process.env.DATA_COLLECTION_API_URL, {
      headers: {
        'Authorization': `Token ${process.env.DATA_COLLECTION_API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const surveys = response.data.results || [];
    console.log(`\n✅ Found ${surveys.length} surveys`);
    
    // Save to file
    const output = {
      count: surveys.length,
      surveys: surveys.map(s => ({
        id: s._id,
        submission_time: s._submission_time,
        form_id: s._xform_id_string,
        has_attachments: (s._attachments && s._attachments.length > 0) || false
      }))
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
    console.log(`📝 Survey IDs saved to: ${path.resolve(outputFile)}`);
    
    // Show a preview
    if (surveys.length > 0) {
      console.log('\n📋 First survey preview:');
      console.log(JSON.stringify(output.surveys[0], null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error fetching surveys:');
    if (error.response) {
      console.error(`- Status: ${error.response.status}`);
      console.error(`- URL: ${error.config.url}`);
      if (error.response.data) {
        const errorFile = 'survey-error.json';
        fs.writeFileSync(errorFile, JSON.stringify(error.response.data, null, 2));
        console.error(`- Error details saved to: ${errorFile}`);
      }
    } else {
      console.error('- Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the function
getSurveyIds();
