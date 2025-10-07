const axios = require('axios');
const fs = require('fs');

console.log('🔍 Starting import error diagnosis...');
console.log('📅 Timestamp:', new Date().toISOString());

async function diagnoseImportErrors() {
  try {
    console.log('\n🚀 Triggering KoboToolbox import...');
    
    const response = await axios.post('http://localhost:3001/api/import/kobo/surveys/recent', {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('\n📊 Import Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Save response to file
    const logData = {
      timestamp: new Date().toISOString(),
      status: response.status,
      data: response.data,
      headers: response.headers
    };
    
    fs.writeFileSync('import-error-diagnosis.json', JSON.stringify(logData, null, 2));
    console.log('\n💾 Response saved to: import-error-diagnosis.json');
    
    if (!response.data.success) {
      console.log('\n❌ Import failed - checking backend logs for SQL errors...');
      console.log('Failed records:', response.data.failed);
      console.log('Error message:', response.data.message);
    }
    
  } catch (error) {
    console.error('\n💥 Error during diagnosis:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run diagnosis
diagnoseImportErrors().then(() => {
  console.log('\n✅ Diagnosis completed');
}).catch(error => {
  console.error('\n💥 Diagnosis failed:', error.message);
});
