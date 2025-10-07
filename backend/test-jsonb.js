// Simple test for JSONB field handling in Sequelize
const { Sequelize, DataTypes } = require('sequelize');

console.log('=== JSONB Field Test ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log, // Enable SQL logging
  retry: { max: 5, timeout: 60000 }
});

// Define a simple model with a JSONB field
const TestModel = sequelize.define('TestModel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jsonData: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isObject(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error('jsonData must be a JSON object');
        }
      }
    }
  }
}, {
  tableName: 'test_models',
  timestamps: false
});

// Test data
const testData = {
  name: 'Test Object',
  jsonData: {
    key1: 'value1',
    key2: 123,
    key3: true,
    nested: {
      a: 1,
      b: 'two',
      c: [1, 2, 3]
    }
  }
};

// Run the test
async function runTest() {
  try {
    console.log('1. Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('\n2. Creating test record...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    // Create a record
    const record = await TestModel.create(testData);
    console.log('\n3. Record created successfully!');
    console.log('Record ID:', record.id);
    
    // Retrieve the record
    console.log('\n4. Retrieving record...');
    const foundRecord = await TestModel.findByPk(record.id);
    
    console.log('\n5. Retrieved record:');
    console.log('- ID:', foundRecord.id);
    console.log('- Name:', foundRecord.name);
    console.log('- jsonData type:', typeof foundRecord.jsonData);
    console.log('- jsonData value:', JSON.stringify(foundRecord.jsonData, null, 2));
    
    console.log('\n=== Test completed successfully! ===');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    
    if (error.original) {
      console.error('Original error:', error.original.message);
      if (error.original.sql) {
        console.error('SQL:', error.original.sql);
      }
    }
    
    // If there's a validation error, log the validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      console.error('\nValidation errors:');
      error.errors.forEach((err, i) => {
        console.error(`  ${i + 1}. ${err.path}: ${err.message}`);
        console.error(`     Value: ${err.value}`);
        if (err.validatorKey) console.error(`     Validator: ${err.validatorKey}`);
      });
    }
    
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
runTest().catch(console.error);
