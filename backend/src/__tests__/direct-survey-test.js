// Direct test for Survey model using compiled JavaScript
const { expect } = require('chai');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('Starting direct Survey model test...');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log, // Enable logging for debugging
  retry: { max: 5, timeout: 60000 }
});

// Load the compiled Survey model directly
const Survey = require('../../dist/models/survey').default(sequelize);

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

// Minimal test data
const testData = {
  externalId: 'direct-test-1',
  facilityId: 1,
  facilityData: { 
    name: 'Direct Test Facility',
    productiveSectors: ['health facility'],
    ownership: 'public'
  },
  collectionDate: new Date(),
  respondentId: 'direct-test-1'
};

describe('Direct Survey Model Test', function() {
  this.timeout(30000);
  
  before(async function() {
    try {
      console.log('\n=== Setting up test ===');
      
      // Sync models one by one
      console.log('Syncing Facility model...');
      await Facility.sync({ force: true });
      
      console.log('Syncing Survey model...');
      await Survey.sync({ force: true });
      
      // Create a test facility
      console.log('Creating test facility...');
      await Facility.create({ id: 1, name: 'Direct Test Facility' });
      
      console.log('Test setup complete\n');
    } catch (error) {
      console.error('\n=== SETUP ERROR ===');
      console.error('Error:', error.message);
      if (error.original) console.error('Original:', error.original.message);
      if (error.sql) console.error('SQL:', error.sql);
      throw error;
    }
  });
  
  after(async function() {
    console.log('\nCleaning up...');
    await sequelize.close();
  });
  
  it('should create a survey with direct model', async function() {
    console.log('\nRunning test: should create a survey with direct model');
    
    try {
      console.log('Creating survey...');
      console.log('Test data:', JSON.stringify(testData, null, 2));
      
      const survey = await Survey.create(testData);
      
      console.log('Survey created successfully:', {
        id: survey.id,
        externalId: survey.externalId,
        facilityId: survey.facilityId,
        facilityData: survey.facilityData ? 'present' : 'missing'
      });
      
      // Basic assertions
      expect(survey).to.have.property('id');
      expect(survey.externalId).to.equal(testData.externalId);
      
      // Verify facility data
      expect(survey.facilityData).to.exist;
      expect(survey.facilityData.name).to.equal(testData.facilityData.name);
      
      // Verify the survey can be retrieved
      const foundSurvey = await Survey.findByPk(survey.id);
      expect(foundSurvey).to.exist;
      expect(foundSurvey.externalId).to.equal(testData.externalId);
      
      console.log('Test completed successfully');
    } catch (error) {
      console.error('\n=== TEST ERROR ===');
      console.error('Error:', error.message);
      if (error.original) {
        console.error('Original error:', error.original.message);
        if (error.original.sql) console.error('SQL:', error.original.sql);
      }
      console.error('Stack:', error.stack);
      throw error;
    }
  });
});
