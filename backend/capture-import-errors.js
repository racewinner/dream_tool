const axios = require('axios');
const fs = require('fs');

console.log('🔍 Capturing complete import error logs...');
console.log('📅 Timestamp:', new Date().toISOString());

async function captureImportErrors() {
  try {
    console.log('\n🚀 Triggering KoboToolbox import...');
    
    const startTime = Date.now();
    
    const response = await axios.post('http://localhost:3001/api/import/kobo/surveys/recent', {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n📊 Import Response:');
    console.log('Status:', response.status);
    console.log('Duration:', `${duration}ms`);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Wait for backend logs to complete
    console.log('\n⏳ Waiting for backend logs to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n✅ Import test completed');
    console.log('📝 Check the backend terminal for detailed SQL error logs');
    console.log('🔍 Look for:');
    console.log('  - "📝 Processing survey" messages');
    console.log('  - "❌ TRANSACTION ERROR" messages');
    console.log('  - "❌ OUTER ERROR" messages');
    console.log('  - SQL constraint violations');
    console.log('  - Database table/column errors');
    
  } catch (error) {
    console.error('\n💥 Error during import test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
captureImportErrors().then(() => {
  console.log('\n🏁 Error capture test completed');
}).catch(error => {
  console.error('\n💥 Test failed:', error.message);
});
