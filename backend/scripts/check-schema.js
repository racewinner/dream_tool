const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Configure output file
const logFile = path.resolve(__dirname, '../schema-check.log');

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

async function checkSchema() {
  log('🚀 Starting database schema check...');
  
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
    // Get list of all tables
    const [tables] = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );

    log(`\n📋 Found ${tables.length} tables in the database:`);
    
    // For each table, get column information
    for (const table of tables) {
      const tableName = table.table_name;
      log(`\n📄 Table: ${tableName}`);
      
      try {
        // Get column information
        const [columns] = await sequelize.query({
          text: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `,
          values: [tableName]
        });
        
        if (columns.length === 0) {
          log('  No columns found (empty table)');
          continue;
        }
        
        // Log column information
        log('  Columns:');
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const hasDefault = col.column_default ? `DEFAULT ${col.column_default}` : '';
          log(`  - ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable} ${hasDefault}`.trim());
        });
        
        // Get row count
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const rowCount = countResult[0]?.count || 0;
        log(`  Rows: ${rowCount}`);
        
      } catch (error) {
        log(`  ❌ Error getting table info: ${error.message}`);
      }
    }
    
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
    }
    
  } catch (error) {
    log(`❌ Error checking schema: ${error.message}`);
  } finally {
    if (sequelize) {
      await sequelize.close();
      log('\n🔌 Database connection closed.');
    }
    log('\n🏁 Schema check completed!');
    log(`📝 Full log saved to: ${logFile}`);
  }
}

// Run the check
checkSchema().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
  if (error.stack) {
    log(`Stack trace: ${error.stack}`);
  }
});
