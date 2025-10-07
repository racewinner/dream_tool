// Enhanced debug script for the Survey model
const path = require('path');
const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');

console.log('=== Enhanced Survey Model Debug ===\n');

// Define the path to the compiled model
const modelPath = path.resolve('./dist/models/survey.js');
console.log(`1. Checking for compiled model at: ${modelPath}`);

// Check if the file exists
if (!fs.existsSync(modelPath)) {
  console.error('Error: Compiled model not found at the specified path.');
  process.exit(1);
}

console.log('2. Model file exists. Loading...');

async function runDebug() {
  try {
    // Load the model
    const modelExports = require(modelPath);
    console.log('3. Model loaded successfully. Exports:');
    console.log(Object.keys(modelExports));
    
    // Check if initSurveyModel exists
    if (typeof modelExports.initSurveyModel !== 'function') {
      throw new Error('initSurveyModel is not a function in the loaded module');
    }
    
    console.log('4. initSurveyModel is a function. Creating Sequelize instance...');
    
    // Create a minimal Sequelize instance with logging
    const sequelize = new Sequelize('sqlite::memory:', {
      logging: console.log, // Enable SQL logging
      retry: { max: 5, timeout: 60000 }
    });
    
    console.log('5. Initializing Survey model...');
    const Survey = modelExports.initSurveyModel(sequelize);
    
    console.log('6. Survey model initialized successfully!');
    console.log('   - Model name:', Survey.name);
    console.log('   - Table name:', Survey.tableName);
    
    // Log model attributes
    console.log('\n7. Model attributes:');
    if (Survey.rawAttributes) {
      console.log('   - Raw attributes found:', Object.keys(Survey.rawAttributes));
      
      // Check if facilityData exists and its type
      if (Survey.rawAttributes.facilityData) {
        console.log('\n8. facilityData field details:');
        console.log('   - Type:', Survey.rawAttributes.facilityData.type.key);
        console.log('   - Allow null:', Survey.rawAttributes.facilityData.allowNull !== false);
        
        if (Survey.rawAttributes.facilityData.validate) {
          console.log('   - Validations:', Object.keys(Survey.rawAttributes.facilityData.validate));
        }
      }
    } else {
      console.log('   - No rawAttributes found on the model');
    }
    
    // Create a minimal Facility model for testing
    console.log('\n9. Creating minimal Facility model...');
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
    console.log('\n10. Setting up associations...');
    Survey.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });
    Facility.hasMany(Survey, { foreignKey: 'facilityId' });
    
    // Sync the database
    console.log('\n11. Syncing database...');
    await sequelize.sync({ force: true });
    console.log('   - Database synced successfully');
    
    // Create a test facility
    console.log('\n12. Creating test facility...');
    const facility = await Facility.create({ id: 1, name: 'Test Facility' });
    console.log('   - Facility created with ID:', facility.id);
    
    // Create test data
    const testData = {
      externalId: 'debug-test-1',
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
    
    // Try to create a survey
    console.log('\n13. Creating survey with test data...');
    const survey = await Survey.create(testData);
    console.log('   - Survey created successfully with ID:', survey.id);
    
    // Try to retrieve the survey
    console.log('\n14. Retrieving survey from database...');
    const foundSurvey = await Survey.findByPk(survey.id, {
      include: [{ model: Facility, as: 'facility' }]
    });
    
    console.log('\n15. Retrieved survey:');
    console.log('   - ID:', foundSurvey.id);
    console.log('   - External ID:', foundSurvey.externalId);
    console.log('   - Facility ID:', foundSurvey.facilityId);
    console.log('   - Facility name:', foundSurvey.facility ? foundSurvey.facility.name : 'Not loaded');
    
    // Check facilityData type and content
    console.log('   - facilityData type:', typeof foundSurvey.facilityData);
    
    if (foundSurvey.facilityData) {
      console.log('   - facilityData content:', JSON.stringify(foundSurvey.facilityData, null, 2));
    }
    
    console.log('\n=== Debug completed successfully! ===');
    
  } catch (error) {
    console.error('\n=== ERROR ===');
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
  } finally {
    // Close the connection
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run the debug function
runDebug().catch(console.error);
