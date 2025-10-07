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

async function checkRawImportsSimple() {
  const client = await pool.connect();
  try {
    console.log('\n=== CHECKING DATABASE TABLES ===');
    
    // 1. List all tables to find raw_imports
    console.log('\n--- All Tables in Database ---');
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname='public'
    `);
    
    console.log('Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.tablename}`);
    });
    
    // Look for raw_imports table or similar
    const rawImportsTable = tablesResult.rows.find(row => 
      row.tablename.toLowerCase().includes('raw') && 
      row.tablename.toLowerCase().includes('import')
    );
    
    if (!rawImportsTable) {
      console.log('\n❌ No raw_imports table found!');
      return;
    }
    
    const tableName = rawImportsTable.tablename;
    console.log(`\n✅ Found raw imports table: "${tableName}"`);
    
    // 2. Check the structure of the table
    console.log(`\n--- Structure of "${tableName}" Table ---`);
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);
    
    console.log('Columns:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Store column names for later use
    const columnNames = columnsResult.rows.map(col => col.column_name);
    
    // 3. Check if the table has data
    console.log(`\n--- Data in "${tableName}" Table ---`);
    const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
    console.log(`Total records: ${countResult.rows[0].count}`);
    
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log('❌ Table is empty - no records to examine');
      return;
    }
    
    // 4. Examine most recent record, carefully constructing the query
    console.log('\n--- Most Recent Record ---');
    
    // Build a safe query with valid column names
    let selectColumns = [];
    
    // Always include these if they exist
    if (columnNames.includes('id')) selectColumns.push('"id"');
    if (columnNames.includes('source')) selectColumns.push('"source"');
    if (columnNames.includes('status')) selectColumns.push('"status"');
    
    // Look for created_at column variations
    const createdAtCol = columnNames.find(col => 
      col === 'created_at' || col === 'createdat' || col === 'createdAt'
    );
    
    if (createdAtCol) {
      selectColumns.push(`"${createdAtCol}"`);
      
      const recentRecordQuery = `
        SELECT ${selectColumns.join(', ')} 
        FROM "${tableName}" 
        ORDER BY "${createdAtCol}" DESC 
        LIMIT 1
      `;
      
      const recentResult = await client.query(recentRecordQuery);
      console.log('Recent record metadata:', recentResult.rows[0]);
    }
    
    // 5. Check if the data column exists and what it contains
    if (columnNames.includes('data')) {
      const dataQuery = `SELECT "data" FROM "${tableName}" ORDER BY "${createdAtCol || 'id'}" DESC LIMIT 1`;
      const dataResult = await client.query(dataQuery);
      
      if (dataResult.rows.length > 0 && dataResult.rows[0].data) {
        const data = dataResult.rows[0].data;
        console.log('\n--- Data Field Analysis ---');
        console.log(`Data type: ${typeof data}`);
        
        if (typeof data === 'object') {
          const keys = Object.keys(data);
          console.log(`Number of keys: ${keys.length}`);
          console.log(`Keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);
          
          // Check for KoboToolbox specific fields
          const koboKeys = keys.filter(k => k.startsWith('_'));
          console.log(`Kobo metadata keys: ${koboKeys.join(', ')}`);
          
          // Show a small sample of the data
          console.log('\nSample data (first 3 fields):');
          let i = 0;
          for (const key of keys) {
            if (i++ < 3) {
              console.log(`${key}: ${JSON.stringify(data[key]).substring(0, 100)}`);
            }
          }
          
          // Check size of data
          const dataSize = JSON.stringify(data).length;
          console.log(`\nData size: ~${Math.round(dataSize / 1024)} KB`);
          
          if (dataSize < 500) {
            console.log('⚠️ Data seems small for a full KoboToolbox payload');
          } else {
            console.log('✅ Data size appears reasonable for a KoboToolbox payload');
          }
        } else {
          console.log('❌ Data is not an object, might be a string or other type');
        }
      } else {
        console.log('❌ No data found in the most recent record');
      }
    } else {
      console.log('❌ Table does not have a "data" column');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
    console.log('\n=== CHECK COMPLETED ===');
  }
}

checkRawImportsSimple().catch(err => {
  console.error('Script failed:', err);
});
