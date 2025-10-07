/**
 * Simplified test script for KoboToolbox API connectivity
 */
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testKoboApi(): Promise<void> {
  try {
    console.log('Testing KoboToolbox API connection...');
    
    // Access environment variables directly
    const apiUrl = process.env.DATA_COLLECTION_API_URL;
    const apiKey = process.env.DATA_COLLECTION_API_KEY;
    
    if (!apiUrl) {
      console.error('ERROR: DATA_COLLECTION_API_URL is not defined in .env');
      return;
    }
    
    console.log(`API URL: ${apiUrl}`);
    console.log(`API Key present: ${apiKey ? 'Yes' : 'No'}`);
    
    // Set up headers with authorization token
    const headers = {
      'Authorization': `Token ${apiKey || ''}`
    };
    
    console.log('Making API request...');
    const response = await axios.get(apiUrl, { headers });
    
    console.log(`API Response status: ${response.status}`);
    
    if (response.data && response.data.results) {
      console.log(`Found ${response.data.results.length} records`);
      
      if (response.data.results.length > 0) {
        // Just get top-level fields to verify structure
        const sample = response.data.results[0];
        console.log('\nSample record structure:');
        console.log(JSON.stringify(Object.keys(sample), null, 2));
        
        // Check for geolocation data
        if (sample._geolocation) {
          console.log('\nGeolocation format:');
          console.log(JSON.stringify(sample._geolocation, null, 2));
        }
      }
    } else {
      console.log('No results found in response');
    }
    
    console.log('\nAPI test complete');
  } catch (error) {
    console.error('Error in Kobo API test:');
    
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status || 'unknown'}`);
      if (error.response?.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }
  }
}

// Run the test
testKoboApi().catch(err => {
  console.error('Unhandled error:', err);
});
