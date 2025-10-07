/**
 * Script to examine the surveys table structure in detail
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const { Pool } = require('pg');

console.log('========================================');
console.log('Surveys Table Structure Check');
console.log('========================================');

// Database connection from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// Initialize pool
const pool = new Pool(dbConfig);

async function main() {
  const client = await pool.connect();
  
  try {
    console.log('Checking if surveys table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'surveys'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Surveys table does not exist!');
      return;
    }
    
    console.log('✅ Surveys table exists');
    
    // Get detailed column information
    console.log('\nGetting surveys table columns:');
    const columnsQuery = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'surveys'
      ORDER BY ordinal_position;
    `);
    
    console.log(`Found ${columnsQuery.rows.length} columns:`);
    columnsQuery.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'}${col.column_default ? `, default: ${col.column_default}` : ''})`);
    });
    
    // Get primary key information
    console.log('\nChecking primary key:');
    const pkQuery = await client.query(`
      SELECT c.column_name, c.data_type
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
      JOIN information_schema.columns AS c 
        ON c.table_schema = tc.constraint_schema
        AND tc.table_name = c.table_name
        AND ccu.column_name = c.column_name
      WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_name = 'surveys';
    `);
    
    if (pkQuery.rows.length === 0) {
      console.log('❌ No primary key defined');
    } else {
      console.log('✅ Primary key columns:');
      pkQuery.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    }
    
    // Get foreign key information
    console.log('\nChecking foreign keys:');
    const fkQuery = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'surveys';
    `);
    
    if (fkQuery.rows.length === 0) {
      console.log('❌ No foreign keys defined');
    } else {
      console.log('✅ Foreign key relationships:');
      fkQuery.rows.forEach(row => {
        console.log(`- ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name} (${row.constraint_name})`);
      });
    }
    
    // Check if there's a raw_data or similar column for storing JSON
    console.log('\nChecking for JSON/JSONB columns:');
    const jsonColumns = columnsQuery.rows.filter(col => 
      col.data_type === 'json' || col.data_type === 'jsonb'
    );
    
    if (jsonColumns.length === 0) {
      console.log('❌ No JSON/JSONB columns found');
      
      // Look for similarly named columns that might store the survey data
      console.log('\nPossible survey data columns:');
      const possibleDataColumns = columnsQuery.rows.filter(col => 
        col.column_name.includes('data') || 
        col.column_name.includes('json') || 
        col.column_name.includes('content') ||
        col.column_name.includes('response')
      );
      
      if (possibleDataColumns.length === 0) {
        console.log('❌ No likely survey data columns found');
      } else {
        possibleDataColumns.forEach(col => {
          console.log(`- ${col.column_name} (${col.data_type})`);
        });
      }
    } else {
      console.log('✅ JSON/JSONB columns:');
      jsonColumns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
    }
    
    // Try a sample insert
    console.log('\nTrying a minimal survey insert...');
    try {
      // First create a facility to reference
      const facilityResult = await client.query(`
        INSERT INTO facilities (name, created_at, updated_at)
        VALUES ('Test Facility For Survey', NOW(), NOW())
        RETURNING id;
      `);
      
      const facilityId = facilityResult.rows[0].id;
      
      // Build a dynamic insert based on the actual columns
      const columns = columnsQuery.rows
        .filter(col => col.column_name !== 'id') // Skip the ID column which is likely auto-generated
        .map(col => col.column_name);
      
      // Prepare values for each column
      const values = columns.map(col => {
        if (col === 'external_id') return 'test-external-id-' + Date.now();
        if (col === 'collection_date') return 'NOW()';
        if (col === 'respondent_id') return 'test-respondent';
        if (col === 'facility_id') return facilityId;
        if (col === 'created_at' || col === 'updated_at') return 'NOW()';
        if (col.includes('data') && (col.endsWith('data') || col.startsWith('data'))) 
          return "'{\"test\": \"data\"}'";
        return 'NULL';
      });
      
      // Replace any 'NOW()' with the actual function call (not a parameter)
      let placeholders = values.map((val, i) => val === 'NOW()' ? 'NOW()' : `$${i+1}`);
      
      // Filter out the actual values (excluding NOW() function calls)
      const actualValues = values.filter(val => val !== 'NOW()');
      
      const insertSql = `
        INSERT INTO surveys (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING id;
      `;
      
      console.log('Insert SQL:', insertSql);
      console.log('Values:', actualValues);
      
      const surveyResult = await client.query(
        insertSql,
        actualValues
      );
      
      const surveyId = surveyResult.rows[0].id;
      console.log(`✅ Successfully inserted survey with ID: ${surveyId}`);
      
      // Retrieve the inserted survey
      const retrieveResult = await client.query(
        `SELECT * FROM surveys WHERE id = $1`,
        [surveyId]
      );
      
      console.log('\nInserted survey data:');
      console.log(retrieveResult.rows[0]);
      
    } catch (error) {
      console.error('❌ Error inserting survey:', error.message);
      if (error.position) console.log('Error position:', error.position);
      if (error.detail) console.log('Error detail:', error.detail);
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
    console.log('Survey table check completed');
    console.log('========================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
