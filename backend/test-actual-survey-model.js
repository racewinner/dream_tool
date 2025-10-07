// Test for the actual Survey model from the codebase
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Actual Survey Model Test ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log, // Enable SQL logging
  retry: { max: 5, timeout: 60000 }
});

// Load the actual Survey model
try {
  console.log('1. Loading Survey model...');
  const { initSurveyModel } = require('./dist/models/survey');
  
  // Initialize the Survey model
  const Survey = initSurveyModel(sequelize);
  
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
  
  // Set up associations
  Survey.belongsTo(Facility, { foreignKey: 'facilityId' });
  Facility.hasMany(Survey, { foreignKey: 'facilityId' });
  
  // Test data with minimal required fields
  const testData = {
    externalId: 'actual-test-1',
    facilityId: 1,
    facilityData: JSON.stringify({
      name: 'Actual Test Facility',
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
      console.log('\n2. Syncing database...');
      await sequelize.sync({ force: true });
      
      console.log('\n3. Creating test facility...');
      await Facility.create({ id: 1, name: 'Test Facility' });
      
      console.log('\n4. Creating survey with test data...');
      console.log('Test data:', JSON.stringify(testData, null, 2));
      
      // Try to create the survey
      const survey = await Survey.create(testData);
      console.log('\n5. Survey created successfully!');
      console.log('Survey ID:', survey.id);
      
      // Try to retrieve the survey
      console.log('\n6. Retrieving survey from database...');
      const foundSurvey = await Survey.findByPk(survey.id);
      
      if (foundSurvey) {
        console.log('Retrieved survey:', {
          id: foundSurvey.id,
          externalId: foundSurvey.externalId,
          facilityId: foundSurvey.facilityId,
          facilityData: typeof foundSurvey.facilityData === 'object' 
            ? foundSurvey.facilityData 
            : 'Not an object'
        });
      } else {
        console.log('Survey not found');
      }
      
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
      
      // If there's a validation error, log the validation errors
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        console.error('\nValidation errors:');
        error.errors.forEach((err, i) => {
          console.error(`  ${i + 1}. ${err.path}: ${err.message}`);
          console.error(`     Value: ${err.value}`);
          if (err.validatorKey) console.error(`     Validator: ${err.validatorKey}`);
        });
      }
      
      process.exit(1);
    }
  }
  
  // Run the test
  await runTest();
  
} catch (error) {
  console.error('\n=== FATAL ERROR ===');
  console.error('Failed to load or initialize Survey model:', error.message);
  console.error('Stack:', error.stack);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\nModule not found. Check the path to the Survey model.');
    console.error('Current working directory:', process.cwd());
    
    // Try to list the dist directory
    try {
      const fs = require('fs');
      const distPath = path.resolve('./dist');
      console.log('\nContents of dist directory:');
      console.log(fs.readdirSync(distPath));
      
      const modelsPath = path.resolve('./dist/models');
      if (fs.existsSync(modelsPath)) {
        console.log('\nContents of dist/models directory:');
        console.log(fs.readdirSync(modelsPath));
      } else {
        console.log('\ndist/models directory does not exist');
      }
    } catch (fsError) {
      console.error('Error reading dist directory:', fsError.message);
    }
  }
  
  process.exit(1);
} finally {
  // Close the connection
  await sequelize.close();
}
