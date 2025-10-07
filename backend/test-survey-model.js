// Simple test for Survey model
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Survey Model Test ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log, // Enable SQL logging
  retry: { max: 5, timeout: 60000 }
});

// Define a minimal Facility model
const Facility = sequelize.define('Facility', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Facilities',
  timestamps: true
});

// Define a minimal Survey model
const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  facilityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  facilityData: {
    type: DataTypes.JSONB,
    allowNull: false,
    // Add validation to ensure it's a valid JSON object
    validate: {
      isObject(value) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error('facilityData must be a JSON object');
        }
      }
    }
  },
  collectionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  respondentId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Surveys',
  timestamps: true
});

// Set up associations
Survey.belongsTo(Facility, { foreignKey: 'facilityId' });
Facility.hasMany(Survey, { foreignKey: 'facilityId' });

// Test data
const testData = {
  externalId: 'test-1',
  facilityId: 1,
  facilityData: {
    name: 'Test Facility',
    type: 'Health Center',
    status: 'active'
  },
  collectionDate: new Date(),
  respondentId: 'test-respondent-1'
};

// Run the test
async function runTest() {
  try {
    console.log('1. Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('\n2. Creating test facility...');
    await Facility.create({ id: 1, name: 'Test Facility' });
    
    console.log('\n3. Creating survey with test data...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const survey = await Survey.create(testData);
    console.log('\n4. Survey created successfully!');
    console.log('Survey ID:', survey.id);
    console.log('facilityData type:', typeof survey.facilityData);
    
    console.log('\n5. Retrieving survey from database...');
    const foundSurvey = await Survey.findByPk(survey.id);
    console.log('Retrieved survey:', {
      id: foundSurvey.id,
      externalId: foundSurvey.externalId,
      facilityData: foundSurvey.facilityData
    });
    
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
    
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
runTest().catch(console.error);
