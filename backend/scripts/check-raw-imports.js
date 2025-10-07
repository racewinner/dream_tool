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

async function checkRawImports() {
  const client = await pool.connect();
  
  console.log('=== Checking for raw_imports table ===');
  
  try {
    // 1. List all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n=== All Tables ===');
    console.table(tables.rows);
    
    // 2. Check if raw_imports exists
    const hasRawImports = tables.rows.some(t => t.table_name === 'raw_imports');
    if (!hasRawImports) {
      console.log('\n❌ raw_imports table not found in the database');
      return;
    }
    
    console.log('\n=== raw_imports table structure ===');
    const structure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'raw_imports'
    `);
    console.table(structure.rows);
    
    // 3. Check if data column exists and its type
    const hasDataColumn = structure.rows.some(col => col.column_name === 'data');
    if (!hasDataColumn) {
      console.log('\n❌ data column not found in raw_imports table');
      return;
    }
    
    // 4. Get sample data
    console.log('\n=== Sample data from raw_imports ===');
    const sample = await client.query(`
      SELECT id, source, status, created_at, 
             pg_column_size(data) as data_size_bytes,
             jsonb_typeof(data) as data_type,
             (SELECT jsonb_object_keys(data) LIMIT 1) as first_key
      FROM raw_imports
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    console.log('\n=== Recent Imports ===');
    console.table(sample.rows);
    
    // 5. Get more details about the data structure
    if (sample.rows.length > 0) {
      console.log('\n=== Data Structure Analysis ===');
      const row = sample.rows[0];
      console.log(`Data size: ${Math.round(row.data_size_bytes/1024)} KB`);
      console.log(`Data type: ${row.data_type}`);
      console.log(`First key: ${row.first_key}`);
      
      // Get sample of data keys
      const keys = await client.query(`
        SELECT jsonb_object_keys(data) as key
        FROM raw_imports
        WHERE jsonb_typeof(data) = 'object'
        LIMIT 10
      `);
      
      console.log('\n=== Sample Data Keys ===');
      console.table(keys.rows);
      
      // Check for Kobo-specific fields
      const koboFields = ['_id', '_submission_time', '_xform_id_string'];
      const hasKoboFields = koboFields.every(field => 
        keys.rows.some(k => k.key === field)
      );
      
      console.log(`\n=== Kobo Data Check ===`);
      console.log(`Contains Kobo metadata: ${hasKoboFields ? '✅ Yes' : '❌ No'}`);
      
      // Check if data looks complete
      const hasReasonableSize = row.data_size_bytes > 500; // At least 500 bytes
      const hasMultipleFields = keys.rows.length >= 3; // At least 3 fields
      
      console.log(`\n=== Data Completeness Check ===`);
      console.log(`Data size reasonable (>500 bytes): ${hasReasonableSize ? '✅' : '❌'}`);
      console.log(`Contains multiple fields (>=3): ${hasMultipleFields ? '✅' : '❌'}`);
      
      if (hasKoboFields && hasReasonableSize && hasMultipleFields) {
        console.log('\n✅ Data appears to be complete KoboToolbox payloads');
      } else {
        console.log('\n❌ Data may be incomplete or missing expected fields');
      }
    }
    
  } catch (err) {
    console.error('Error checking raw_imports:', err);
  } finally {
    await client.release();
    await pool.end();
  }
}
    console.log(`${colors.cyan}Checking raw_imports table structure...${colors.reset}`);
    
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'raw_imports'
      ORDER BY ordinal_position
    `);
    
    if (tableStructure.rows.length === 0) {
      console.log(`${colors.red}❌ raw_imports table not found in database.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ raw_imports table exists with ${tableStructure.rows.length} columns:${colors.reset}`);
    console.table(tableStructure.rows);
    
    // 2. Check if there are any records in the table
    console.log(`\n${colors.cyan}Checking for records in raw_imports table...${colors.reset}`);
    
    // First check the actual table name since PostgreSQL might use lowercase
    const tableCheck = await client.query(`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE tablename LIKE '%raw%import%'
    `);
    
    let tableName = 'raw_imports';
    if (tableCheck.rows.length > 0) {
      tableName = tableCheck.rows[0].tablename;
      console.log(`${colors.yellow}Using table name: ${tableName}${colors.reset}`);
    }
    
    const countResult = await client.query(`
      SELECT COUNT(*) as count FROM ${tableName}
    `);
    
    const recordCount = parseInt(countResult.rows[0].count);
    
    if (recordCount === 0) {
      console.log(`${colors.yellow}⚠️ No records found in ${tableName} table.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Found ${recordCount} records in ${tableName} table.${colors.reset}`);
    
    // 3. Examine the most recent records
    console.log(`\n${colors.cyan}Examining the most recent raw import records...${colors.reset}`);
    
    // Find the correct column names based on the actual table structure
    const columns = tableStructure.rows.map(row => row.column_name);
    const hasId = columns.includes('id');
    const hasSource = columns.includes('source');
    const hasData = columns.includes('data');
    const hasStatus = columns.includes('status');
    const hasCreatedAt = columns.includes('createdat') || columns.includes('created_at') || columns.includes('"createdAt"');
    
    let createdAtColumn = 'created_at';
    if (columns.includes('createdat')) createdAtColumn = 'createdat';
    else if (columns.includes('"createdAt"')) createdAtColumn = '"createdAt"';
    
    // Construct a query using the columns we have
    let query = `SELECT `;
    let selectColumns = [];
    
    if (hasId) selectColumns.push('id');
    if (hasSource) selectColumns.push('source');
    if (hasStatus) selectColumns.push('status');
    if (hasCreatedAt) selectColumns.push(`${createdAtColumn}`);
    if (hasData) selectColumns.push('data');
    
    query += selectColumns.join(', ');
    query += ` FROM ${tableName} ORDER BY ${createdAtColumn} DESC LIMIT 3`;
    
    const recentRecords = await client.query(query);
    
    if (recentRecords.rows.length === 0) {
      console.log(`${colors.yellow}⚠️ No recent records could be retrieved.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✓ Recent records retrieved:${colors.reset}`);
    
    // Display basic info about each record without the full data payload
    recentRecords.rows.forEach((record, index) => {
      console.log(`\n${colors.bright}${colors.blue}Record #${index + 1}:${colors.reset}`);
      
      if (hasId) console.log(`ID: ${record.id}`);
      if (hasSource) console.log(`Source: ${record.source}`);
      if (hasStatus) console.log(`Status: ${record.status}`);
      if (hasCreatedAt) console.log(`Created At: ${record[createdAtColumn]}`);
      
      // Check if data exists and analyze it
      if (hasData && record.data) {
        if (typeof record.data === 'string') {
          try {
            // Try to parse if it's stored as a string
            record.data = JSON.parse(record.data);
          } catch (e) {
            // It's not valid JSON, leave as is
          }
        }
        
        console.log(`\n${colors.cyan}Data Content Analysis:${colors.reset}`);
        
        // Check data completeness
        console.log(`Data is ${typeof record.data}`);
        
        if (typeof record.data === 'object') {
          const keys = Object.keys(record.data);
          console.log(`Contains ${keys.length} top-level keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);
          
          // Look for specific KoboToolbox fields
          const hasSubmissionTime = record.data._submission_time !== undefined;
          const hasId = record.data._id !== undefined;
          const hasXform = record.data._xform_id_string !== undefined;
          
          if (hasSubmissionTime && hasId && hasXform) {
            console.log(`${colors.green}✓ Contains essential KoboToolbox metadata (_submission_time, _id, _xform_id_string)${colors.reset}`);
          } else {
            console.log(`${colors.yellow}⚠️ Missing some KoboToolbox metadata:${colors.reset}`);
            console.log(`  _submission_time: ${hasSubmissionTime ? 'Present' : 'Missing'}`);
            console.log(`  _id: ${hasId ? 'Present' : 'Missing'}`);
            console.log(`  _xform_id_string: ${hasXform ? 'Present' : 'Missing'}`);
          }
          
          // Check for survey response data (typically many fields)
          const surveyFields = keys.filter(k => !k.startsWith('_'));
          console.log(`Contains ${surveyFields.length} survey response fields`);
          
          if (surveyFields.length > 5) {
            console.log(`${colors.green}✓ Appears to contain substantial survey response data${colors.reset}`);
          } else {
            console.log(`${colors.yellow}⚠️ Few survey response fields found (${surveyFields.length})${colors.reset}`);
          }
        }
        
        // Calculate approximate data size
        const dataSize = JSON.stringify(record.data).length;
        console.log(`Approximate data size: ${Math.round(dataSize / 1024)} KB`);
        
        if (dataSize < 100) {
          console.log(`${colors.red}❌ Data appears to be too small for a complete KoboToolbox response${colors.reset}`);
        } else if (dataSize < 1000) {
          console.log(`${colors.yellow}⚠️ Data might be incomplete (small size)${colors.reset}`);
        } else {
          console.log(`${colors.green}✓ Data size appears reasonable for a KoboToolbox response${colors.reset}`);
        }
        
        // Show a sample of the data (just a few fields)
        console.log(`\n${colors.cyan}Sample of data fields:${colors.reset}`);
        const sample = {};
        let i = 0;
        for (const key in record.data) {
          if (i++ < 5) {
            sample[key] = record.data[key];
          }
        }
        console.log(JSON.stringify(sample, null, 2));
      } else {
        console.log(`${colors.red}❌ No data field found or data is null/empty${colors.reset}`);
      }
    });

  } catch (err) {
    console.error(`${colors.red}Error checking raw imports: ${err.message}${colors.reset}`);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
    
    console.log(`\n${colors.bright}${colors.blue}=========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}    VERIFICATION COMPLETE    ${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}=========================================${colors.reset}`);
  }
}

// Run the check
checkRawImports().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
