// Simple JavaScript test script for dataCollectionProvider
require('dotenv').config();

// Get config values directly from environment
const apiUrl = process.env.DATA_COLLECTION_API_URL;
const apiKey = process.env.DATA_COLLECTION_API_KEY;

console.log('API URL:', apiUrl);
console.log('API Key exists:', !!apiKey);

// Create a simple test function that directly uses axios
const axios = require('axios');

async function testDirectApi() {
  try {
    console.log('Testing direct API connection to:', apiUrl);
    
    // Clean URL (remove any trailing slashes if needed)
    const cleanBaseUrl = apiUrl.endsWith('/')
      ? apiUrl
      : `${apiUrl}/`;
      
    console.log('Using URL:', cleanBaseUrl);
    
    const response = await axios.get(cleanBaseUrl, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    
    console.log('API Response status:', response.status);
    console.log('Response has data:', !!response.data);
    
    if (response.data && response.data.results) {
      console.log('Number of surveys:', response.data.results.length);
      
      if (response.data.results.length > 0) {
        const firstItem = response.data.results[0];
        console.log('First item has ID:', firstItem._id || 'unknown');
        
        // Extract some key fields to test our field mapping logic
        const facilityType = firstItem['Type of health facility'];
        const ownership = firstItem['Ownership'];
        const electricitySource = firstItem['Q12. What is the main source of electricity for the clinic?'];
        
        console.log('Sample fields from first survey:');
        console.log('- Facility Type:', facilityType);
        console.log('- Ownership:', ownership);
        console.log('- Electricity Source:', electricitySource);
        
        // Check our field mapping logic manually
        let mappedSource = null;
        if (electricitySource) {
          const lowerValue = electricitySource.toLowerCase();
          if (lowerValue.includes('solar')) mappedSource = 'solar';
          else if (lowerValue.includes('generator')) mappedSource = 'diesel generator';
          else if (lowerValue.includes('grid')) mappedSource = 'national grid';
          else mappedSource = 'other';
        }
        
        console.log('Mapped electricity source:', mappedSource);
      }
    }
  } catch (error) {
    console.error('API test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testDirectApi().then(() => {
  console.log('Test completed.');
}).catch(err => {
  console.error('Fatal error:', err);
});
