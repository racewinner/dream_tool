// Script to inspect the Survey model structure
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Survey Model Inspection ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false,
  retry: { max: 5, timeout: 60000 }
});

// Try to load the Survey model in different ways
console.log('Attempting to load Survey model...');

let Survey;
let modelLoadMethod = '';

try {
  // Try as CommonJS module (compiled JS)
  const surveyModule = require('../../dist/models/survey');
  
  if (typeof surveyModule === 'function') {
    console.log('Loaded Survey model as a function');
    Survey = surveyModule(sequelize);
    modelLoadMethod = 'function export';
  } else if (surveyModule.default) {
    console.log('Loaded Survey model as default export');
    Survey = surveyModule.default(sequelize);
    modelLoadMethod = 'default export';
  } else if (surveyModule.initSurveyModel) {
    console.log('Loaded Survey model via initSurveyModel');
    Survey = surveyModule.initSurveyModel(sequelize);
    modelLoadMethod = 'initSurveyModel';
  } else {
    console.log('Survey module exports:', Object.keys(surveyModule));
    throw new Error('Could not determine how to initialize Survey model');
  }
  
  console.log(`\nSuccessfully loaded Survey model using ${modelLoadMethod}`);
  
  // Inspect model properties
  console.log('\n=== Model Properties ===');
  console.log('Table name:', Survey.tableName);
  console.log('Model name:', Survey.name);
  console.log('Primary key attribute:', Survey.primaryKeyAttribute);
  console.log('Primary key field:', Survey.primaryKeyField);
  
  // List model attributes
  console.log('\n=== Model Attributes ===');
  const attributes = Object.entries(Survey.rawAttributes || {}).map(([name, attr]) => ({
    name,
    type: attr.type.key,
    allowNull: attr.allowNull,
    primaryKey: !!attr.primaryKey,
    unique: !!attr.unique,
    defaultValue: attr.defaultValue
  }));
  
  console.table(attributes);
  
  // Check for associations
  console.log('\n=== Model Associations ===');
  if (Survey.associations) {
    console.log('Association count:', Object.keys(Survey.associations).length);
    Object.entries(Survey.associations).forEach(([name, assoc]) => {
      console.log(`- ${name}: ${assoc.associationType} to ${assoc.target.name}`);
    });
  } else {
    console.log('No associations found');
  }
  
  // Try to sync the model
  console.log('\n=== Model Sync Test ===');
  try {
    await Survey.sync({ force: true });
    console.log('Successfully synced Survey model');
    
    // Try to create a minimal survey
    console.log('\n=== Create Test ===');
    const testData = {
      externalId: 'inspect-test-1',
      facilityId: 1, // Note: Facility table doesn't exist, but we'll handle the error
      facilityData: { name: 'Inspection Test' },
      collectionDate: new Date(),
      respondentId: 'inspect-1'
    };
    
    try {
      const survey = await Survey.create(testData);
      console.log('Successfully created survey:', {
        id: survey.id,
        externalId: survey.externalId,
        facilityId: survey.facilityId,
        facilityData: survey.facilityData ? 'present' : 'missing'
      });
    } catch (createError) {
      console.error('Error creating survey:', createError.message);
      if (createError.original) {
        console.error('Original error:', createError.original.message);
        if (createError.original.sql) {
          console.error('SQL:', createError.original.sql);
        }
      }
    }
  } catch (syncError) {
    console.error('Error syncing Survey model:', syncError.message);
    if (syncError.original) {
      console.error('Original error:', syncError.original.message);
      if (syncError.original.sql) {
        console.error('SQL:', syncError.original.sql);
      }
    }
  }
  
} catch (error) {
  console.error('\n=== ERROR ===');
  console.error('Failed to load Survey model:', error.message);
  console.error('Stack:', error.stack);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\nModule not found. Check the path to the Survey model.');
    console.error('Tried to load from:', path.resolve('../../dist/models/survey'));
  }
  
  process.exit(1);
}

console.log('\nInspection complete');
