const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Configure output file
const logFile = path.resolve(__dirname, '../db-test-output.log');

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

async function testDatabase() {
  log('🚀 Starting database test...');
  
  // Load environment variables
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
    log('✅ Environment variables loaded');
  } catch (error) {
    log(`❌ Error loading .env file: ${error.message}`);
    return;
  }

  // Check required variables
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    log(`❌ Missing required database environment variables: ${missingVars.join(', ')}`);
    return;
  }

  log('🔧 Database configuration:');
  log(`- Host: ${process.env.DB_HOST}`);
  log(`- Port: ${process.env.DB_PORT}`);
  log(`- Database: ${process.env.DB_NAME}`);
  log(`- User: ${process.env.DB_USER}`);
  log(`- Password: ${process.env.DB_PASSWORD ? '****' + process.env.DB_PASSWORD.slice(-4) : 'not set'}`);

  // Initialize Sequelize
  let sequelize;
  try {
    log('\n🔌 Initializing Sequelize...');
    sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: (msg) => log(`  ${msg}`),
      pool: {
        max: 5,
        min: 0,
        acquire: 10000,
        idle: 5000
      }
    });
    log('✅ Sequelize initialized');
  } catch (error) {
    log(`❌ Error initializing Sequelize: ${error.message}`);
    return;
  }

  // Test connection
  try {
    log('\n🔍 Testing database connection...');
    await sequelize.authenticate();
    log('✅ Database connection successful!');
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`);
    if (error.original) {
      log(`- Original error: ${error.original}`);
    }
    return;
  }

  // Test a simple query
  try {
    log('\n🔍 Running test query...');
    const [results] = await sequelize.query('SELECT current_database(), current_user, version() as db_version');
    
    if (results && results.length > 0) {
      log('✅ Test query successful!');
      log('\n📊 Database information:');
      log(`- Current database: ${results[0].current_database || 'N/A'}`);
      log(`- Current user: ${results[0].current_user || 'N/A'}`);
      log(`- Database version: ${results[0].db_version ? results[0].db_version.split('\n')[0] : 'N/A'}`);
    } else {
      log('❌ Test query returned no results');
    }
  } catch (error) {
    log(`❌ Test query failed: ${error.message}`);
  }

  // List tables
  try {
    log('\n📋 Listing database tables...');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    if (tables.length > 0) {
      log(`✅ Found ${tables.length} tables:`);
      tables.forEach((table, index) => {
        log(`${index + 1}. ${table.table_name}`);
      });
    } else {
      log('ℹ️ No tables found in the database.');
    }
  } catch (error) {
    log(`❌ Error listing tables: ${error.message}`);
  }

  // Close connection
  try {
    if (sequelize) {
      await sequelize.close();
      log('\n🔌 Database connection closed.');
    }
  } catch (error) {
    log(`❌ Error closing connection: ${error.message}`);
  }

  log('\n🏁 Database test completed!');
  log(`📝 Full log saved to: ${logFile}`);
}

// Run the test
testDatabase().catch(error => {
  log(`❌ Unhandled error in test: ${error.message}`);
  if (error.stack) {
    log(`Stack trace: ${error.stack}`);
  }
});
