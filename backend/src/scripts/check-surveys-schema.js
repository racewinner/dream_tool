// Script to check the structure of the surveys table
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Log file for output
const outputFile = path.join(__dirname, 'surveys-schema-output.txt');

// Clear log file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// Function to write to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  fs.appendFileSync(outputFile, logMessage, 'utf8');
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
    
    // Get column information for the surveys table
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'surveys'
      ORDER BY ordinal_position;
    `);
    
    log('\nSurveys table structure:');
    if (result.rows.length === 0) {
      log('No columns found in the surveys table.');
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
      
      log('\nTotal columns:', result.rows.length);
    }
    
  } catch (error) {
    log(`Error: ${error.message}`);
    if (error.stack) {
      log('Stack trace:');
      log(error.stack);
    }
  } finally {
    await client.end();
    log('\nDisconnected from the database');
    log('\nCheck the complete output in: ' + outputFile);
  }
}

// Run the check
log('===== Starting Surveys Table Schema Check =====');
checkTableSchema().catch(error => {
  log(`Unhandled error: ${error.message}`);
  if (error.stack) {
    log('Stack trace:');
    log(error.stack);
  }
  process.exit(1);
});
