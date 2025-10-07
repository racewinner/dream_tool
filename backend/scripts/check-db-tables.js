const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dream_tool',
  password: process.env.DB_PASSWORD || 'password123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Helper to run a query and log results
async function runQueryAndLog(client, title, query) {
  console.log(`\n=============== ${title} ===============`);
  try {
    const result = await client.query(query);
    if (result.rows && result.rows.length > 0) {
      console.log(`Found ${result.rows.length} records:`);
      console.table(result.rows);
    } else {
      console.log('No records found.');
    }
    return result.rows;
  } catch (err) {
    console.error(`Error executing query: ${err.message}`);
    return [];
  }
}

// Helper to check table structure
async function checkTableStructure(client, tableName) {
  console.log(`\n--- Checking structure for table: ${tableName} ---`);
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`Table '${tableName}' exists with ${result.rows.length} columns:`);
      console.table(result.rows);
      return result.rows;
    } else {
      console.log(`Table '${tableName}' not found or has no columns.`);
      return [];
    }
  } catch (err) {
    console.error(`Error checking table structure: ${err.message}`);
    return [];
  }
}

async function checkDatabase() {
  const client = await pool.connect();
  try {
    console.log('\n======================================================');
    console.log('            DATABASE TABLE VERIFICATION');
    console.log('======================================================\n');
    
    // First check all table structures to make sure we know the column names
    const tables = ['raw_imports', 'facilities', 'surveys'];
    const tableStructures = {};
    
    for (const tableName of tables) {
      const columns = await checkTableStructure(client, tableName);
      if (columns.length > 0) {
        tableStructures[tableName] = columns.map(col => col.column_name);
      }
    }
    
    console.log('\n--- Found Table Structures ---');
    console.log(JSON.stringify(tableStructures, null, 2));
    
    // Check if tables exist before attempting to query them
    if (!tableStructures.raw_imports) {
      console.log('\n⚠️ raw_imports table not found. Skipping related queries.');
    } else {
      // Determine the correct timestamp column (created_at or "createdAt")
      const timestampCol = tableStructures.raw_imports.includes('created_at') ? 'created_at' : 
                          tableStructures.raw_imports.includes('"createdAt"') ? '"createdAt"' : 
                          tableStructures.raw_imports.includes('createdAt') ? 'createdAt' : null;
      
      // Check raw_imports table
      if (timestampCol) {
        await runQueryAndLog(client, 'RAW IMPORTS TABLE', `
          SELECT id, source, status, ${timestampCol}
          FROM raw_imports 
          ORDER BY ${timestampCol} DESC 
          LIMIT 5;
        `);
        
        // Count imports by status
        await runQueryAndLog(client, 'RAW IMPORTS BY STATUS', `
          SELECT status, count(*) 
          FROM raw_imports 
          GROUP BY status;
        `);
      } else {
        console.log('\n⚠️ Could not determine timestamp column for raw_imports table');
      }
    }
    
    // Check facilities table
    if (!tableStructures.facilities) {
      console.log('\n⚠️ facilities table not found. Skipping related queries.');
    } else {
      const facilityTimestampCol = tableStructures.facilities.includes('created_at') ? 'created_at' : 
                                  tableStructures.facilities.includes('"createdAt"') ? '"createdAt"' : 
                                  tableStructures.facilities.includes('createdAt') ? 'createdAt' : null;
      
      if (facilityTimestampCol) {
        await runQueryAndLog(client, 'FACILITIES TABLE', `
          SELECT id, name, type, ${tableStructures.facilities.includes('latitude') ? 'latitude,' : ''} 
                 ${tableStructures.facilities.includes('longitude') ? 'longitude,' : ''} 
                 status, ${facilityTimestampCol}
          FROM facilities 
          ORDER BY ${facilityTimestampCol} DESC 
          LIMIT 5;
        `);
      } else {
        console.log('\n⚠️ Could not determine timestamp column for facilities table');
      }
    }
    
    // Check surveys table
    if (!tableStructures.surveys) {
      console.log('\n⚠️ surveys table not found. Skipping related queries.');
    } else {
      const surveyTimestampCol = tableStructures.surveys.includes('created_at') ? 'created_at' : 
                                tableStructures.surveys.includes('"createdAt"') ? '"createdAt"' : 
                                tableStructures.surveys.includes('createdAt') ? 'createdAt' : null;
      
      const facilityIdCol = tableStructures.surveys.includes('facility_id') ? 'facility_id' : 
                           tableStructures.surveys.includes('facilityId') ? 'facilityId' : 
                           tableStructures.surveys.includes('"facilityId"') ? '"facilityId"' : null;
      
      if (surveyTimestampCol) {
        await runQueryAndLog(client, 'SURVEYS TABLE', `
          SELECT id, title, status${facilityIdCol ? `, ${facilityIdCol}` : ''}, ${surveyTimestampCol}
          FROM surveys 
          ORDER BY ${surveyTimestampCol} DESC 
          LIMIT 5;
        `);
      } else {
        console.log('\n⚠️ Could not determine timestamp column for surveys table');
      }
    }
    
    // Check relationships only if all tables exist and we know the correct column names
    if (tableStructures.surveys && 
        tableStructures.facilities && 
        surveyTimestampCol && 
        facilityIdCol) {
      
      await runQueryAndLog(client, 'SURVEY-FACILITY RELATIONSHIPS', `
        SELECT s.id as survey_id, s.title as survey_title, 
               f.id as facility_id, f.name as facility_name
        FROM surveys s
        JOIN facilities f ON s.${facilityIdCol} = f.id
        ORDER BY s.${surveyTimestampCol} DESC
        LIMIT 5;
      `);
    }
    
  } catch (err) {
    console.error(`Database check failed: ${err.message}`);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
    console.log('\n======================================================');
    console.log('            DATABASE CHECK COMPLETED');
    console.log('======================================================\n');
  }
}

checkDatabase().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
