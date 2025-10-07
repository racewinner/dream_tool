// Simple test script to verify database connection and model loading
const fs = require('fs');
const path = require('path');

// Log file for debugging
const logFile = path.join(__dirname, 'test-simple-db.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

log('===== Starting Simple DB Test =====');

// Log environment variables
log('Environment:');
log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
log(`- DB_HOST: ${process.env.DB_HOST || 'not set'}`);
log(`- DB_NAME: ${process.env.DB_NAME || 'not set'}`);
log(`- DB_USER: ${process.env.DB_USER || 'not set'}`);
log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);

// Test database connection directly with Sequelize
log('\nTesting database connection with Sequelize...');
try {
  // Initialize Sequelize directly
  const { Sequelize } = require('sequelize');
  
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'dream_tool',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: (msg) => log(`SEQUELIZE: ${msg}`),
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
  
  // Test the connection
  (async () => {
    try {
      log('Attempting to authenticate with database...');
      await sequelize.authenticate();
      log('✅ Database connection successful!');
      
      // Test a simple query
      log('Running test query...');
      const [results] = await sequelize.query('SELECT 1+1 as result');
      log(`Query result: ${JSON.stringify(results)}`);
      
      // List all tables in the database
      log('\nListing database tables...');
      const [tables] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      log(`Found ${tables.length} tables:`);
      tables.forEach(table => log(`- ${table.table_name}`));
      
      log('\nTest completed successfully!');
      process.exit(0);
    } catch (error) {
      log(`❌ Error: ${error.message}`);
      if (error.parent) {
        log(`Parent error: ${error.parent.message}`);
      }
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  })();
  
} catch (error) {
  log(`❌ Failed to initialize Sequelize: ${error.message}`);
  process.exit(1);
}
