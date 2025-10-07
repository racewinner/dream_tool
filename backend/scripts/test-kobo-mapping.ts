/**
 * Test script to verify KoboToolbox data mapping
 * 
 * This script:
 * 1. Connects to the KoboToolbox API
 * 2. Fetches survey data
 * 3. Passes it through the dataCollectionProvider transformations
 * 4. Logs the transformed data to verify mapping
 */

import { ExternalDataCollectionProvider } from '../src/services/providers/dataCollectionProvider';
import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize the data collection provider
const provider = new ExternalDataCollectionProvider();

async function testMapping(): Promise<void> {
  try {
    console.log('Testing KoboToolbox data mapping...');
    
    // Access environment variables directly
    const apiUrl = process.env.DATA_COLLECTION_API_URL;
    if (!apiUrl) {
      throw new Error('DATA_COLLECTION_API_URL is not defined in .env');
    }
    
    console.log(`Using API URL: ${apiUrl}`);

    // Direct API fetch to get raw data first
    const headers = {
      Authorization: `Token ${process.env.DATA_COLLECTION_API_KEY || ''}`
    };
    
    console.log('Fetching data from KoboToolbox API...');
    const response = await axios.get(apiUrl, { headers });
    
    if (response.data && response.data.results) {
      console.log(`Fetched ${response.data.results.length} survey records`);
      
      // Get a sample record for inspection
      const sampleRaw = response.data.results[0];
      console.log('\nSample raw record:');
      console.log(JSON.stringify(sampleRaw, null, 2));
      
      // Use the provider to transform the data
      console.log('\nTransforming data through provider...');
      const transformedData = await provider.getSurveys(
        new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date() // now
      );
      
      console.log(`\nTransformed ${transformedData.length} records`);
      
      if (transformedData.length > 0) {
        // Display sample transformed record
        const sampleTransformed = transformedData[0];
        console.log('\nSample transformed record:');
        console.log(JSON.stringify({
          externalId: sampleTransformed.externalId,
          collectionDate: sampleTransformed.collectionDate,
          respondentId: sampleTransformed.respondentId,
          facilityData: {
            productiveSectors: sampleTransformed.facilityData.productiveSectors,
            subsectorActivities: sampleTransformed.facilityData.subsectorActivities,
            ownership: sampleTransformed.facilityData.ownership,
            electricitySource: sampleTransformed.facilityData.electricitySource,
            electricityReliability: sampleTransformed.facilityData.electricityReliability,
            catchmentPopulation: sampleTransformed.facilityData.catchmentPopulation,
            buildings: sampleTransformed.facilityData.buildings,
            equipment: sampleTransformed.facilityData.equipment?.slice(0, 3) || [], // Show first 3 equipment items
            infrastructure: sampleTransformed.facilityData.infrastructure,
          }
        }, null, 2));
        
        console.log('\nVerifying key mappings:');
        console.log(`Facility Type: ${sampleTransformed.facilityData.subsectorActivities?.[0] || 'N/A'}`);
        console.log(`Electricity Source: ${sampleTransformed.facilityData.electricitySource || 'N/A'}`);
        console.log(`Equipment count: ${sampleTransformed.facilityData.equipment?.length || 0}`);
        console.log(`Core services: ${sampleTransformed.facilityData.coreServices?.join(', ') || 'N/A'}`);
        
        // Check geolocation extraction
        console.log('\nGeolocation data:');
        if (sampleTransformed.rawData?.responses?.latitude && sampleTransformed.rawData?.responses?.longitude) {
          console.log(`Extracted coordinates: ${sampleTransformed.rawData.responses.latitude}, ${sampleTransformed.rawData.responses.longitude}`);
        } else {
          console.log('No geolocation data extracted');
        }
      }
    } else {
      console.error('No results found in API response');
      console.log('API response:', response.data);
    }
  } catch (error: unknown) {
    console.error('Error testing KoboToolbox data mapping:');
    if (error instanceof AxiosError) {
      console.error(`Status: ${error.response?.status}`);
      console.error('Response data:', error.response?.data);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error occurred');
    }
  }
}

// Main execution
console.log('Starting KoboToolbox mapping test at', new Date().toISOString());
console.log('Working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment check:', {
  DATA_COLLECTION_API_URL: process.env.DATA_COLLECTION_API_URL ? 'Set (hidden value)' : 'Not set',
  DATA_COLLECTION_API_KEY: process.env.DATA_COLLECTION_API_KEY ? 'Set (hidden value)' : 'Not set',
});

testMapping()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('\n❌ Unhandled error:');
    if (err instanceof AxiosError) {
      console.error(`Status: ${err.response?.status}`);
      console.error(`Status Text: ${err.response?.statusText}`);
      console.error('Response data:', err.response?.data);
      console.error('Request config:', {
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers ? 'Headers present (hidden)' : 'No headers',
      });
    } else if (err instanceof Error) {
      console.error(`${err.name}: ${err.message}`);
      console.error('Stack trace:', err.stack);
    } else {
      console.error('Unknown error:', err);
    }
    process.exit(1);
  });
