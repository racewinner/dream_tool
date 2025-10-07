// Test script to verify model loading
console.log('1. Starting model loading test');

// Load environment variables first
require('dotenv').config();

// Import Sequelize and models
const { sequelize } = require('../models');

// Test model loading
async function testModels() {
  try {
    console.log('2. Testing model loading...');
    
    // Log database config (without sensitive data)
    const config = sequelize.config;
    console.log('3. Database config:', {
      database: config.database,
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging ? 'enabled' : 'disabled',
      models: Object.keys(sequelize.models).length + ' models loaded'
    });
    
    // List all models
    console.log('4. Loaded models:');
    Object.keys(sequelize.models).forEach(modelName => {
      console.log(`   - ${modelName}`);
    });
    
    // Test a model query
    console.log('5. Testing Survey model...');
    const Survey = sequelize.models.Survey;
    if (Survey) {
      const count = await Survey.count();
      console.log(`6. Found ${count} surveys in the database`);
    } else {
      console.log('6. Survey model not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Model test failed:', error);
    return false;
  }
}

// Run the test
testModels()
  .then(success => {
    console.log(`7. Model test completed ${success ? 'successfully' : 'with errors'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
