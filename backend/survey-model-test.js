// Test script for Survey model with detailed logging
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Survey Model Test ===\n');

// Load the compiled Survey model
console.log('1. Loading Survey model...');
const { initSurveyModel } = require('./dist/models/survey');

// Create an in-memory SQLite database with verbose logging
const sequelize = new Sequelize('sqlite::memory:', {
  logging: msg => console.log(`[SEQUELIZE] ${msg}`),
  retry: { max: 5, timeout: 60000 }
});

// Define a minimal Facility model for testing
console.log('2. Defining minimal Facility model...');
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
  tableName: 'facilities', // Explicitly set to lowercase to match the actual table name
  timestamps: true
});

// Initialize the Survey model
console.log('3. Initializing Survey model...');
const Survey = initSurveyModel(sequelize);

// Set up associations
console.log('4. Setting up associations...');
Survey.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });
Facility.hasMany(Survey, { foreignKey: 'facilityId' });

// Test data
const testFacilityData = {
  name: 'Test Facility',
  productiveSectors: ['health facility'],
  subsectorActivities: ['Health Center'],
  ownership: 'public',
  catchmentPopulation: 5000,
  coreServices: ['Outpatient', 'Inpatient'],
  // Add required fields to match the FacilityData interface
  operationalHours: { day: 8, night: 0 },
  buildings: { total: 1, departmentsWithWiring: 1, rooms: 1, roomsWithConnection: 1 },
  equipment: [],
  infrastructure: {
    waterAccess: true,
    nationalGrid: false,
    transportationAccess: 'paved_road',
    communication: 'mobile',
    digitalConnectivity: 'mobile_data'
  },
  nightStaff: false,
  criticalNeeds: []
};

// Run the test
async function runTest() {
  try {
    console.log('5. Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('6. Creating test facility...');
    const facility = await Facility.create({ id: 1, name: 'Test Facility' });
    console.log('   - Facility created with ID:', facility.id);
    
    console.log('7. Testing JSONB field with a simple object...');
    const simpleTestData = {
      externalId: 'test-simple-1',
      facilityId: facility.id,
      facilityData: { test: 'simple test' },
      collectionDate: new Date(),
      respondentId: 'test-respondent-1'
    };
    
    console.log('8. Creating survey with simple test data...');
    const simpleSurvey = await Survey.create(simpleTestData);
    console.log('   - Simple survey created with ID:', simpleSurvey.id);
    
    console.log('9. Retrieving simple survey...');
    const foundSimpleSurvey = await Survey.findByPk(simpleSurvey.id);
    console.log('   - Retrieved simple survey with ID:', foundSimpleSurvey.id);
    console.log('   - facilityData type:', typeof foundSimpleSurvey.facilityData);
    console.log('   - facilityData content:', JSON.stringify(foundSimpleSurvey.facilityData, null, 2));
    
    console.log('10. Testing with full facility data...');
    const fullTestData = {
      externalId: 'test-full-1',
      facilityId: facility.id,
      facilityData: testFacilityData,
      collectionDate: new Date(),
      respondentId: 'test-respondent-1'
    };
    
    console.log('11. Creating survey with full test data...');
    const fullSurvey = await Survey.create(fullTestData);
    console.log('   - Full survey created with ID:', fullSurvey.id);
    
    console.log('12. Retrieving full survey...');
    const foundFullSurvey = await Survey.findByPk(fullSurvey.id, {
      include: [{ model: Facility, as: 'facility' }]
    });
    
    console.log('   - Retrieved full survey with ID:', foundFullSurvey.id);
    console.log('   - facilityData type:', typeof foundFullSurvey.facilityData);
    
    if (typeof foundFullSurvey.facilityData === 'string') {
      try {
        console.log('   - facilityData (parsed):', JSON.parse(foundFullSurvey.facilityData));
      } catch (e) {
        console.error('   - Error parsing facilityData:', e.message);
      }
    } else {
      console.log('   - facilityData content:', JSON.stringify(foundFullSurvey.facilityData, null, 2));
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    
    if (error.original) {
      console.error('Original error:', error.original.message);
      if (error.original.sql) {
        console.error('SQL:', error.original.sql);
      }
    }
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      console.error('\nValidation errors:');
      error.errors.forEach((err, i) => {
        console.error(`  ${i + 1}. ${err.path}: ${err.message}`);
        console.error(`     Value: ${JSON.stringify(err.value)}`);
        if (err.validatorKey) console.error(`     Validator: ${err.validatorKey}`);
      });
    }
    
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
runTest().catch(console.error);
