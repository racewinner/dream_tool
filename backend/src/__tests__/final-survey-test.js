// Final Survey model test combining working elements
const { expect } = require('chai');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('Starting final Survey model test...');

// Load the actual Survey model
try {
  console.log('Loading Survey model...');
  const surveyModule = require('../../dist/models/survey');
  console.log('Survey module loaded successfully');
  
  // Initialize Sequelize with SQLite in-memory database
  const sequelize = new Sequelize('sqlite::memory:', {
    logging: false,
    retry: { max: 5, timeout: 60000 }
  });
  
  // Initialize the actual Survey model with detailed error handling
  let Survey;
  try {
    console.log('Initializing Survey model...');
    Survey = surveyModule.initSurveyModel(sequelize);
    console.log('Survey model initialized successfully');
  } catch (error) {
    console.error('Error initializing Survey model:', error);
    throw error;
  }
  
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
    timestamps: true,
    underscored: true
  });
  
  // Set up associations
  Survey.belongsTo(Facility, { 
    foreignKey: 'facilityId',
    as: 'facility'
  });
  
  Facility.hasMany(Survey, { 
    foreignKey: 'facilityId',
    as: 'surveys'
  });
  
  // Test data - using the same structure as the original test
  const testFacilityData = {
    productiveSectors: ['health facility'],
    subsectorActivities: ['Health Center'],
    ownership: 'public',
    catchmentPopulation: 5000,
    coreServices: ['Outpatient', 'Inpatient'],
    electricitySource: 'solar',
    electricityReliability: 'reliable',
    electricityAvailability: '8-12 hours',
    operationalDays: 5,
    operationalHours: { day: 8, night: 4 },
    criticalNeeds: ['reliable power'],
    supportStaff: 5,
    technicalStaff: 2,
    nightStaff: true,
    buildings: {
      total: 3,
      departmentsWithWiring: 2,
      rooms: 5,
      roomsWithConnection: 4
    },
    equipment: [],
    infrastructure: {
      waterAccess: true,
      nationalGrid: false,
      transportationAccess: 'paved_road',
      communication: 'mobile',
      digitalConnectivity: '3g'
    },
    secondaryElectricitySource: 'generator',
    monthlyDieselCost: 5000,
    monthlyFuelConsumption: 200,
    annualMaintenanceCost: 12000,
    electricityMaintenanceProvider: 'Facility staff',
    hasFacilityPhone: true,
    numberOfWaterPumps: 1,
    waterPumpPowerSource: 'electric',
    waterTreatmentMethod: 'boiling',
    inpatientOutpatient: 'both',
    numberOfBeds: 20,
    mostImportantNeed: 'reliable electricity',
    averageMonthlyPatients: 200,
    numberOfBuildings: 3,
    numberOfStaffQuarters: 2,
    staffQuartersPowered: true,
    departmentsNeedingSockets: ['Laboratory', 'Pharmacy'],
    futureEquipmentNeeds: ['Ultrasound', 'X-ray']
  };
  
  describe('Final Survey Model Test', function() {
    this.timeout(60000);
    
    before(async function() {
      try {
        // Sync all models with detailed logging
        console.log('\n=== Starting test setup ===');
        
        console.log('\n1. Syncing database...');
        const syncOptions = { 
          force: true,
          logging: (sql) => console.log('  SQL:', sql)
        };
        
        // Sync Facility model first
        console.log('\n2. Syncing Facility model...');
        await Facility.sync(syncOptions);
        
        // Then sync Survey model
        console.log('\n3. Syncing Survey model...');
        await Survey.sync(syncOptions);
        
        // Create test facilities
        console.log('\n4. Creating test facilities...');
        const facilities = await Facility.bulkCreate([
          { id: 1, name: 'Test Facility 1' },
          { id: 2, name: 'Test Facility 2' }
        ], { returning: true });
        
        console.log('\n5. Verifying facilities were created...');
        const facilityCount = await Facility.count();
        console.log(`  Created ${facilityCount} facilities`);
        
        // Verify the facilities exist
        for (const facility of facilities) {
          const found = await Facility.findByPk(facility.id);
          console.log(`  - Facility ${facility.id}: ${found ? 'Found' : 'Not found'}`);
        }
        
        console.log('\n=== Test setup complete ===\n');
      } catch (error) {
        console.error('\n=== Error in test setup ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.original) {
          console.error('\nOriginal error:', error.original);
        }
        
        if (error.sql) {
          console.error('\nSQL:', error.sql);
        }
        
        throw error;
      }
    });
    
    after(async function() {
      console.log('\nCleaning up...');
      await sequelize.close();
    });
    
    describe('CRUD Operations', function() {
      it('should create a new survey', async function() {
        console.log('\nTest: should create a new survey');
        
        const surveyData = {
          externalId: 'test-survey-1',
          facilityId: 1,
          facilityData: testFacilityData,
          collectionDate: new Date(),
          respondentId: 'test-respondent-1'
        };
        
        try {
          console.log('Attempting to create survey with data:', JSON.stringify(surveyData, null, 2));
          
          // Verify the facility exists first
          const facility = await Facility.findByPk(1);
          console.log('Found facility:', facility ? `ID: ${facility.id}, Name: ${facility.name}` : 'Not found');
          
          if (!facility) {
            throw new Error('Test facility not found');
          }
          
          // Create the survey
          const survey = await Survey.create(surveyData);
          
          console.log('Successfully created survey:', {
            id: survey.id,
            externalId: survey.externalId,
            facilityId: survey.facilityId,
            facilityDataKeys: Object.keys(survey.facilityData || {})
          });
          
          // Basic assertions
          expect(survey).to.have.property('id');
          expect(survey.externalId).to.equal(surveyData.externalId);
          
          // Verify facility data
          if (!survey.facilityData) {
            throw new Error('facilityData is undefined');
          }
          
          // Check a few key properties instead of the entire object
          expect(survey.facilityData.productiveSectors).to.deep.equal(testFacilityData.productiveSectors);
          expect(survey.facilityData.ownership).to.equal(testFacilityData.ownership);
          
          // Verify the survey can be retrieved
          const foundSurvey = await Survey.findByPk(survey.id);
          expect(foundSurvey).to.exist;
          expect(foundSurvey.externalId).to.equal(surveyData.externalId);
          
        } catch (error) {
          console.error('Error in test:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            sql: error.sql,
            original: error.original
          });
          throw error;
        }
      });
      
      it('should find a survey by external ID', async function() {
        console.log('\nTest: should find a survey by external ID');
        
        const externalId = 'find-by-external-id';
        const surveyData = {
          externalId,
          facilityId: 1,
          facilityData: testFacilityData,
          collectionDate: new Date(),
          respondentId: 'test-respondent-2'
        };
        
        try {
          // Create a survey to find
          const createdSurvey = await Survey.create(surveyData);
          console.log('Created survey for find test:', createdSurvey.id);
          
          // Find the survey by external ID
          const foundSurvey = await Survey.findOne({ 
            where: { externalId },
            include: [{ model: Facility, as: 'facility' }]
          });
          
          expect(foundSurvey).to.exist;
          expect(foundSurvey.id).to.equal(createdSurvey.id);
          expect(foundSurvey.facility).to.exist;
          expect(foundSurvey.facility.name).to.equal('Test Facility 1');
          
        } catch (error) {
          console.error('Error in find test:', error);
          throw error;
        }
      });
      
      it('should find surveys by facility ID', async function() {
        console.log('\nTest: should find surveys by facility ID');
        
        const facilityId = 2;
        const surveyData = {
          externalId: 'facility-2-survey',
          facilityId,
          facilityData: testFacilityData,
          collectionDate: new Date(),
          respondentId: 'test-respondent-3'
        };
        
        try {
          // Create a survey for facility 2
          const createdSurvey = await Survey.create(surveyData);
          console.log('Created survey for facility 2:', createdSurvey.id);
          
          // Find facility with surveys
          const facility = await Facility.findByPk(facilityId, {
            include: [{ model: Survey, as: 'surveys' }]
          });
          
          expect(facility).to.exist;
          expect(facility.surveys).to.be.an('array');
          expect(facility.surveys.length).to.be.greaterThan(0);
          
          const survey = facility.surveys[0];
          expect(survey.externalId).to.equal(surveyData.externalId);
          expect(survey.facilityData).to.deep.include(testFacilityData);
          
        } catch (error) {
          console.error('Error in facility search test:', error);
          throw error;
        }
      });
    });
  });
  
} catch (error) {
  console.error('Error in test setup:', error);
  process.exit(1);
}
