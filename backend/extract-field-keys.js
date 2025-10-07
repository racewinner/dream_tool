// Script to extract key fields from KoboToolbox API response
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

// Get config values directly from environment
const apiUrl = process.env.DATA_COLLECTION_API_URL;
const apiKey = process.env.DATA_COLLECTION_API_KEY;

console.log('API URL:', apiUrl);
console.log('API Key exists:', !!apiKey);

async function extractFieldKeys() {
  try {
    console.log('Connecting to KoboToolbox API...');
    
    const cleanBaseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    
    const response = await axios.get(cleanBaseUrl, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
    
    console.log('API Response status:', response.status);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const firstItem = response.data.results[0];
      
      // Extract all top-level keys to a file
      const keys = Object.keys(firstItem).sort();
      fs.writeFileSync('api-field-keys.txt', keys.join('\n'));
      console.log(`\nSaved ${keys.length} field keys to api-field-keys.txt`);
      
      // Log key fields we need for our mapping
      console.log('\n=== Key Fields We Need to Map ===');
      
      // Function to find likely fields by keywords
      function findFields(keywords, item) {
        const matches = [];
        const lowerKeywords = keywords.map(k => k.toLowerCase());
        
        for (const [key, value] of Object.entries(item)) {
          const lowerKey = key.toLowerCase();
          if (lowerKeywords.some(keyword => lowerKey.includes(keyword))) {
            matches.push({
              key,
              value: typeof value === 'object' ? '[Object]' : value
            });
          }
        }
        
        return matches;
      }
      
      // Find facility type fields
      console.log('\nPotential Facility Type fields:');
      const facilityTypeFields = findFields(['facility', 'type', 'health'], firstItem);
      facilityTypeFields.forEach(f => console.log(`- ${f.key}: ${f.value}`));
      
      // Find ownership fields
      console.log('\nPotential Ownership fields:');
      const ownershipFields = findFields(['owner', 'manage', 'run by'], firstItem);
      ownershipFields.forEach(f => console.log(`- ${f.key}: ${f.value}`));
      
      // Find electricity related fields
      console.log('\nPotential Electricity fields:');
      const electricityFields = findFields(['electric', 'power', 'energy'], firstItem);
      electricityFields.forEach(f => console.log(`- ${f.key}: ${f.value}`));
      
      // Find GPS/location fields
      console.log('\nPotential GPS/Location fields:');
      const locationFields = findFields(['gps', 'lat', 'long', 'location', 'coordinate'], firstItem);
      locationFields.forEach(f => console.log(`- ${f.key}: ${f.value}`));
      
      // Look for population/catchment fields
      console.log('\nPotential Population/Catchment fields:');
      const populationFields = findFields(['population', 'serve', 'catchment'], firstItem);
      populationFields.forEach(f => console.log(`- ${f.key}: ${f.value}`));
      
      // Equipment related fields
      console.log('\nPotential Equipment fields:');
      const equipmentFields = findFields(['equipment', 'device', 'appliance', 'machine'], firstItem);
      equipmentFields.forEach(f => console.log(`- ${f.key}: ${f.value}`));
      
      // Save first item sample to more readable format
      fs.writeFileSync('api-first-item.json', JSON.stringify(firstItem, null, 2));
      console.log('\nSaved first item to api-first-item.json for detailed inspection');
    }
  } catch (error) {
    console.error('API inspection failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

extractFieldKeys().then(() => {
  console.log('\nExtraction completed.');
}).catch(err => {
  console.error('Fatal error:', err);
});
