/**
 * End-to-End KoboToolbox Import Verification
 * This script directly tests the KoboToolbox API integration and database import
 * without relying on TypeScript services
 */
require('dotenv').config();
const axios = require('axios');
const { Pool } = require('pg');

console.log('========================================');
console.log('KOBO IMPORT VERIFICATION');
console.log('========================================');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// API configuration from environment variables
const apiConfig = {
  apiUrl: process.env.DATA_COLLECTION_API_URL,
  apiKey: process.env.DATA_COLLECTION_API_KEY
};

async function main() {
  console.log('Database config:', {
    ...dbConfig,
    password: '********'
  });
  
  console.log('API config:', {
    apiUrl: apiConfig.apiUrl,
    apiKey: apiConfig.apiKey ? '********' : 'NOT SET'
  });
  
  if (!apiConfig.apiUrl || !apiConfig.apiKey) {
    console.error('❌ API URL or API Key not set in environment variables');
    console.error('Please ensure DATA_COLLECTION_API_URL and DATA_COLLECTION_API_KEY are set');
    return;
  }
  
  // Step 1: Verify database connection
  console.log('\n1. Verifying database connection');
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    client.release();
    
    // Step 2: Verify API connection
    console.log('\n2. Verifying API connection directly');
    let surveyData = [];
    
    try {
      const response = await axios.get(apiConfig.apiUrl, {
        headers: {
          'Authorization': `Token ${apiConfig.apiKey}`
        }
      });
      
      if (response.status === 200) {
        console.log('✅ API connection successful');
        console.log(`- Status: ${response.status}`);
        
        if (response.data && response.data.results && Array.isArray(response.data.results)) {
          surveyData = response.data.results;
          console.log(`- Records available: ${surveyData.length}`);
          
          if (surveyData.length > 0) {
            console.log('- Sample record fields:', Object.keys(surveyData[0]).join(', '));
          }
        } else {
          console.log('- No results array found in response');
          console.log('- Response structure:', Object.keys(response.data || {}).join(', '));
        }
      } else {
        console.error(`❌ API returned non-200 status: ${response.status}`);
        return;
      }
    } catch (apiError) {
      console.error('❌ API connection failed:');
      console.error(`- Error: ${apiError.message}`);
      if (apiError.response) {
        console.error(`- Status: ${apiError.response.status}`);
        console.error(`- Data: ${JSON.stringify(apiError.response.data)}`);
      }
      return;
    }
    
    if (surveyData.length === 0) {
      console.log('❌ No survey data available from API to import');
      return;
    }
    
    // Step 3: Get current count of surveys in database
    console.log('\n3. Getting current survey count');
    const countResult = await pool.query('SELECT COUNT(*) FROM surveys');
    const initialCount = parseInt(countResult.rows[0].count, 10);
    console.log(`- Initial survey count: ${initialCount}`);
    
    // Step 4: Import surveys directly
    console.log(`\n4. Importing ${Math.min(5, surveyData.length)} surveys directly`);
    
    // Process only up to 5 surveys for this test
    const surveysToImport = surveyData.slice(0, 5);
    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (const survey of surveysToImport) {
      try {
        // Start a transaction for each survey
        const client = await pool.connect();
        await client.query('BEGIN');
        
        try {
          console.log(`\nProcessing survey ID: ${survey._id || 'unknown'}`);
          
          // Check if survey already exists
          const existingCheck = await client.query(
            'SELECT id FROM surveys WHERE external_id = $1',
            [survey._id || `kobo-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`]
          );
          
          if (existingCheck.rows.length > 0) {
            console.log(`- Survey already exists, skipping`);
            skippedCount++;
            await client.query('COMMIT');
            client.release();
            continue;
          }
          
          // Extract facility name
          const facilityName = survey.facility_name || 'Unknown Facility';
          
          // Check if facility exists, create if not
          const facilityResult = await client.query(
            'SELECT id FROM facilities WHERE name = $1',
            [facilityName]
          );
          
          let facilityId;
          if (facilityResult.rows.length > 0) {
            facilityId = facilityResult.rows[0].id;
            console.log(`- Using existing facility: ${facilityName} (ID: ${facilityId})`);
          } else {
            const newFacility = await client.query(
              'INSERT INTO facilities (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
              [facilityName]
            );
            facilityId = newFacility.rows[0].id;
            console.log(`- Created new facility: ${facilityName} (ID: ${facilityId})`);
          }
          
          // Prepare survey data - ensure JSON is properly formatted
          const facilityData = {};
          
          // Add any available survey fields to facility data
          if (survey._attachments) facilityData.attachments = survey._attachments;
          if (survey.responses) facilityData.responses = survey.responses;
          
          // Add metadata
          facilityData.metadata = {
            imported_at: new Date().toISOString(),
            source: 'kobo-direct-verification',
            raw_id: survey._id || null
          };
          
          // Create the survey record
          const newSurvey = await client.query(`
            INSERT INTO surveys (
              external_id, 
              facility_id, 
              facility_data,
              collection_date, 
              respondent_id, 
              created_at, 
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
            RETURNING id
          `, [
            survey._id || `kobo-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
            facilityId,
            JSON.stringify(facilityData), // Properly format JSON data
            survey._submission_time ? new Date(survey._submission_time) : new Date(),
            survey.respondent_id || survey._submitted_by || 'unknown'
          ]);
          
          console.log(`- Created survey with ID: ${newSurvey.rows[0].id}`);
          importedCount++;
          await client.query('COMMIT');
          
        } catch (importError) {
          await client.query('ROLLBACK');
          console.error(`- Failed to import survey: ${importError.message}`);
          
          // Log detailed error info
          if (importError.code) console.error(`- Error code: ${importError.code}`);
          if (importError.detail) console.error(`- Error detail: ${importError.detail}`);
          if (importError.column) console.error(`- Problem column: ${importError.column}`);
          if (importError.constraint) console.error(`- Constraint: ${importError.constraint}`);
          
          failedCount++;
        } finally {
          client.release();
        }
      } catch (transactionError) {
        console.error(`- Transaction error: ${transactionError.message}`);
        failedCount++;
      }
    }
    
    console.log('\nImport summary:');
    console.log(`- Processed: ${surveysToImport.length}`);
    console.log(`- Imported: ${importedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Failed: ${failedCount}`);
    
    // Step 5: Verify records were imported
    console.log('\n5. Verifying import results');
    const newCountResult = await pool.query('SELECT COUNT(*) FROM surveys');
    const newCount = parseInt(newCountResult.rows[0].count, 10);
    console.log(`- New survey count: ${newCount}`);
    console.log(`- Net new records: ${newCount - initialCount}`);
    
    if (newCount > initialCount) {
      console.log('✅ Import successful - new records added');
      
      // Step 6: View sample of imported data
      console.log('\n6. Sample of most recent imported data:');
      const sampleResult = await pool.query(`
        SELECT s.id, s.external_id, s.collection_date, f.name as facility_name
        FROM surveys s
        JOIN facilities f ON s.facility_id = f.id
        ORDER BY s.created_at DESC
        LIMIT 3
      `);
      
      console.table(sampleResult.rows);
    } else if (importedCount > 0 && newCount === initialCount) {
      console.log('⚠️ Import reports success but count unchanged - records may have been skipped as duplicates');
    } else {
      console.log('❌ No new records imported');
    }
    
  } catch (dbError) {
    console.error('❌ Database error:');
    console.error(`- Error: ${dbError.message}`);
  } finally {
    await pool.end();
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\n========================================');
    console.log('Verification complete');
    console.log('========================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  });
