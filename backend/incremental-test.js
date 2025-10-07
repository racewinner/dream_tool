// Incremental test script to isolate the error
const path = require('path');
const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');

console.log('=== Incremental Survey Model Test ===\n');

// Define the path to the compiled model
const modelPath = path.resolve('./dist/models/survey.js');
console.log(`1. Checking for compiled model at: ${modelPath}`);

// Check if the file exists
if (!fs.existsSync(modelPath)) {
  console.error('Error: Compiled model not found at the specified path.');
  process.exit(1);
}

console.log('2. Model file exists. Loading...');

async function runIncrementalTest() {
  let sequelize;
  
  try {
    // Step 1: Load the model
    console.log('\n=== STEP 1: Loading the model ===');
    const modelExports = require(modelPath);
    console.log('✓ Model loaded successfully');
    
    // Check if initSurveyModel exists
    if (typeof modelExports.initSurveyModel !== 'function') {
      throw new Error('initSurveyModel is not a function in the loaded module');
    }
    console.log('✓ initSurveyModel is a function');
    
    // Step 2: Create Sequelize instance
    console.log('\n=== STEP 2: Creating Sequelize instance ===');
    sequelize = new Sequelize('sqlite::memory:', {
      logging: console.log,
      retry: { max: 5, timeout: 60000 }
    });
    console.log('✓ Sequelize instance created');
    
    // Step 3: Initialize Survey model
    console.log('\n=== STEP 3: Initializing Survey model ===');
    const Survey = modelExports.initSurveyModel(sequelize);
    console.log('✓ Survey model initialized');
    console.log(`   - Model name: ${Survey.name}`);
    console.log(`   - Table name: ${Survey.tableName}`);
    
    // Step 4: Define minimal Facility model
    console.log('\n=== STEP 4: Defining Facility model ===');
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
    console.log('✓ Facility model defined');
    
    // Step 5: Set up associations
    console.log('\n=== STEP 5: Setting up associations ===');
    Survey.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });
    Facility.hasMany(Survey, { foreignKey: 'facilityId' });
    console.log('✓ Associations set up');
    
    // Step 6: Sync the database
    console.log('\n=== STEP 6: Syncing database ===');
    await sequelize.sync({ force: true });
    console.log('✓ Database synced successfully');
    
    // Step 7: Create a test facility
    console.log('\n=== STEP 7: Creating test facility ===');
    const facility = await Facility.create({ id: 1, name: 'Test Facility' });
    console.log('✓ Test facility created with ID:', facility.id);
    
    // Step 8: Prepare test data
    console.log('\n=== STEP 8: Preparing test data ===');
    const testData = {
      externalId: 'incremental-test-1',
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
    console.log('✓ Test data prepared');
    
    // Step 9: Create a survey
    console.log('\n=== STEP 9: Creating survey ===');
    const survey = await Survey.create(testData);
    console.log('✓ Survey created with ID:', survey.id);
    
    // Step 10: Retrieve the survey
    console.log('\n=== STEP 10: Retrieving survey ===');
    const foundSurvey = await Survey.findByPk(survey.id, {
      include: [{ model: Facility, as: 'facility' }]
    });
    console.log('✓ Survey retrieved successfully');
    
    // Log results
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('Survey details:', {
      id: foundSurvey.id,
      externalId: foundSurvey.externalId,
      facilityId: foundSurvey.facilityId,
      facilityName: foundSurvey.facility ? foundSurvey.facility.name : 'Not loaded',
      facilityDataType: typeof foundSurvey.facilityData
    });
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    
    // Log more details about the error
    if (error.original) {
      console.error('Original error:', error.original.message);
      if (error.original.sql) {
        console.error('SQL:', error.original.sql);
      }
    }
    
    // Log validation errors if any
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
    // Close the connection if it was created
    if (sequelize) {
      try {
        await sequelize.close();
      } catch (closeError) {
        console.error('Error closing connection:', closeError.message);
      }
    }
  }
}

// Run the test
runIncrementalTest().catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
});
