/**
 * Direct SQL query test script to verify database structure and insert capabilities
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const { Pool } = require('pg');

console.log('========================================');
console.log('Direct SQL Database Test');
console.log('========================================');

// Database connection from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// Log configuration
console.log('Database:', `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log('----------------------------------------');

// Initialize direct database connection pool
const pool = new Pool(dbConfig);

// SQL to check if tables exist
const checkTablesQuery = `
  SELECT tablename, schemaname
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
`;

// SQL to get table columns
const getColumnsQuery = `
  SELECT column_name, data_type, is_nullable 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = $1
  ORDER BY ordinal_position;
`;

// SQL to insert test facility
const insertFacilityQuery = `
  INSERT INTO facilities (name, type, location, contact_person, contact_email, contact_phone, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  RETURNING id;
`;

// SQL to insert test survey
const insertSurveyQuery = `
  INSERT INTO surveys (external_id, collection_date, respondent_id, raw_data, facility_id, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  RETURNING id;
`;

// Main function
async function main() {
  const client = await pool.connect();
  
  try {
    console.log('\nChecking database tables...');
    const tablesResult = await client.query(checkTablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.error('No tables found in the database!');
      return;
    }
    
    console.log(`Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.tablename} (schema: ${row.schemaname})`);
    });
    
    // Check facilities table structure
    const facilitiesTable = tablesResult.rows.find(row => row.tablename === 'facilities');
    if (!facilitiesTable) {
      console.error('\nFacilities table not found!');
      return;
    }
    
    console.log('\nChecking facilities table structure:');
    const facilitiesColumns = await client.query(getColumnsQuery, ['facilities']);
    facilitiesColumns.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check surveys table structure
    const surveysTable = tablesResult.rows.find(row => row.tablename === 'surveys');
    if (!surveysTable) {
      console.error('\nSurveys table not found!');
      return;
    }
    
    console.log('\nChecking surveys table structure:');
    const surveysColumns = await client.query(getColumnsQuery, ['surveys']);
    surveysColumns.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Attempt to insert test data
    console.log('\nAttempting to insert test facility...');
    try {
      const facilityResult = await client.query(insertFacilityQuery, [
        'Test Facility',
        'Healthcare',
        'Test Location',
        'Test Person',
        'test@example.com',
        '+1234567890'
      ]);
      
      const facilityId = facilityResult.rows[0].id;
      console.log(`Successfully inserted facility with ID: ${facilityId}`);
      
      console.log('\nAttempting to insert test survey...');
      const surveyResult = await client.query(insertSurveyQuery, [
        'test-external-id-123',
        new Date(),
        'test-respondent',
        JSON.stringify({ test: 'data' }),
        facilityId
      ]);
      
      const surveyId = surveyResult.rows[0].id;
      console.log(`Successfully inserted survey with ID: ${surveyId}`);
      
      // Verify inserted data
      console.log('\nVerifying inserted facility data:');
      const verifyFacility = await client.query('SELECT * FROM facilities WHERE id = $1', [facilityId]);
      console.log(verifyFacility.rows[0]);
      
      console.log('\nVerifying inserted survey data:');
      const verifySurvey = await client.query('SELECT * FROM surveys WHERE id = $1', [surveyId]);
      console.log(verifySurvey.rows[0]);
      
      console.log('\n✅ Test completed successfully! Database tables verified and test data inserted.');
    } catch (error) {
      console.error('\n❌ Error inserting test data:', error);
      console.error('\nError details:', error.message);
      console.error('Query:', error.query);
      console.error('Parameters:', error.parameters);
      
      // Detailed diagnostics
      console.log('\nRunning detailed diagnostics...');
      
      // Check if raw_data column is JSONB
      try {
        const jsonbCheck = await client.query(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = 'surveys' AND column_name = 'raw_data'
        `);
        console.log(`Survey raw_data column type: ${jsonbCheck.rows[0]?.data_type || 'unknown'}`);
      } catch (e) {
        console.error('Error checking raw_data type:', e.message);
      }
      
      // Try inserting with minimal data
      try {
        console.log('\nTrying minimal facility insert...');
        const minFacilityResult = await client.query(`
          INSERT INTO facilities (name, created_at, updated_at) 
          VALUES ('Minimal Test', NOW(), NOW()) 
          RETURNING id
        `);
        console.log(`Minimal facility insert succeeded with ID: ${minFacilityResult.rows[0].id}`);
      } catch (e) {
        console.error('Minimal facility insert failed:', e.message);
      }
    }
    
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\n========================================');
    console.log('Test script completed');
    console.log('========================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
