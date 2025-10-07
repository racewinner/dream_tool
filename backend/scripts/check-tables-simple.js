const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Configure output file
const logFile = path.resolve(__dirname, '../tables-check.log');

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

async function checkTables() {
  log('🚀 Starting database tables check...');
  
  // Load environment variables
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  } catch (error) {
    log(`❌ Error loading .env file: ${error.message}`);
    return;
  }

  // Initialize Sequelize
  let sequelize;
  try {
    sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: false,
    });
  } catch (error) {
    log(`❌ Error initializing Sequelize: ${error.message}`);
    return;
  }

  try {
    // Get list of all tables with a simple query
    const [tables] = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );

    log(`\n📋 Found ${tables.length} tables in the database:`);
    tables.forEach((table, index) => {
      log(`${index + 1}. ${table.table_name}`);
    });

    // Check for required tables
    const requiredTables = ['facilities', 'surveys', 'users'];
    const missingTables = requiredTables.filter(
      reqTable => !tables.some(t => t.table_name === reqTable)
    );
    
    if (missingTables.length > 0) {
      log(`\n⚠️  Missing required tables: ${missingTables.join(', ')}`);
      log('Please run database migrations to create the required tables.');
    } else {
      log('\n✅ All required tables exist');
      
      // For required tables, get row counts
      for (const table of requiredTables) {
        try {
          const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`);
          const rowCount = countResult[0]?.count || 0;
          log(`- ${table}: ${rowCount} rows`);
        } catch (error) {
          log(`- ${table}: Error getting row count - ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    log(`❌ Error checking tables: ${error.message}`);
  } finally {
    if (sequelize) {
      await sequelize.close();
      log('\n🔌 Database connection closed.');
    }
    log('\n🏁 Tables check completed!');
    log(`📝 Full log saved to: ${logFile}`);
  }
}

// Run the check
checkTables().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
  if (error.stack) {
    log(`Stack trace: ${error.stack}`);
  }
});
