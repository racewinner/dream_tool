/**
 * Survey Schema Analyzer
 * Focuses exclusively on identifying all survey table columns and constraints
 */
require('dotenv').config();
const { Pool } = require('pg');

console.log('========================================');
console.log('SURVEY SCHEMA ANALYZER');
console.log('========================================');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

async function main() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  
  try {
    console.log('1. Checking if surveys table exists');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'surveys'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.error('❌ surveys table does not exist!');
      return;
    }
    
    console.log('✅ surveys table exists');
    
    console.log('\n2. Getting surveys table columns with full details');
    const columns = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'surveys'
      ORDER BY ordinal_position;
    `);
    
    console.log(`Found ${columns.rows.length} columns in surveys table:`);
    const requiredColumns = [];
    
    columns.rows.forEach(col => {
      const isRequired = col.is_nullable === 'NO' && !col.column_default;
      if (isRequired && col.column_name !== 'id') {
        requiredColumns.push(col.column_name);
      }
      
      console.log(`- ${col.column_name}: ${col.data_type}${
        col.character_maximum_length ? `(${col.character_maximum_length})` : ''
      } ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}${
        col.column_default ? ` DEFAULT ${col.column_default}` : ''
      }${isRequired ? ' [REQUIRED]' : ''}`);
    });
    
    console.log(`\n❗ Required columns (NOT NULL, no default): ${requiredColumns.join(', ')}`);
    
    console.log('\n3. Checking table constraints');
    const constraints = await client.query(`
      SELECT
        c.conname as constraint_name,
        c.contype as constraint_type,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public'
      AND c.conrelid = 'surveys'::regclass;
    `);
    
    console.log(`Found ${constraints.rows.length} constraints on surveys table:`);
    constraints.rows.forEach(con => {
      let type;
      switch(con.constraint_type) {
        case 'p': type = 'PRIMARY KEY'; break;
        case 'f': type = 'FOREIGN KEY'; break;
        case 'u': type = 'UNIQUE'; break;
        case 'c': type = 'CHECK'; break;
        default: type = con.constraint_type;
      }
      console.log(`- ${con.constraint_name}: ${type} ${con.constraint_definition}`);
    });
    
    console.log('\n4. Checking foreign keys');
    const foreignKeys = await client.query(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'surveys';
    `);
    
    console.log(`Found ${foreignKeys.rows.length} foreign keys:`);
    foreignKeys.rows.forEach(fk => {
      console.log(`- ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    console.log('\n5. Trying to insert a survey with ALL required columns');
    // Create a facility first
    const facilityResult = await client.query(`
      INSERT INTO facilities (name, created_at, updated_at)
      VALUES ('Schema Analysis Facility', NOW(), NOW())
      RETURNING id;
    `);
    
    const facilityId = facilityResult.rows[0].id;
    console.log(`Created facility with ID: ${facilityId}`);
    
    // Build a dynamic insert with ALL required columns
    const values = {};
    requiredColumns.forEach(col => {
      switch(col) {
        case 'external_id':
          values[col] = `schema-analysis-${Date.now()}`;
          break;
        case 'facility_id':
          values[col] = facilityId;
          break;
        case 'collection_date':
          values[col] = new Date();
          break;
        case 'respondent_id':
          values[col] = 'schema-analysis-respondent';
          break;
        case 'created_at':
        case 'updated_at':
          values[col] = 'NOW()';
          break;
        default:
          // For any other required column, use a placeholder value
          values[col] = `placeholder-${col}`;
      }
    });
    
    // Add created_at and updated_at if not already in required columns
    if (!values['created_at']) values['created_at'] = 'NOW()';
    if (!values['updated_at']) values['updated_at'] = 'NOW()';
    
    // Convert to SQL
    const cols = Object.keys(values);
    const placeholders = cols.map((col, i) => 
      values[col] === 'NOW()' ? 'NOW()' : `$${i+1}`
    );
    const params = cols
      .filter(col => values[col] !== 'NOW()')
      .map(col => values[col]);
    
    const insertQuery = `
      INSERT INTO surveys (${cols.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING id;
    `;
    
    console.log('Insert query:', insertQuery);
    console.log('Parameters:', params);
    
    try {
      const surveyResult = await client.query(insertQuery, params);
      console.log(`✅ SUCCESS! Created survey with ID: ${surveyResult.rows[0].id}`);
      
      // Verify by retrieving the survey
      const verifyResult = await client.query(`
        SELECT * FROM surveys WHERE id = $1
      `, [surveyResult.rows[0].id]);
      
      console.log('\nInserted survey data:');
      console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    } catch (error) {
      console.error('❌ Insert failed!');
      console.error('Error:', error.message);
      
      // Log detailed error info
      if (error.code) console.error('Error code:', error.code);
      if (error.detail) console.error('Error detail:', error.detail);
      if (error.column) console.error('Problem column:', error.column);
      if (error.constraint) console.error('Constraint:', error.constraint);
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
    console.log('Analysis complete');
    console.log('========================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
