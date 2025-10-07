const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Configure output file
const logFile = path.resolve(__dirname, '../facilities-check.log');

// Simple logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
}

async function checkFacilitiesTable() {
  log('🔍 Checking facilities table structure...');
  
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
    // Get column information using a simple query
    const [columns] = await sequelize.query(
      "SELECT column_name, data_type, is_nullable, column_default " +
      "FROM information_schema.columns " +
      "WHERE table_name = 'facilities' " +
      "ORDER BY ordinal_position"
    );
    
    log('\n📋 Facilities table columns:');
    log('------------------------');
    
    columns.forEach(col => {
      log(`${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check for required columns
    const requiredColumns = ['id', 'name', 'type', 'latitude', 'longitude', 'status', 'userid'];
    const missingColumns = requiredColumns.filter(
      col => !columns.some(c => c.column_name.toLowerCase() === col.toLowerCase())
    );
    
    if (missingColumns.length > 0) {
      log(`\n⚠️  Missing required columns: ${missingColumns.join(', ')}`);
    } else {
      log('\n✅ All required columns exist');
    }
    
    // Show sample data
    const [sampleData] = await sequelize.query("SELECT * FROM facilities LIMIT 1");
    if (sampleData.length > 0) {
      log('\n📝 Sample facility data:');
      log(JSON.stringify(sampleData[0], null, 2));
    }
    
  } catch (error) {
    log(`❌ Error checking facilities table: ${error.message}`);
  } finally {
    await sequelize.close();
    log('\n🔌 Database connection closed');
    log(`📝 Full log saved to: ${logFile}`);
  }
}

// Run the check
checkFacilitiesTable().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
});
