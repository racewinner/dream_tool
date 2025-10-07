// Minimal test script for Survey model
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Minimal Survey Model Test ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log,
  retry: { max: 5, timeout: 60000 }
});

// Load the compiled Survey model
console.log('1. Loading Survey model...');
const { initSurveyModel } = require('./dist/models/survey');

// Initialize the Survey model
console.log('2. Initializing Survey model...');
const Survey = initSurveyModel(sequelize);

// Define a minimal Facility model
console.log('3. Defining Facility model...');
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

// Set up associations
console.log('4. Setting up associations...');
Survey.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });
Facility.hasMany(Survey, { foreignKey: 'facilityId' });

// Test data
const testData = {
  externalId: 'minimal-test-1',
  facilityId: 1,
  facilityData: JSON.stringify({
    name: 'Test Facility',
    productiveSectors: ['health facility'],
    subsectorActivities: ['Health Center'],
    ownership: 'public',
    catchmentPopulation: 5000,
    coreServices: ['Outpatient', 'Inpatient']
  }),
  collectionDate: new Date(),
  respondentId: 'test-respondent-1'
};

// Run the test
async function runTest() {
  try {
    console.log('5. Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('6. Creating test facility...');
    await Facility.create({ id: 1, name: 'Test Facility' });
    
    console.log('7. Creating survey...');
    const survey = await Survey.create(testData);
    console.log('   - Survey created with ID:', survey.id);
    
    console.log('8. Retrieving survey...');
    const foundSurvey = await Survey.findByPk(survey.id);
    console.log('   - Retrieved survey with ID:', foundSurvey.id);
    
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
        console.error(`     Value: ${err.value}`);
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
