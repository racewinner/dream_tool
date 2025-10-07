// Survey model tests using Mocha with CommonJS
console.log('Starting test setup...');

const { expect } = require('chai');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Enable better error stack traces
Error.stackTraceLimit = 20;

console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

console.log('Requiring survey model...');
try {
  const surveyModulePath = path.join(__dirname, '../../dist/models/survey.js');
  console.log('Survey model path:', surveyModulePath);
  
  const surveyModule = require(surveyModulePath);
  console.log('Survey module loaded successfully:', Object.keys(surveyModule));
  
  if (!surveyModule.initSurveyModel) {
    throw new Error('initSurveyModel not found in survey module');
  }
  
  var { initSurveyModel } = surveyModule;
} catch (error) {
  console.error('Error requiring survey model:', error);
  console.error('Error stack:', error.stack);
  throw error;
}

console.log('Creating in-memory SQLite database...');
let sequelize;
try {
  sequelize = new Sequelize('sqlite::memory:', { 
    logging: (sql) => console.log('[SQL]', sql),
    retry: {
      max: 5,
      timeout: 60000
    }
  });
  console.log('Sequelize instance created successfully');
} catch (error) {
  console.error('Error creating Sequelize instance:', error);
  console.error('Error stack:', error.stack);
  throw error;
}

// Test data
const minimalFacilityData = {
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

describe('Survey Model', function() {
  // Increase timeout for all tests in this suite
  this.timeout(30000); // Increased timeout to 30 seconds
  
  let Survey;
  let Facility;

  before(async function() {
    console.log('Setting up test models...');
    
    try {
      // Initialize models
      console.log('Defining Facility model...');
      Facility = sequelize.define('Facility', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING,
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE
      }, {
        // Add table name to avoid pluralization issues
        tableName: 'Facilities',
        timestamps: true
      });

      console.log('Initializing Survey model...');
      Survey = initSurveyModel(sequelize);
      
      // Set up associations
      console.log('Setting up model associations...');
      Survey.belongsTo(Facility, { 
        foreignKey: 'facilityId',
        as: 'facility'
      });
      
      Facility.hasMany(Survey, { 
        foreignKey: 'facilityId',
        as: 'surveys'
      });

      // Sync all models
      console.log('Syncing database...');
      await sequelize.sync({ force: true });
      console.log('Database synced successfully');
      
      // Verify tables were created
      const tables = await sequelize.query(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      console.log('Tables in database:', tables[0].map(t => t.name));
      
      // Create test facilities
      console.log('Creating test facilities...');
      const facilities = await Facility.bulkCreate([
        { id: 1, name: 'Test Facility 1' },
        { id: 2, name: 'Test Facility 2' }
      ], { returning: true });
      
      console.log('Created test facilities:', facilities.map(f => ({
        id: f.id,
        name: f.name
      })));
      
      // Verify facilities were created
      const facilityCount = await Facility.count();
      console.log(`Total facilities in database: ${facilityCount}`);
      
      if (facilityCount === 0) {
        throw new Error('Failed to create test facilities');
      }
      
      console.log('Test setup complete');
    } catch (error) {
      console.error('Error in test setup:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });

  after(async function() {
    console.log('Cleaning up...');
    await sequelize.close();
  });

  describe('CRUD Operations', function() {
    it('should create a new survey', async function() {
      console.log('Running test: should create a new survey');
      const surveyData = {
        externalId: 'test-survey-1',
        facilityId: 1,
        collectionDate: new Date(),
        respondentId: 'test-respondent-1',
        facilityData: minimalFacilityData
      };

      const survey = await Survey.create(surveyData);
      expect(survey).to.have.property('id');
      expect(survey.externalId).to.equal('test-survey-1');
      expect(survey.facilityData).to.deep.include(minimalFacilityData);
    });

    it('should find a survey by external ID', async function() {
      console.log('Running test: should find a survey by external ID');
      const survey = await Survey.create({
        externalId: 'find-by-external-id',
        facilityId: 1,
        collectionDate: new Date(),
        respondentId: 'test-respondent-1',
        facilityData: minimalFacilityData
      });

      const foundSurvey = await Survey.findOne({ where: { externalId: 'find-by-external-id' } });
      expect(foundSurvey).to.not.be.null;
      expect(foundSurvey.id).to.equal(survey.id);
    });

    it('should find surveys by facility ID', async function() {
      console.log('Running test: should find surveys by facility ID');
      // Create a survey for facility 2
      await Survey.create({
        externalId: 'facility-2-survey',
        facilityId: 2,
        collectionDate: new Date(),
        respondentId: 'test-respondent-2',
        facilityData: minimalFacilityData
      });

      const facility2Surveys = await Survey.findAll({ where: { facilityId: 2 } });
      expect(facility2Surveys).to.have.lengthOf(1);
      expect(facility2Surveys[0].externalId).to.equal('facility-2-survey');
    });
  });

  describe('Data Validation', function() {
    it('should require externalId', async function() {
      console.log('Running test: should require externalId');
      try {
        await Survey.create({
          facilityId: 1,
          collectionDate: new Date(),
          respondentId: 'test-respondent-1',
          facilityData: minimalFacilityData
        });
        throw new Error('Should have failed validation');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });

    it('should require facilityId', async function() {
      console.log('Running test: should require facilityId');
      try {
        await Survey.create({
          externalId: 'missing-facility-id',
          collectionDate: new Date(),
          respondentId: 'test-respondent-1',
          facilityData: minimalFacilityData
        });
        throw new Error('Should have failed validation');
      } catch (error) {
        expect(error.name).to.equal('SequelizeValidationError');
      }
    });
  });
});
