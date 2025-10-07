// Debug script to test model initialization and sync
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('🚀 Starting model debug script...');

// Log environment
console.log('\n🔧 Environment:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log(`- DB_PORT: ${process.env.DB_PORT}`);
console.log(`- DB_NAME: ${process.env.DB_NAME}`);
console.log(`- DB_USER: ${process.env.DB_USER}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);

// Create a new Sequelize instance with detailed logging
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => console.log(`[SEQUELIZE] ${msg}`),
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Test database connection
async function testConnection() {
  try {
    console.log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Test model sync
async function testModelSync() {
  try {
    console.log('\n🔄 Testing model sync...');
    
    // Define a simple model
    const TestModel = sequelize.define('TestModel', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
    }, {
      tableName: 'test_models',
      timestamps: true,
    });
    
    console.log('✅ Test model defined');
    
    // Sync the model
    console.log('\n🔄 Syncing model...');
    await TestModel.sync({ force: true });
    console.log('✅ Model synced successfully');
    
    // Create a test record
    console.log('\n➕ Creating test record...');
    const record = await TestModel.create({
      name: 'Test Record',
      description: 'This is a test record',
    });
    console.log('✅ Test record created:', record.toJSON());
    
    // Query the test record
    console.log('\n🔍 Querying test records...');
    const records = await TestModel.findAll();
    console.log('✅ Found records:', JSON.stringify(records, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Model sync test failed:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Test connection
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.log('❌ Exiting due to connection failure');
      return;
    }
    
    // Test model sync
    await testModelSync();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error in main:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the main function
main();
