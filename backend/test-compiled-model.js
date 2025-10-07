// Test script for the compiled Survey model
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

console.log('=== Compiled Survey Model Test ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log, // Enable SQL logging
  retry: { max: 5, timeout: 60000 }
});

// Load the compiled Survey model
try {
  console.log('1. Loading compiled Survey model...');
  const { initSurveyModel } = require('./dist/models/survey');
  
  console.log('2. Initializing Survey model...');
  const Survey = initSurveyModel(sequelize);
  
  console.log('3. Survey model initialized successfully!');
  console.log('   - Model name:', Survey.name);
  console.log('   - Table name:', Survey.tableName);
  
  // Check if facilityData field exists and its type
  console.log('\n4. Checking facilityData field...');
  if (Survey.rawAttributes && Survey.rawAttributes.facilityData) {
    const field = Survey.rawAttributes.facilityData;
    console.log('   - facilityData field found');
    console.log('   - Type:', field.type ? field.type.key : 'unknown');
    console.log('   - Allow null:', field.allowNull !== false);
    
    if (field.validate) {
      console.log('   - Validations:', Object.keys(field.validate).join(', '));
    } else {
      console.log('   - No validations found');
    }
  } else {
    console.log('   - facilityData field NOT found in model');
  }
  
  // Define a minimal Facility model for testing associations
  console.log('\n5. Setting up test environment...');
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
  Survey.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });
  Facility.hasMany(Survey, { foreignKey: 'facilityId' });
  
  // Test data
  const testData = {
    externalId: 'compiled-test-1',
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
      console.log('\n6. Syncing database...');
      await sequelize.sync({ force: true });
      
      console.log('\n7. Creating test facility...');
      const facility = await Facility.create({ id: 1, name: 'Test Facility' });
      
      console.log('\n8. Creating survey with test data...');
      console.log('   - Test data:', JSON.stringify({
        ...testData,
        facilityData: JSON.parse(testData.facilityData)
      }, null, 2));
      
      const survey = await Survey.create(testData);
      console.log('\n9. Survey created successfully!');
      console.log('   - Survey ID:', survey.id);
      
      // Try to retrieve the survey
      console.log('\n10. Retrieving survey from database...');
      const foundSurvey = await Survey.findByPk(survey.id, {
        include: [{ model: Facility, as: 'facility' }]
      });
      
      console.log('\n11. Retrieved survey:');
      console.log('   - ID:', foundSurvey.id);
      console.log('   - External ID:', foundSurvey.externalId);
      console.log('   - Facility ID:', foundSurvey.facilityId);
      console.log('   - Facility name:', foundSurvey.facility ? foundSurvey.facility.name : 'Not loaded');
      
      // Check facilityData type and content
      console.log('   - facilityData type:', typeof foundSurvey.facilityData);
      
      if (typeof foundSurvey.facilityData === 'object') {
        console.log('   - facilityData content:', JSON.stringify(foundSurvey.facilityData, null, 2));
      } else if (typeof foundSurvey.facilityData === 'string') {
        try {
          const parsed = JSON.parse(foundSurvey.facilityData);
          console.log('   - facilityData (parsed):', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('   - facilityData (raw):', foundSurvey.facilityData);
        }
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
      
      // If there's a validation error, log the validation errors
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
        console.error('\nValidation errors:');
        error.errors.forEach((err, i) => {
          console.error(`  ${i + 1}. ${err.path}: ${err.message}`);
          console.error(`     Value: ${err.value}`);
          if (err.validatorKey) console.error(`     Validator: ${err.validatorKey}`);
        });
      }
      
      console.error('\nStack:', error.stack);
      process.exit(1);
    }
  }
  
  // Run the test
  runTest().catch(console.error);
  
} catch (error) {
  console.error('\n=== FATAL ERROR ===');
  console.error('Failed to load or initialize the compiled Survey model:');
  console.error(error.message);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\nModule not found. Check the path to the compiled model.');
    
    // Try to list the dist directory
    try {
      const fs = require('fs');
      const distPath = path.resolve('./dist');
      console.log('\nContents of dist directory:');
      console.log(fs.readdirSync(distPath));
      
      const modelsPath = path.join(distPath, 'models');
      if (fs.existsSync(modelsPath)) {
        console.log('\nContents of dist/models directory:');
        console.log(fs.readdirSync(modelsPath));
      }
    } catch (fsError) {
      console.error('Error reading dist directory:', fsError.message);
    }
  }
  
  console.error('\nStack:', error.stack);
  process.exit(1);
}
