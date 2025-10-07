// Incremental Survey model test
const { expect } = require('chai');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('Starting incremental survey test...');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false, // Disable logging for cleaner output
  retry: {
    max: 5,
    timeout: 60000
  }
});

// Test data
const minimalFacilityData = {
  productiveSectors: ['health facility'],
  subsectorActivities: ['Health Center'],
  ownership: 'public',
  catchmentPopulation: 5000,
  coreServices: ['Outpatient', 'Inpatient']
};

// Phase 1: Basic model definition
let Facility, Survey;

async function setupPhase1() {
  console.log('\n--- PHASE 1: Basic model definition ---');
  
  // Define Facility model
  Facility = sequelize.define('Facility', {
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

  // Define basic Survey model
  Survey = sequelize.define('Survey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    externalId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    facilityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    facilityData: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  }, {
    tableName: 'Surveys',
    timestamps: true
  });

  // Sync models
  await sequelize.sync({ force: true });
  console.log('Phase 1: Models synced successfully');
}

// Phase 2: Add associations
async function setupPhase2() {
  console.log('\n--- PHASE 2: Adding associations ---');
  
  // Set up associations
  Survey.belongsTo(Facility, { 
    foreignKey: 'facilityId',
    as: 'facility'
  });
  
  Facility.hasMany(Survey, { 
    foreignKey: 'facilityId',
    as: 'surveys'
  });

  // Re-sync with associations
  await sequelize.sync({ force: true });
  console.log('Phase 2: Associations added successfully');
}

// Phase 3: Add test data
async function setupPhase3() {
  console.log('\n--- PHASE 3: Adding test data ---');
  
  // Create test facilities
  const facilities = await Facility.bulkCreate([
    { id: 1, name: 'Test Facility 1' },
    { id: 2, name: 'Test Facility 2' }
  ]);
  
  console.log(`Created ${facilities.length} test facilities`);
  return facilities;
}

describe('Incremental Survey Model Test', function() {
  // Increase timeout for all tests in this suite
  this.timeout(60000);

  before(async function() {
    try {
      // Run setup phases
      await setupPhase1();
      await setupPhase2();
      await setupPhase3();
      
      console.log('\nTest setup complete');
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  after(async function() {
    console.log('\nCleaning up...');
    await sequelize.close();
  });

  describe('Basic CRUD Operations', function() {
    it('should create a new survey (minimal data)', async function() {
      console.log('\nTest: should create a new survey (minimal data)');
      
      const testData = {
        externalId: 'test-minimal-survey',
        facilityId: 1,
        facilityData: minimalFacilityData
      };
      
      const survey = await Survey.create(testData);
      console.log('Created survey with minimal data');
      
      expect(survey).to.have.property('id');
      expect(survey.externalId).to.equal(testData.externalId);
    });

    it('should create a new survey (full data)', async function() {
      console.log('\nTest: should create a new survey (full data)');
      
      const fullFacilityData = {
        ...minimalFacilityData,
        electricitySource: 'solar',
        electricityReliability: 'reliable',
        operationalDays: 5,
        operationalHours: { day: 8, night: 4 },
        supportStaff: 5,
        technicalStaff: 2,
        infrastructure: {
          waterAccess: true,
          nationalGrid: false,
          transportationAccess: 'paved_road'
        }
      };
      
      const testData = {
        externalId: 'test-full-survey',
        facilityId: 2,
        facilityData: fullFacilityData,
        collectionDate: new Date(),
        respondentId: 'test-respondent-1'
      };
      
      const survey = await Survey.create(testData);
      console.log('Created survey with full data');
      
      expect(survey).to.have.property('id');
      expect(survey.externalId).to.equal(testData.externalId);
      expect(survey.facilityData).to.deep.include(minimalFacilityData);
    });
  });

  describe('Associations', function() {
    it('should find surveys by facility', async function() {
      console.log('\nTest: should find surveys by facility');
      
      // Create test survey
      await Survey.create({
        externalId: 'facility-1-survey',
        facilityId: 1,
        facilityData: minimalFacilityData
      });
      
      // Find facility with surveys
      const facility = await Facility.findByPk(1, {
        include: [{ model: Survey, as: 'surveys' }]
      });
      
      expect(facility).to.exist;
      expect(facility.surveys).to.be.an('array');
      expect(facility.surveys.length).to.be.greaterThan(0);
      console.log(`Found ${facility.surveys.length} surveys for facility`);
    });
  });
});
