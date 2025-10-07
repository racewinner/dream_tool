// Script to check the structure of the facilities table
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// File to save the output
const outputFile = path.join(__dirname, 'facilities-schema-output.txt');

// Function to write to both console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(outputFile, message + '\n', 'utf8');
}

// Database configuration
const dbConfig = {
  user: 'postgres',
  password: 'password123',
  host: 'localhost',
  port: 5432,
  database: 'dream_tool'
};

async function checkTableSchema() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    log('Connected to the database');
    
    // Get column information for the facilities table
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'facilities'
      ORDER BY ordinal_position;
    `);
    
// Clear the output file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
    
    log('\nFacilities table structure:');
    if (result.rows.length === 0) {
      log('No columns found in the facilities table.');
    } else {
      // Display column information in a clean format
      log('\nColumn Name          | Data Type          | Nullable | Default');
      log('---------------------|--------------------|----------|-----------');
      
      result.rows.forEach(row => {
        const colName = row.column_name.padEnd(20);
        const dataType = row.data_type.padEnd(18);
        const nullable = row.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultValue = row.column_default || 'NULL';
        
        log(`${colName} | ${dataType} | ${nullable.padEnd(8)} | ${defaultValue}`);
      });
      
      log(`\nTotal columns: ${result.rows.length}`);
    }
    
  } catch (error) {
    log(`Error: ${error.message}`);
    if (error.stack) {
      log('Stack trace:');
      log(error.stack);
    }
  } finally {
    await client.end();
  }
}

checkTableSchema().catch(console.error);
