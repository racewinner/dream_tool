// Enhanced test script to inspect KoboToolbox API response structure
require('dotenv').config();

// Get config values directly from environment
const apiUrl = process.env.DATA_COLLECTION_API_URL;
const apiKey = process.env.DATA_COLLECTION_API_KEY;

console.log('API URL:', apiUrl);
console.log('API Key exists:', !!apiKey);

const axios = require('axios');

async function inspectApiResponse() {
  try {
    console.log('Connecting to KoboToolbox API:', apiUrl);
    
    // Clean URL (remove any trailing slashes if needed)
    const cleanBaseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
      
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
        console.log('\n=== First Survey Item Structure ===');
        console.log('Top-level keys:', Object.keys(firstItem));
        
        // Find potential field candidates for our mapping
        console.log('\n=== Potential Field Mappings ===');
        const keys = Object.keys(firstItem);
        
        // Look for facility type related fields
        const facilityTypeFields = keys.filter(k => 
          k.toLowerCase().includes('facility') && k.toLowerCase().includes('type'));
        console.log('Potential Facility Type fields:', facilityTypeFields);
        
        // Look for ownership related fields
        const ownershipFields = keys.filter(k => 
          k.toLowerCase().includes('owner'));
        console.log('Potential Ownership fields:', ownershipFields);
        
        // Look for electricity related fields
        const electricityFields = keys.filter(k => 
          k.toLowerCase().includes('electric') || k.toLowerCase().includes('power'));
        console.log('Potential Electricity fields:', electricityFields);
        
        // Check if we have a nested 'responses' object
        if (firstItem.responses) {
          console.log('\n=== Nested Responses Structure ===');
          console.log('Responses keys:', Object.keys(firstItem.responses));
        }
        
        // Print first 5 fields with their values for inspection
        console.log('\n=== Sample Field Values ===');
        let count = 0;
        for (const [key, value] of Object.entries(firstItem)) {
          if (count++ < 5 && typeof value !== 'object') {
            console.log(`${key}:`, value);
          }
        }
        
        // Save the full structure to a file for detailed inspection
        const fs = require('fs');
        fs.writeFileSync('api-sample-data.json', JSON.stringify(response.data.results[0], null, 2));
        console.log('\nSaved full sample data to api-sample-data.json for detailed inspection');
      }
    }
  } catch (error) {
    console.error('API inspection failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

inspectApiResponse().then(() => {
  console.log('\nInspection completed.');
}).catch(err => {
  console.error('Fatal error:', err);
});
