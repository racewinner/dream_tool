// Direct test for Survey model using compiled JavaScript
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Direct Survey Model Test ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: console.log, // Enable SQL logging
  retry: { max: 5, timeout: 60000 }
});

// Load the compiled Survey model
try {
  console.log('Loading Survey model...');
  const { initSurveyModel } = require('./dist/models/survey');
  
  // Initialize the Survey model
  const Survey = initSurveyModel(sequelize);
  
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
  
  // Test data - using the exact structure expected by the model
  const testData = {
    externalId: 'direct-test-1',
    facilityId: 1,
    facilityData: JSON.stringify({ 
      name: 'Direct Test Facility',
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
    }),
    collectionDate: new Date(),
    respondentId: 'direct-test-1'
  };
  
  // Run the test
  async function runTest() {
    try {
      console.log('\n=== Starting test ===');
      
      // Sync models
      console.log('\n1. Syncing models...');
      await sequelize.sync({ force: true });
      console.log('Models synced successfully');
      
      // Create a test facility
      console.log('\n2. Creating test facility...');
      await Facility.create({ id: 1, name: 'Test Facility' });
      console.log('Test facility created');
      
      // Create a survey
      console.log('\n3. Creating survey...');
      console.log('Test data:', JSON.stringify(testData, null, 2));
      
      const survey = await Survey.create(testData);
      console.log('\nSurvey created successfully:', {
        id: survey.id,
        externalId: survey.externalId,
        facilityId: survey.facilityId,
        facilityData: survey.facilityData ? 'present' : 'missing'
      });
      
      // Verify the survey was saved
      console.log('\n4. Verifying survey was saved...');
      const foundSurvey = await Survey.findByPk(survey.id);
      console.log('Found survey:', foundSurvey ? 'Yes' : 'No');
      
      if (foundSurvey) {
        console.log('Survey details:', {
          id: foundSurvey.id,
          externalId: foundSurvey.externalId,
          facilityId: foundSurvey.facilityId,
          facilityData: foundSurvey.facilityData ? 'present' : 'missing'
        });
      }
      
      console.log('\n=== Test completed successfully ===');
      
    } catch (error) {
      console.error('\n=== TEST FAILED ===');
      console.error('Error:', error.message);
      
      if (error.original) {
        console.error('Original error:', error.original.message);
        if (error.original.sql) {
          console.error('SQL:', error.original.sql);
        }
      }
      
      console.error('Stack:', error.stack);
      throw error;
    } finally {
      // Close the connection
      await sequelize.close();
    }
  }
  
  // Run the test
  runTest().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
  
} catch (error) {
  console.error('\n=== FAILED TO LOAD SURVEY MODEL ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\nModule not found. Tried to load from:', path.resolve('./dist/models/survey'));
    console.error('Current working directory:', process.cwd());
    
    // Try to list the dist directory
    try {
      const fs = require('fs');
      const distPath = path.resolve('./dist');
      console.log('\nContents of dist directory:');
      console.log(fs.readdirSync(distPath));
      
      const modelsPath = path.resolve('./dist/models');
      if (fs.existsSync(modelsPath)) {
        console.log('\nContents of dist/models directory:');
        console.log(fs.readdirSync(modelsPath));
      } else {
        console.log('\ndist/models directory does not exist');
      }
    } catch (fsError) {
      console.error('Error reading dist directory:', fsError.message);
    }
  }
  
  process.exit(1);
}
