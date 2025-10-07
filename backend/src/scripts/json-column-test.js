/**
 * JSON Column Test for Surveys Table
 * Tests insertion with proper JSON handling for facility_data column
 */
require('dotenv').config();
const { Pool } = require('pg');

console.log('========================================');
console.log('JSON COLUMN TEST FOR SURVEYS');
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
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('\n1. Creating test facility');
    const facilityResult = await client.query(`
      INSERT INTO facilities (name, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
      RETURNING id, name;
    `, ['JSON Test Facility']);
    
    const facilityId = facilityResult.rows[0].id;
    console.log(`Created facility: ${facilityResult.rows[0].name} (ID: ${facilityId})`);
    
    console.log('\n2. Trying survey insert with proper JSON for facility_data');
    
    // Create a valid JSON object for facility_data
    const facilityData = {
      name: 'JSON Test Facility',
      location: {
        latitude: 12.345,
        longitude: 67.890
      },
      metadata: {
        source: 'test-script',
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      const insertQuery = `
        INSERT INTO surveys (
          external_id,
          facility_id,
          facility_data,
          collection_date,
          respondent_id,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING id, external_id;
      `;
      
      const params = [
        `json-test-${Date.now()}`,
        facilityId,
        JSON.stringify(facilityData), // Convert JS object to JSON string
        new Date(),
        'json-test-respondent'
      ];
      
      console.log('SQL:', insertQuery);
      console.log('Params:', params.map((p, i) => 
        i === 2 ? `$3: [JSON string, ${Buffer.from(JSON.stringify(facilityData)).length} bytes]` : `$${i+1}: ${p}`
      ));
      
      const surveyResult = await client.query(insertQuery, params);
      console.log(`✅ SUCCESS! Created survey with ID: ${surveyResult.rows[0].id}`);
      
      // Verify by retrieving the survey
      const verifyResult = await client.query(`
        SELECT id, external_id, facility_id, collection_date FROM surveys WHERE id = $1
      `, [surveyResult.rows[0].id]);
      
      console.log('\nSurvey basic data:', verifyResult.rows[0]);
      
      // Verify facility_data separately to display as formatted JSON
      const jsonResult = await client.query(`
        SELECT facility_data FROM surveys WHERE id = $1
      `, [surveyResult.rows[0].id]);
      
      console.log('\nfacility_data content:');
      console.log(JSON.stringify(jsonResult.rows[0].facility_data, null, 2));
      
      await client.query('COMMIT');
      console.log('\nTransaction committed successfully');
      
    } catch (surveyError) {
      await client.query('ROLLBACK');
      console.error('❌ Survey insert failed!');
      console.error('Error:', surveyError.message);
      
      // Log detailed error info
      if (surveyError.code) console.error('Error code:', surveyError.code);
      if (surveyError.detail) console.error('Error detail:', surveyError.detail);
      if (surveyError.column) console.error('Problem column:', surveyError.column);
      if (surveyError.constraint) console.error('Constraint:', surveyError.constraint);
      
      // Try with explicit CAST to json
      console.log('\n3. Trying with explicit CAST to json');
      try {
        const insertWithCastQuery = `
          INSERT INTO surveys (
            external_id,
            facility_id,
            facility_data,
            collection_date,
            respondent_id,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3::json, $4, $5, NOW(), NOW()
          ) RETURNING id, external_id;
        `;
        
        const params = [
          `json-cast-test-${Date.now()}`,
          facilityId,
          JSON.stringify(facilityData),
          new Date(),
          'json-cast-test-respondent'
        ];
        
        console.log('SQL with CAST:', insertWithCastQuery);
        
        const surveyResult = await client.query(insertWithCastQuery, params);
        console.log(`✅ SUCCESS with CAST! Created survey with ID: ${surveyResult.rows[0].id}`);
        await client.query('COMMIT');
        
      } catch (castError) {
        await client.query('ROLLBACK');
        console.error('❌ Survey insert with CAST also failed!');
        console.error('Error:', castError.message);
        
        // Try with direct JSON literal in SQL
        console.log('\n4. Trying with direct JSON literal in SQL');
        try {
          const jsonLiteral = JSON.stringify(facilityData).replace(/'/g, "''");
          const directQuery = `
            INSERT INTO surveys (
              external_id,
              facility_id,
              facility_data,
              collection_date,
              respondent_id,
              created_at,
              updated_at
            ) VALUES (
              'json-direct-${Date.now()}',
              ${facilityId},
              '${jsonLiteral}'::json,
              NOW(),
              'json-direct-respondent',
              NOW(),
              NOW()
            ) RETURNING id, external_id;
          `;
          
          console.log('Direct SQL with JSON literal');
          
          const directResult = await client.query(directQuery);
          console.log(`✅ SUCCESS with direct JSON! Created survey with ID: ${directResult.rows[0].id}`);
          await client.query('COMMIT');
          
        } catch (directError) {
          await client.query('ROLLBACK');
          console.error('❌ Direct JSON literal insert also failed!');
          console.error('Error:', directError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in main process:', error);
    await client.query('ROLLBACK').catch(() => {});
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
