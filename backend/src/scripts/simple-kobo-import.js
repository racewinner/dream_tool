/**
 * Simplified KoboToolbox v2 API import script focusing on essential functionality
 */

// Load environment variables
require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

console.log('========================================');
console.log('Simplified KoboToolbox v2 API Import');
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
    
    console.log(`Retrieved ${response.data?.count || 0} total records`);
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching data from KoboToolbox API:');
    
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
    } else {
      console.error(error);
    }
    
    throw new Error('Failed to fetch data from KoboToolbox API');
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
    skipped: 0
  };
  
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Get list of all existing external_ids to avoid duplicates
    const existingIdsResult = await client.query('SELECT external_id FROM surveys');
    const existingIds = new Set(existingIdsResult.rows.map(row => row.external_id));
    
    // Create or find test facility to use for all surveys
    // First check if the facility already exists
    const findFacilityResult = await client.query(`
      SELECT id FROM facilities WHERE name = $1 LIMIT 1;
    `, ['KoboToolbox Import Facility']);
    
    let facilityId;
    
    if (findFacilityResult.rows.length > 0) {
      // Facility exists, use it
      facilityId = findFacilityResult.rows[0].id;
      console.log(`Using existing facility with ID: ${facilityId}`);
      
      // Update the timestamp
      await client.query(`
        UPDATE facilities SET updated_at = NOW() WHERE id = $1;
      `, [facilityId]);
    } else {
      // Facility doesn't exist, create it
      const facilityResult = await client.query(`
        INSERT INTO facilities (name, created_at, updated_at)
        VALUES ('KoboToolbox Import Facility', NOW(), NOW())
        RETURNING id;
      `);
      
      facilityId = facilityResult.rows[0].id;
      console.log(`Created new facility with ID: ${facilityId}`);
    }
    
    console.log(`Ready to process ${data.length} records with facility ID: ${facilityId}`);
    if (!facilityId) {
      throw new Error('No facility ID available for survey imports');
    }
    
    // Process records individually instead of in a single transaction
    // to prevent one failure from aborting all imports
    for (const item of data) {
      // Begin transaction for this record
      await client.query('BEGIN');
      
      try {
        // Extract data
        const external_id = item._id || item.id || String(Date.now());
        
        console.log(`Processing record with external_id: ${external_id}`);
        
        // Skip if this survey already exists
        if (existingIds.has(external_id)) {
          console.log(`Survey ${external_id} already exists, skipping.`);
          results.skipped++;
          await client.query('COMMIT');
          continue;
        }
        
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
        
        // Double-check facility still exists
        const checkFacility = await client.query('SELECT id FROM facilities WHERE id = $1', [facilityId]);
        if (checkFacility.rows.length === 0) {
          throw new Error(`Facility with ID ${facilityId} no longer exists!`);
        }
        
        console.log(`Inserting survey with external_id: ${external_id}, facility_id: ${facilityId}`);
        
        // Insert survey record with verified facility_id
        const surveyResult = await client.query(`
          INSERT INTO surveys 
          (external_id, collection_date, respondent_id, facility_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id;
        `, [
          external_id,
          collection_date,
          respondent_id,
          facilityId  // Verified facility_id
        ]);
        
        const surveyId = surveyResult.rows[0].id;
        console.log(`Created survey with ID: ${surveyId}, external_id: ${external_id}`);
        results.imported++;
        
        // Commit this record's transaction
        await client.query('COMMIT');
        
      } catch (error) {
        // Rollback this record's transaction
        await client.query('ROLLBACK');
        console.error(`Error processing record:`, error.message);
        if (error.detail) console.error(`Detail: ${error.detail}`);
        if (error.column) console.error(`Column: ${error.column}`);
        results.failed++;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', error);
    throw error;
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
    console.log('========================================');
    
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
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
