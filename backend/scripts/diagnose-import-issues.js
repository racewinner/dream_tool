const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Configure output file
const logFile = path.resolve(__dirname, '../import-diagnosis.log');

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

async function diagnoseImportIssues() {
  log('🔍 Starting import diagnosis...');
  
  // Load environment variables
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  } catch (error) {
    log(`❌ Error loading .env file: ${error.message}`);
    return;
  }

  // Initialize Sequelize with detailed logging
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: (msg) => log(`🔍 ${msg}`), // Log all SQL queries
  });

  try {
    // Test database connection
    log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    log('✅ Database connection successful');

    // Check if tables exist
    log('\n📋 Checking table existence...');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    const tableNames = tables.map(t => t.table_name);
    log(`Found tables: ${tableNames.join(', ') || 'None'}`);
    
    // Check facilities table structure
    if (tableNames.includes('facilities')) {
      log('\n🏢 Facilities table structure:');
      const [columns] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_name = 'facilities' 
         ORDER BY ordinal_position`
      );
      
      log('Column Name           | Type                     | Nullable | Default');
      log('----------------------|--------------------------|----------|------------');
      
      columns.forEach(col => {
        log(`${col.column_name.padEnd(22)}| ${col.data_type.padEnd(25)}| ${col.is_nullable === 'YES' ? 'YES'.padEnd(8) : 'NO'.padEnd(8)} | ${col.column_default || 'NULL'}`);
      });
      
      // Check facility count
      const [facilityCount] = await sequelize.query('SELECT COUNT(*) as count FROM facilities');
      log(`\n📊 Total facilities: ${facilityCount[0].count}`);
      
      // Check sample facilities
      const [sampleFacilities] = await sequelize.query('SELECT * FROM facilities LIMIT 2');
      log('\n📝 Sample facilities:');
      log(JSON.stringify(sampleFacilities, null, 2));
    }
    
    // Check surveys table structure
    if (tableNames.includes('surveys')) {
      log('\n📊 Surveys table structure:');
      const [columns] = await sequelize.query(
        `SELECT column_name, data_type, is_nullable, column_default 
         FROM information_schema.columns 
         WHERE table_name = 'surveys' 
         ORDER BY ordinal_position`
      );
      
      log('Column Name           | Type                     | Nullable | Default');
      log('----------------------|--------------------------|----------|------------');
      
      columns.forEach(col => {
        log(`${col.column_name.padEnd(22)}| ${col.data_type.padEnd(25)}| ${col.is_nullable === 'YES' ? 'YES'.padEnd(8) : 'NO'.padEnd(8)} | ${col.column_default || 'NULL'}`);
      });
      
      // Check survey count
      const [surveyCount] = await sequelize.query('SELECT COUNT(*) as count FROM surveys');
      log(`\n📊 Total surveys: ${surveyCount[0].count}`);
      
      // Check sample surveys
      const [sampleSurveys] = await sequelize.query('SELECT id, facilityId, status, "createdAt" FROM surveys LIMIT 2');
      log('\n📝 Sample surveys:');
      log(JSON.stringify(sampleSurveys, null, 2));
    }
    
    // Check foreign key relationships
    log('\n🔗 Checking foreign key relationships...');
    try {
      const [constraints] = await sequelize.query(`
        SELECT
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND (tc.table_name = 'facilities' OR tc.table_name = 'surveys')
      `);
      
      if (constraints.length > 0) {
        log('\n🔑 Foreign key relationships:');
        constraints.forEach(constraint => {
          log(`${constraint.table_name}.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        });
      } else {
        log('\nℹ️ No foreign key relationships found for facilities or surveys tables');
      }
    } catch (error) {
      log(`\n⚠️ Could not check foreign key relationships: ${error.message}`);
    }
    
    // Check for any recent errors in the logs
    log('\n📝 Checking for recent errors in logs...');
    try {
      const [recentErrors] = await sequelize.query(`
        SELECT 
          message, 
          level, 
          timestamp 
        FROM logs 
        WHERE level IN ('error', 'warn')
        ORDER BY timestamp DESC 
        LIMIT 5
      `);
      
      if (recentErrors.length > 0) {
        log('\n⚠️ Recent errors from logs:');
        recentErrors.forEach(error => {
          log(`[${new Date(error.timestamp).toISOString()}] ${error.level.toUpperCase()}: ${error.message}`);
        });
      } else {
        log('\n✅ No recent errors found in logs table');
      }
    } catch (error) {
      log(`\n⚠️ Could not check logs table: ${error.message}`);
    }
    
  } catch (error) {
    log(`\n❌ Error during diagnosis: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
    
    // Check if it's a database connection error
    if (error.original) {
      log(`\n🔍 Original error: ${error.original.code || error.original.message}`);
      log(`SQL: ${error.sql || 'Not available'}`);
    }
  } finally {
    // Close the database connection
    if (sequelize) {
      await sequelize.close();
      log('\n🔌 Database connection closed');
    }
    
    log('\n🏁 Diagnosis completed!');
    log(`📝 Full log saved to: ${logFile}`);
  }
}

// Run the diagnosis
diagnoseImportIssues().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
  if (error.stack) {
    log(`Stack trace: ${error.stack}`);
  }
});
