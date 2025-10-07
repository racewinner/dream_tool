/**
 * Final KoboToolbox v2 API import script
 * Uses per-record transactions and handles facility creation individually
 */

// Load environment variables
require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

console.log('========================================');
console.log('Final KoboToolbox v2 API Import');
console.log('========================================');

// API configuration
const apiUrl = process.env.DATA_COLLECTION_API_URL;
const apiKey = process.env.DATA_COLLECTION_API_KEY;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

console.log('API URL:', apiUrl);
console.log('Database:', `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log('----------------------------------------');

// Initialize DB connection
const pool = new Pool(dbConfig);

// Fetch data from KoboToolbox v2 API
async function fetchKoboData() {
  console.log('Fetching data from KoboToolbox v2 API...');
  
  const cleanUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
  
  try {
    console.log(`Making API request to: ${cleanUrl}`);
    console.log('Using authorization: Token [MASKED]');
    
    const response = await axios({
      method: 'GET',
      url: cleanUrl,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`API response status: ${response.status} ${response.statusText}`);
    console.log(`API response content type: ${response.headers['content-type']}`);
    console.log(`API response data structure: ${Object.keys(response.data).join(', ')}`);
    
    
    console.log(`Retrieved ${response.data?.count || 0} total records`);
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching data from KoboToolbox API:');
    
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response:', JSON.stringify(error.response?.data, null, 2).substring(0, 500));
    } else {
      console.error(error);
    }
    
    throw new Error('Failed to fetch data from KoboToolbox API');
  }
}

// Process a single Kobo record
async function processSingleRecord(client, item, existingIds) {
  // Extract data
  const external_id = item._id || item.id || String(Date.now());
  
  console.log(`\nProcessing record with external_id: ${external_id}`);
  
  // Skip if this survey already exists
  if (existingIds.has(external_id)) {
    console.log(`Survey ${external_id} already exists, skipping.`);
    return { status: 'skipped' };
  }
  
  try {
    // Begin transaction for this specific record
    await client.query('BEGIN');
    
    // Get collection date from submission time or default to now
    let collection_date = new Date();
    if (item._submission_time) {
      collection_date = new Date(item._submission_time);
    }
    
    // Get respondent ID if available
    const respondent_id = 
      item.respondent_id || 
      item['respondent/id'] ||
      item['general_information/respondent_id'] || 
      'unknown';
    
    // Get or extract facility name
    const facilityName = 
      item.facility_name ||
      item['facility/name'] ||
      item['general_information/facility'] ||
      `Facility for Survey ${external_id}`;
    
    // Create a facility specifically for this survey
    console.log(`Creating facility: "${facilityName}"`);
    const facilityResult = await client.query(`
      INSERT INTO facilities (name, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
      RETURNING id;
    `, [facilityName]);
    
    const facilityId = facilityResult.rows[0].id;
    console.log(`Created facility with ID: ${facilityId}`);
    
    // Insert survey record with complete KoboToolbox data
    console.log(`Inserting survey with external_id: ${external_id}, facility_id: ${facilityId}`);
    const surveyResult = await client.query(`
      INSERT INTO surveys 
      (external_id, collection_date, respondent_id, facility_id, facility_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id;
    `, [
      external_id,
      collection_date,
      respondent_id,
      facilityId,
      JSON.stringify(item) // Store the complete KoboToolbox survey data
    ]);
    
    const surveyId = surveyResult.rows[0].id;
    console.log(`Created survey with ID: ${surveyId}`);
    
    // Commit transaction
    await client.query('COMMIT');
    return { status: 'success', surveyId, facilityId };
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error(`Error processing record ${external_id}:`, error.message);
    if (error.detail) console.error(`Detail: ${error.detail}`);
    if (error.column) console.error(`Column: ${error.column}`);
    return { status: 'error', error: error.message };
  }
}

// Transform and import data
async function processKoboData(data) {
  if (!data || data.length === 0) {
    console.log('No data to process');
    return { total: 0, imported: 0, failed: 0, skipped: 0 };
  }
  
  console.log(`Processing ${data.length} records...`);
  
  const results = {
    total: data.length,
    imported: 0,
    failed: 0,
    skipped: 0,
    facilities: { created: 0, failed: 0 }
  };
  
  const client = await pool.connect();
  
  try {
    // Get list of all existing external_ids to avoid duplicates
    const existingIdsResult = await client.query('SELECT external_id FROM surveys');
    const existingIds = new Set(existingIdsResult.rows.map(row => row.external_id));
    
    console.log(`Found ${existingIds.size} existing surveys`);
    
    // Process each record with individual transaction
    for (const item of data) {
      const result = await processSingleRecord(client, item, existingIds);
      
      if (result.status === 'success') {
        results.imported++;
        results.facilities.created++;
      } else if (result.status === 'skipped') {
        results.skipped++;
      } else {
        results.failed++;
      }
    }
    
  } catch (error) {
    console.error('Error in data processing:', error);
  } finally {
    client.release();
  }
  
  return results;
}

// Main function
async function main() {
  try {
    // Fetch data from KoboToolbox
    const koboData = await fetchKoboData();
    
    // Process and import data
    const results = await processKoboData(koboData);
    
    // Log results
    console.log('\n========================================');
    console.log('Import Results:');
    console.log('----------------------------------------');
    console.log(`Total records: ${results.total}`);
    console.log(`Successfully imported: ${results.imported}`);
    console.log(`Skipped (already exist): ${results.skipped}`);
    console.log(`Failed imports: ${results.failed}`);
    console.log('\nFacility Results:');
    console.log(`Created: ${results.facilities.created}`);
    console.log(`Failed: ${results.facilities.failed}`);
    console.log('========================================');
    console.log('Data import complete!');
    
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
