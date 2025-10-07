// Minimal test script to isolate the issue with the Survey model
const { Sequelize, DataTypes } = require('sequelize');

console.log('=== Minimal Survey Model Test ===\n');

async function test() {
  // Create an in-memory SQLite database with minimal configuration
  const sequelize = new Sequelize('sqlite::memory:', {
    logging: console.log,
    retry: { max: 5, timeout: 60000 }
  });

  try {
    console.log('1. Loading Survey model...');
    const { initSurveyModel } = require('./dist/models/survey');
    
    console.log('2. Initializing Survey model...');
    const Survey = initSurveyModel(sequelize);
    
    console.log('3. Syncing database...');
    await sequelize.sync({ force: true });
    
    console.log('4. Creating test survey with minimal data...');
    const survey = await Survey.create({
      externalId: 'minimal-test-1',
      facilityId: 1,  // This would normally reference a facility
      facilityData: { test: 'minimal test' },
      collectionDate: new Date(),
      respondentId: 'test-respondent-1'
    });
    
    console.log('✓ Survey created successfully with ID:', survey.id);
    
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.message);
    
    if (error.original) {
      console.error('Original error:', error.original.message);
      if (error.original.sql) {
        console.error('SQL:', error.original.sql);
      }
    }
    
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

test().catch(console.error);
