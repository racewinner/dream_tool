// Test using the actual Survey model with simplified test structure
const { expect } = require('chai');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('Starting actual Survey model test...');

// Load the actual Survey model
try {
  console.log('Loading Survey model...');
  const surveyModule = require('../../dist/models/survey');
  console.log('Survey module loaded successfully');
  
  // Initialize the actual Survey model
  const sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
    retry: { max: 5, timeout: 60000 }
  });
  
  const Survey = surveyModule.initSurveyModel(sequelize);
  
  // Define a simple Facility model for testing
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
  
  // Test data
  const testFacilityData = {
    productiveSectors: ['health facility'],
    subsectorActivities: ['Health Center'],
    ownership: 'public',
    catchmentPopulation: 5000,
    coreServices: ['Outpatient', 'Inpatient']
  };
  
  describe('Actual Survey Model Test', function() {
    this.timeout(60000);
    
    before(async function() {
      try {
        // Sync all models
        console.log('Syncing database...');
        await sequelize.sync({ force: true });
        
        // Create a test facility
        console.log('Creating test facility...');
        await Facility.create({
          id: 1,
          name: 'Test Facility'
        });
        
        console.log('Test setup complete');
      } catch (error) {
        console.error('Error in test setup:', error);
        throw error;
      }
    });
    
    after(async function() {
      console.log('\nCleaning up...');
      await sequelize.close();
    });
    
    it('should create a survey using the actual model', async function() {
      console.log('\nTest: should create a survey using the actual model');
      
      const surveyData = {
        externalId: 'test-actual-survey',
        facilityId: 1,
        facilityData: testFacilityData,
        collectionDate: new Date(),
        respondentId: 'test-respondent-1'
      };
      
      try {
        const survey = await Survey.create(surveyData);
        console.log('Created survey with actual model');
        
        expect(survey).to.have.property('id');
        expect(survey.externalId).to.equal(surveyData.externalId);
        expect(survey.facilityId).to.equal(surveyData.facilityId);
        expect(survey.facilityData).to.deep.include(testFacilityData);
        
        // Verify the survey can be retrieved
        const foundSurvey = await Survey.findByPk(survey.id);
        expect(foundSurvey).to.exist;
        expect(foundSurvey.externalId).to.equal(surveyData.externalId);
        
      } catch (error) {
        console.error('Error creating survey:', error);
        throw error;
      }
    });
  });
  
} catch (error) {
  console.error('Error loading Survey model:', error);
  process.exit(1);
}
