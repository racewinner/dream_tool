/**
 * Ultra-simple database test script with no external dependencies
 * Just creates a facility and survey in a single transaction
 */
// Load environment variables
require('dotenv').config();
const { Pool } = require('pg');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// Log the config we're using (mask password)
console.log('Using database config:', {
  ...dbConfig,
  password: '********'
});

console.log('========================================');
console.log('Ultra Simple Database Test');
console.log('========================================');
console.log('Database:', `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

async function main() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Create a facility
    console.log('\nStep 1: Creating a facility');
    const facilityResult = await client.query(`
      INSERT INTO facilities (name, created_at, updated_at) 
      VALUES ('Ultra Simple Facility', NOW(), NOW()) 
      RETURNING id
    `);
    
    const facilityId = facilityResult.rows[0].id;
    console.log(`Created facility with ID: ${facilityId}`);
    
    // Step 2: Create a survey using that facility ID
    console.log('\nStep 2: Creating a survey');
    const surveyResult = await client.query(`
      INSERT INTO surveys (
        external_id, 
        facility_id, 
        collection_date, 
        respondent_id,
        created_at, 
        updated_at
      ) VALUES (
        'ultra-simple-external-id',
        $1,
        NOW(),
        'test-respondent',
        NOW(),
        NOW()
      ) RETURNING id
    `, [facilityId]);
    
    const surveyId = surveyResult.rows[0].id;
    console.log(`Created survey with ID: ${surveyId}`);
    
    // Step 3: Verify we can read both records
    console.log('\nStep 3: Verifying facility and survey');
    
    const verifyFacility = await client.query(`
      SELECT id, name FROM facilities WHERE id = $1
    `, [facilityId]);
    
    console.log('Facility:', verifyFacility.rows[0]);
    
    const verifySurvey = await client.query(`
      SELECT id, external_id, facility_id FROM surveys WHERE id = $1
    `, [surveyId]);
    
    console.log('Survey:', verifySurvey.rows[0]);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\nTransaction committed successfully');
    console.log('✅ Test passed! Successfully created and verified facility and survey.');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error in test:', error.message);
    
    // Log all error details
    if (error.detail) console.error('Error detail:', error.detail);
    if (error.code) console.error('Error code:', error.code);
    if (error.column) console.error('Problem column:', error.column);
    if (error.constraint) console.error('Constraint:', error.constraint);
    if (error.table) console.error('Table:', error.table);
    
    // If it's a database error, try to get more info about the problematic table
    if (error.code && (error.code.startsWith('42') || error.code.startsWith('23'))) {
      try {
        console.log('\nAttempting to get more table information...');
        
        // Check table structure
        const tableInfo = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [error.table || 'surveys']);
        
        console.log(`Table ${error.table || 'surveys'} columns:`);
        tableInfo.rows.forEach(col => {
          console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
        });
      } catch (infoError) {
        console.error('Error getting table information:', infoError.message);
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\n========================================');
    console.log('Test completed');
    console.log('========================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
