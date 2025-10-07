/**
 * Ultra-minimal survey creation test
 * Completely focused on just the survey insertion with maximal error output
 */
require('dotenv').config();
const { Pool } = require('pg');

console.log('========================================');
console.log('MINIMAL SURVEY TEST');
console.log('========================================');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

console.log('Using database config:', {
  ...dbConfig,
  password: '********'
});

async function main() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  
  try {
    console.log('\n1. Checking database connection');
    const connTest = await client.query('SELECT NOW() as time');
    console.log(`Connected at: ${connTest.rows[0].time}`);
    
    console.log('\n2. Getting surveys table schema');
    const columnsQuery = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'surveys'
      ORDER BY ordinal_position;
    `);
    
    console.log(`Found ${columnsQuery.rows.length} columns in surveys table:`);
    columnsQuery.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}${col.column_default ? `, default: ${col.column_default}` : ''})`);
    });
    
    // Extract required columns (those that are NOT NULL and have no default)
    const requiredColumns = columnsQuery.rows
      .filter(col => col.is_nullable === 'NO' && !col.column_default)
      .map(col => col.column_name)
      .filter(name => name !== 'id'); // id is typically auto-generated
      
    console.log(`\nRequired columns (NOT NULL, no default): ${requiredColumns.join(', ')}`);
    
    console.log('\n3. Creating a test facility');
    const facilityResult = await client.query(`
      INSERT INTO facilities (name, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
      RETURNING id, name;
    `, ['Minimal Test Facility']);
    
    const facilityId = facilityResult.rows[0].id;
    console.log(`Created facility: ${facilityResult.rows[0].name} (ID: ${facilityId})`);
    
    console.log('\n4. Attempting minimal survey insert');
    // Create a survey with just the required fields
    try {
      const insertQuery = `
        INSERT INTO surveys (
          external_id,
          collection_date,
          respondent_id,
          facility_id,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, NOW(), NOW()
        ) RETURNING id, external_id;
      `;
      
      const params = [
        `minimal-test-${Date.now()}`,
        new Date(),
        'minimal-respondent',
        facilityId
      ];
      
      console.log('SQL:', insertQuery);
      console.log('Params:', params);
      
      const surveyResult = await client.query(insertQuery, params);
      console.log(`✅ SUCCESS! Created survey with ID: ${surveyResult.rows[0].id}`);
      
      // Verify by retrieving the survey
      const verifyResult = await client.query(`
        SELECT * FROM surveys WHERE id = $1
      `, [surveyResult.rows[0].id]);
      
      console.log('\nSurvey data:', JSON.stringify(verifyResult.rows[0], (key, value) => {
        // Format dates nicely
        if (value instanceof Date) return value.toISOString();
        return value;
      }, 2));
      
    } catch (surveyError) {
      console.error('❌ Survey insert failed!');
      console.error('Error:', surveyError.message);
      
      // Log detailed error info
      if (surveyError.code) console.error('Error code:', surveyError.code);
      if (surveyError.detail) console.error('Error detail:', surveyError.detail);
      if (surveyError.column) console.error('Problem column:', surveyError.column);
      if (surveyError.constraint) console.error('Constraint:', surveyError.constraint);
      
      // Try a super-minimal insert
      console.log('\n5. Trying super-minimal insert with only external_id and facility_id');
      try {
        const minimalQuery = `
          INSERT INTO surveys (external_id, facility_id, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW())
          RETURNING id;
        `;
        
        const minParams = [`super-minimal-${Date.now()}`, facilityId];
        console.log('SQL:', minimalQuery);
        console.log('Params:', minParams);
        
        const minResult = await client.query(minimalQuery, minParams);
        console.log(`✅ Super-minimal insert worked! ID: ${minResult.rows[0].id}`);
        
      } catch (minError) {
        console.error('❌ Super-minimal insert also failed!');
        console.error('Error:', minError.message);
        
        // Try direct SQL query
        console.log('\n6. Trying direct SQL insert without parameterization');
        try {
          const directSQL = `
            INSERT INTO surveys (external_id, facility_id, created_at, updated_at)
            VALUES ('direct-sql-${Date.now()}', ${facilityId}, NOW(), NOW())
            RETURNING id;
          `;
          
          console.log('SQL:', directSQL);
          const directResult = await client.query(directSQL);
          console.log(`✅ Direct SQL insert worked! ID: ${directResult.rows[0].id}`);
          
        } catch (directError) {
          console.error('❌ Direct SQL insert failed!');
          console.error('Error:', directError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in main process:', error.message);
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
  })
  .catch(err => {
    console.error('Script failed:', err);
  });
