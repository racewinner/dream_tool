// Script to check valid enum values in the database
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Log file for output
const outputFile = path.join(__dirname, 'enum-values-output.txt');

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

async function checkEnumValues() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    log('Connected to the database');
    
    // Get all enum types in the database
    const enumTypes = await client.query(`
      SELECT t.typname AS enum_type, 
             e.enumlabel AS enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY enum_type, e.enumsortorder;
    `);
    
    if (enumTypes.rows.length === 0) {
      log('No enum types found in the database.');
      return;
    }
    
    // Group enum values by type
    const enumsByType = {};
    enumTypes.rows.forEach(row => {
      if (!enumsByType[row.enum_type]) {
        enumsByType[row.enum_type] = [];
      }
      enumsByType[row.enum_type].push(row.enum_value);
    });
    
    // Log the results
    log('\nFound the following enum types and values:');
    log('------------------------------------------------');
    
    for (const [enumType, values] of Object.entries(enumsByType)) {
      log(`\nEnum Type: ${enumType}`);
      log('Values:');
      values.forEach((value, index) => {
        log(`  ${index + 1}. '${value}'`);
      });
    }
    
    // Check which enums are used in which tables/columns
    log('\n\nEnum Usage in Tables:');
    log('------------------------------------------------');
    
    const enumUsage = await client.query(`
      SELECT c.table_name, 
             c.column_name, 
             c.udt_name AS enum_type
      FROM information_schema.columns c
      JOIN pg_type t ON c.udt_name = t.typname
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE c.data_type = 'USER-DEFINED' 
        AND c.udt_name IN (
          SELECT typname FROM pg_type 
          JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid
          GROUP BY typname
        )
      GROUP BY c.table_name, c.column_name, c.udt_name
      ORDER BY c.table_name, c.column_name;
    `);
    
    if (enumUsage.rows.length > 0) {
      enumUsage.rows.forEach(row => {
        log(`Table: ${row.table_name}, Column: ${row.column_name}, Enum Type: ${row.enum_type}`);
      });
    } else {
      log('No enum usage information found in tables.');
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
log('===== Starting Enum Value Check =====');
checkEnumValues().catch(error => {
  log(`Unhandled error: ${error.message}`);
  if (error.stack) {
    log('Stack trace:');
    log(error.stack);
  }
  process.exit(1);
});
