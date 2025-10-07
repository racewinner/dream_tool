const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Configure output file
const logFile = path.resolve(__dirname, '../facilities-schema.log');

// Clear previous log file
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

// Simple logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
}

async function inspectFacilitiesTable() {
  log('🚀 Starting facilities table inspection...');
  
  // Load environment variables
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  } catch (error) {
    log(`❌ Error loading .env file: ${error.message}`);
    return;
  }

  // Initialize Sequelize
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
  });

  try {
    // Get column information for facilities table
    const [columns] = await sequelize.query({
      text: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'facilities'
        ORDER BY ordinal_position
      `
    });
    
    if (columns.length === 0) {
      log('❌ No columns found in facilities table');
      return;
    }
    
    log(`\n📋 Facilities table has ${columns.length} columns:\n`);
    
    // Log column information in a table format
    log('Column Name           | Type                     | Nullable | Default');
    log('----------------------|--------------------------|----------|------------');
    
    columns.forEach(col => {
      let type = col.data_type.toUpperCase();
      
      // Add length/precision for certain types
      if (col.character_maximum_length) {
        type += `(${col.character_maximum_length})`;
      } else if (col.numeric_precision) {
        type += `(${col.numeric_precision}`;
        if (col.numeric_scale) type += `,${col.numeric_scale}`;
        type += ')';
      }
      
      const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
      const defaultValue = col.column_default ? col.column_default : 'NULL';
      
      log(`${col.column_name.padEnd(22)}| ${type.padEnd(25)}| ${nullable.padEnd(8)} | ${defaultValue}`);
    });
    
    // Get constraints
    const [constraints] = await sequelize.query({
      text: `
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = 'facilities'
      `
    });
    
    if (constraints.length > 0) {
      log('\n🔐 Table Constraints:\n');
      log('Type      | Column(s)             | References');
      log('----------|-----------------------|-------------------');
      
      constraints.forEach(constraint => {
        const type = constraint.constraint_type.padEnd(8);
        const columns = constraint.column_name;
        const refs = constraint.foreign_table_name 
          ? `${constraint.foreign_table_name}(${constraint.foreign_column_name})`
          : '';
          
        log(`${type} | ${columns.padEnd(22)}| ${refs}`);
      });
    }
    
    // Get indexes
    const [indexes] = await sequelize.query({
      text: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = 'facilities'
      `
    });
    
    if (indexes.length > 0) {
      log('\n🔍 Table Indexes:\n');
      indexes.forEach(index => {
        log(`${index.indexname}:`);
        log(`  ${index.indexdef}\n`);
      });
    }
    
  } catch (error) {
    log(`❌ Error inspecting facilities table: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
  } finally {
    await sequelize.close();
    log('\n🔌 Database connection closed');
    log('\n🏁 Inspection completed!');
    log(`📝 Full log saved to: ${logFile}`);
  }
}

// Run the inspection
inspectFacilitiesTable().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
  if (error.stack) {
    log(`Stack trace: ${error.stack}`);
  }
});
