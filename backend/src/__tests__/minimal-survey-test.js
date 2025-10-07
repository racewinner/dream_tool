// Minimal test for Survey model
const { expect } = require('chai');
const { Sequelize, DataTypes } = require('sequelize');

console.log('Starting minimal Survey model test...');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false,
  retry: { max: 5, timeout: 60000 }
});

// Load the actual Survey model
try {
  console.log('Loading Survey model...');
  const surveyModule = require('../../dist/models/survey');
  
  // Initialize the Survey model
  const Survey = surveyModule.initSurveyModel(sequelize);
  
  // Define a minimal Facility model
  const Facility = sequelize.define('Facility', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false }
  }, {
    tableName: 'Facilities',
    timestamps: true
  });
  
  // Set up associations
  Survey.belongsTo(Facility, { foreignKey: 'facilityId' });
  Facility.hasMany(Survey, { foreignKey: 'facilityId' });
  
  // Minimal test data
  const testData = {
    externalId: 'minimal-test-1',
    facilityId: 1,
    facilityData: { name: 'Test Facility' },
    collectionDate: new Date(),
    respondentId: 'test-1'
  };
  
  describe('Minimal Survey Model Test', function() {
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
        await Facility.create({ id: 1, name: 'Test Facility' });
        
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
    
    it('should create a survey with minimal data', async function() {
      console.log('\nRunning test: should create a survey with minimal data');
      
      try {
        console.log('Creating survey...');
        const survey = await Survey.create(testData);
        
        console.log('Survey created successfully:', {
          id: survey.id,
          externalId: survey.externalId,
          facilityId: survey.facilityId
        });
        
        // Basic assertions
        expect(survey).to.have.property('id');
        expect(survey.externalId).to.equal(testData.externalId);
        
        // Verify the survey can be retrieved
        const foundSurvey = await Survey.findByPk(survey.id);
        expect(foundSurvey).to.exist;
        expect(foundSurvey.externalId).to.equal(testData.externalId);
        
        console.log('Test completed successfully');
      } catch (error) {
        console.error('\n=== TEST ERROR ===');
        console.error('Error:', error.message);
        if (error.original) console.error('Original:', error.original.message);
        if (error.sql) console.error('SQL:', error.sql);
        throw error;
      }
    });
  });
  
} catch (error) {
  console.error('\n=== FATAL ERROR ===');
  console.error('Error:', error.message);
  if (error.original) console.error('Original:', error.original.message);
  process.exit(1);
}
