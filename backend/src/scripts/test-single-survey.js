/**
 * Single survey insert test script with complete error tracing
 */

// Load environment variables
require('dotenv').config();
const { Pool } = require('pg');

console.log('========================================');
console.log('Single Survey Insert Test');
console.log('========================================');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

console.log('Database:', `${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Main function
async function main() {
  // Create a pool and connect
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  
  try {
    console.log('\nStep 1: Checking database connection...');
    const testResult = await client.query('SELECT NOW() as time');
    console.log(`Database connection successful, server time: ${testResult.rows[0].time}`);
    
    console.log('\nStep 2: Getting surveys table structure...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'surveys'
      ORDER BY ordinal_position;
    `);
    
    if (tableInfo.rows.length === 0) {
      throw new Error('Surveys table not found or has no columns');
    }
    
    console.log('Surveys table columns:');
    tableInfo.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    console.log('\nStep 3: Creating a test facility...');
    // Start transaction
    await client.query('BEGIN');
    
    try {
      // Create a test facility
      const facilityResult = await client.query(`
        INSERT INTO facilities (name, created_at, updated_at)
        VALUES ($1, NOW(), NOW())
        RETURNING id, name;
      `, ['Test Single Survey Facility']);
      
      if (facilityResult.rows.length === 0) {
        throw new Error('Failed to create facility - no row returned');
      }
      
      const facilityId = facilityResult.rows[0].id;
      console.log(`Created facility with ID: ${facilityId}, Name: ${facilityResult.rows[0].name}`);
      
      console.log('\nStep 4: Creating a test survey...');
      // Create test data for all required columns
      const external_id = 'test-external-id-' + Date.now();
      const collection_date = new Date();
      const respondent_id = 'test-respondent';
      
      console.log('Inserting survey with data:');
      console.log({
        external_id,
        collection_date,
        respondent_id,
        facility_id: facilityId
      });
      
      // Build insert query based on the columns we know exist
      const requiredColumns = ['external_id', 'collection_date', 'respondent_id', 'facility_id', 'created_at', 'updated_at'];
      const columnList = requiredColumns.join(', ');
      const valuePlaceholders = ['$1', '$2', '$3', '$4', 'NOW()', 'NOW()'];
      
      const insertQuery = `
        INSERT INTO surveys (${columnList})
        VALUES (${valuePlaceholders.join(', ')})
        RETURNING id, external_id, facility_id;
      `;
      
      console.log('Query:', insertQuery);
      console.log('Values:', [external_id, collection_date, respondent_id, facilityId]);
      
      // Insert the survey
      try {
        const surveyResult = await client.query(insertQuery, [
          external_id,
          collection_date,
          respondent_id,
          facilityId
        ]);
        
        if (surveyResult.rows.length === 0) {
          throw new Error('Survey insert returned no rows');
        }
        
        console.log(`Successfully inserted survey with ID: ${surveyResult.rows[0].id}`);
        console.log('Survey data:', surveyResult.rows[0]);
        
        console.log('\nStep 5: Verifying the survey was inserted...');
        const verifyResult = await client.query(`
          SELECT * FROM surveys WHERE id = $1
        `, [surveyResult.rows[0].id]);
        
        if (verifyResult.rows.length === 0) {
          throw new Error('Could not verify survey existence after insert');
        }
        
        console.log('Survey verified! Complete data:');
        console.log(JSON.stringify(verifyResult.rows[0], null, 2));
        
        console.log('\nStep 6: Committing transaction...');
        await client.query('COMMIT');
        console.log('Transaction committed successfully');
        
        console.log('\n✅ All steps completed successfully!');
        
      } catch (surveyError) {
        await client.query('ROLLBACK');
        console.error('❌ Error inserting survey:', surveyError);
        console.error('Details:', surveyError.detail);
        if (surveyError.code) console.error(`Error code: ${surveyError.code}`);
        if (surveyError.column) console.error(`Problem column: ${surveyError.column}`);
        
        // Try with just the absolute minimum columns
        console.log('\nStep 4b: Trying with minimal fields...');
        await client.query('BEGIN');
        
        try {
          const minimalResult = await client.query(`
            INSERT INTO surveys (external_id, facility_id, created_at, updated_at)
            VALUES ($1, $2, NOW(), NOW())
            RETURNING id;
          `, [external_id + '-minimal', facilityId]);
          
          console.log(`Minimal insert succeeded with ID: ${minimalResult.rows[0].id}`);
          await client.query('COMMIT');
        } catch (minError) {
          await client.query('ROLLBACK');
          console.error('❌ Minimal insert also failed:', minError.message);
        }
      }
      
    } catch (facilityError) {
      await client.query('ROLLBACK');
      console.error('❌ Error in facility creation step:', facilityError);
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
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
