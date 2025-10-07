/**
 * TypeScript test script to verify model loading
 */

// Enable debug logging for all modules
process.env.DEBUG = '*';

// Set up console logging to ensure we see all output
console.log = (...args) => {
  process.stdout.write(`[${new Date().toISOString()}] `);
  process.stdout.write(args.join(' ') + '\n');};

console.error = (...args) => {
  process.stderr.write(`[${new Date().toISOString()}] ERROR: `);
  process.stderr.write(args.join(' ') + '\n');};

console.log('===== Starting Model Test Script =====');
console.log('1. Loading environment variables...');

// Load environment variables first
import 'dotenv/config';

console.log('2. Environment variables loaded');
console.log('   - NODE_ENV:', process.env.NODE_ENV);
console.log('   - DB_HOST:', process.env.DB_HOST);
console.log('   - DB_NAME:', process.env.DB_NAME);
console.log('   - DB_USER:', process.env.DB_USER);
console.log('   - DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'not set');

console.log('3. Importing sequelize instance...');
import { Sequelize } from 'sequelize';
let sequelize: Sequelize;
try {
  // Import the models with detailed logging
  console.log('4.1 Starting model import...');
  const models = require('../models');
  console.log('4.2 Models object keys:', Object.keys(models));
  
  if (!models.sequelize) {
    throw new Error('sequelize instance not found in models export');
  }
  
  sequelize = models.sequelize as Sequelize;
  console.log('4.3 Successfully imported sequelize instance');
  
  // Log model names
  console.log('4.4 Available models in sequelize:');
  Object.keys(sequelize.models).forEach(modelName => {
    console.log(`   - ${modelName}`);
  });
} catch (error) {
  console.error('❌ Failed to import sequelize instance:');
  console.error(error);
  process.exit(1);
}

async function testModels() {
  try {
    console.log('1. Starting model loading test');
    
    // Log database config (without sensitive data)
    const config = sequelize.config;
    console.log('5. Database config:', {
      database: config.database,
      host: config.host,
      port: config.port,
      dialect: (config as any).dialect, // Type assertion for dialect
      logging: (config as any).logging ? 'enabled' : 'disabled', // Type assertion for logging
      models: Object.keys(sequelize.models).length + ' models loaded'
    });
    
    // List all models
    console.log('3. Loaded models:');
    Object.keys(sequelize.models).forEach(modelName => {
      console.log(`   - ${modelName}`);
    });
    
    // Test a model query
    console.log('4. Testing Survey model...');
    const Survey = sequelize.models.Survey;
    if (Survey) {
      const count = await Survey.count();
      console.log(`5. Found ${count} surveys in the database`);
    } else {
      console.log('5. Survey model not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Model test failed:');
    console.error(error);
    return false;
  } finally {
    // Close the connection when done
    await sequelize.close();
  }
}

// Run the test
(async () => {
  try {
    const success = await testModels();
    console.log(`6. Model test completed ${success ? 'successfully' : 'with errors'}`);
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Unhandled error in test runner:');
    console.error(error);
    process.exit(1);
  }
})();
