// Debug script for the Survey model
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

console.log('=== Survey Model Debug ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log, // Enable SQL logging
  retry: { max: 5, timeout: 60000 }
});

// Helper function to safely log objects
function safeStringify(obj, indent = 2) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  }, indent);
}

// Load the compiled Survey model
try {
  console.log('1. Loading compiled Survey model...');
  const modelPath = path.resolve('./dist/models/survey.js');
  console.log(`   - Path: ${modelPath}`);
  
  // Check if the file exists
  const fs = require('fs');
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model file not found at ${modelPath}`);
  }
  
  // Load the model
  const { initSurveyModel } = require(modelPath);
  console.log('   - Model loaded successfully');
  
  console.log('\n2. Initializing Survey model...');
  const Survey = initSurveyModel(sequelize);
  console.log('   - Survey model initialized');
  
  // Log basic model information
  console.log('\n3. Model Information:');
  console.log(`   - Model name: ${Survey.name}`);
  console.log(`   - Table name: ${Survey.tableName}`);
  
  // Log all model attributes
  console.log('\n4. Model Attributes:');
  if (Survey.rawAttributes) {
    Object.entries(Survey.rawAttributes).forEach(([name, attr]) => {
      console.log(`\n   - ${name}:`);
      console.log(`     Type: ${attr.type ? attr.type.key : 'unknown'}`);
      console.log(`     Allow null: ${attr.allowNull !== false}`);
      
      if (attr.primaryKey) console.log('     Primary key: true');
      if (attr.autoIncrement) console.log('     Auto increment: true');
      if (attr.defaultValue !== undefined) {
        console.log(`     Default value: ${JSON.stringify(attr.defaultValue)}`);
      }
      
      // Log validations if they exist
      if (attr.validate) {
        console.log('     Validations:');
        Object.entries(attr.validate).forEach(([key, value]) => {
          console.log(`       - ${key}: ${JSON.stringify(value)}`);
        });
      }
    });
  } else {
    console.log('   - No attributes found (rawAttributes is undefined)');
  }
  
  console.log('\n5. Model Options:');
  console.log(Survey.options);
  
  // Define a minimal Facility model for testing
  console.log('\n6. Setting up test environment...');
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
  console.log('\n7. Setting up associations...');
  try {
    Survey.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });
    Facility.hasMany(Survey, { foreignKey: 'facilityId' });
    console.log('   - Associations set up successfully');
  } catch (assocError) {
    console.error('   - Error setting up associations:', assocError.message);
    throw assocError;
  }
  
  // Sync models
  console.log('\n8. Syncing database...');
  try {
    await sequelize.sync({ force: true });
    console.log('   - Database synced successfully');
  } catch (syncError) {
    console.error('   - Error syncing database:', syncError.message);
    throw syncError;
  }
  
  // Create test data
  console.log('\n9. Creating test data...');
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
  
  console.log('   - Test data prepared');
  
  // Create a test facility
  console.log('\n10. Creating test facility...');
  try {
    const facility = await Facility.create({ id: 1, name: 'Test Facility' });
    console.log('   - Test facility created with ID:', facility.id);
  } catch (facilityError) {
    console.error('   - Error creating test facility:', facilityError.message);
    throw facilityError;
  }
  
  // Try to create a survey
  console.log('\n11. Creating survey with test data...');
  try {
    const survey = await Survey.create(testData);
    console.log('   - Survey created successfully!');
    console.log('   - Survey ID:', survey.id);
    
    // Try to retrieve the survey
    console.log('\n12. Retrieving survey from database...');
    const foundSurvey = await Survey.findByPk(survey.id, {
      include: [{ model: Facility, as: 'facility' }]
    });
    
    console.log('\n13. Retrieved survey:');
    console.log('   - ID:', foundSurvey.id);
    console.log('   - External ID:', foundSurvey.externalId);
    console.log('   - Facility ID:', foundSurvey.facilityId);
    console.log('   - Facility name:', foundSurvey.facility ? foundSurvey.facility.name : 'Not loaded');
    
    // Check facilityData type and content
    console.log('   - facilityData type:', typeof foundSurvey.facilityData);
    
    if (typeof foundSurvey.facilityData === 'object') {
      console.log('   - facilityData content:', safeStringify(foundSurvey.facilityData));
    } else if (typeof foundSurvey.facilityData === 'string') {
      try {
        const parsed = JSON.parse(foundSurvey.facilityData);
        console.log('   - facilityData (parsed):', safeStringify(parsed));
      } catch (e) {
        console.log('   - facilityData (raw):', foundSurvey.facilityData);
      }
    }
    
    console.log('\n=== Test completed successfully! ===');
    
  } catch (surveyError) {
    console.error('\n=== ERROR CREATING OR RETRIEVING SURVEY ===');
    console.error('Error:', surveyError.message);
    
    if (surveyError.original) {
      console.error('Original error:', surveyError.original.message);
      if (surveyError.original.sql) {
        console.error('SQL:', surveyError.original.sql);
      }
    }
    
    // If there's a validation error, log the validation errors
    if (surveyError.name === 'SequelizeValidationError' || 
        surveyError.name === 'SequelizeUniqueConstraintError') {
      console.error('\nValidation errors:');
      surveyError.errors.forEach((err, i) => {
        console.error(`  ${i + 1}. ${err.path}: ${err.message}`);
        console.error(`     Value: ${err.value}`);
        if (err.validatorKey) console.error(`     Validator: ${err.validatorKey}`);
      });
    }
    
    console.error('\nStack:', surveyError.stack);
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n=== FATAL ERROR ===');
  console.error('Failed to load or initialize the Survey model:');
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
} finally {
  // Close the connection
  await sequelize.close();
}
