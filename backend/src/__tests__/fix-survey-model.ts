import { Sequelize, DataTypes, Model } from 'sequelize';
import { 
  initSurveyModel, 
  SurveyModel, 
  SurveyInstance, 
  FacilityData,
  ElectricitySource,
  TransportAccess
} from '../models/survey';

// Mock Facility model for testing associations
class Facility extends Model {
  public id!: number;
  public name!: string;
}

async function testSurveyModel() {
  console.log('Starting Survey model test with JSONB fix...');

  // Create a new Sequelize instance for testing
  const testSequelize = new Sequelize('sqlite::memory:', { 
    logging: console.log,  // Enable logging for debugging
    define: {
      timestamps: true,
      underscored: true
    }
  });

  try {
    // Initialize models
    console.log('Initializing Facility model...');
    Facility.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, { 
      sequelize: testSequelize,
      modelName: 'Facility',
      tableName: 'facilities',
      timestamps: true 
    });

    console.log('Initializing Survey model...');
    const Survey = initSurveyModel(testSequelize);

    // Set up associations
    console.log('Setting up associations...');
    Survey.belongsTo(Facility, {
      foreignKey: 'facilityId',
      as: 'facility'
    });

    // Create tables
    console.log('Syncing database...');
    await testSequelize.sync({ force: true });

    // Create a test facility
    console.log('Creating test facility...');
    await Facility.create({
      id: 1,
      name: 'Test Health Center'
    });

    // Test creating a survey with minimal required fields
    console.log('Creating test survey...');

    // THIS IS THE KEY FIX:
    // 1. Create FacilityData object
    const facilityData: FacilityData = {
      productiveSectors: ['health facility'],
      subsectorActivities: ['Health Center'],
      ownership: 'public',
      catchmentPopulation: 5000,
      coreServices: ['Outpatient', 'Inpatient'],
      electricitySource: ElectricitySource.SOLAR,
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
        transportationAccess: TransportAccess.PAVED_ROAD,
        communication: 'mobile',
        digitalConnectivity: '3g'
      },
      secondaryElectricitySource: ElectricitySource.DIESEL_GENERATOR,
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

    // 2. Create survey with facilityData properly stringified for SQLite
    const surveyData = {
      externalId: 'minimal-survey',
      facilityId: 1,
      collectionDate: new Date(),
      respondentId: 'test-respondent-1',
      // Convert complex object to JSON string for SQLite compatibility
      facilityData: JSON.stringify(facilityData)  
    };
    
    console.log('Survey data prepared, attempting to create...');
    const createdSurvey = await Survey.create(surveyData);
    
    console.log('Survey created successfully:', createdSurvey.id);
    
    // Verify the survey was created and can be retrieved
    const retrievedSurvey = await Survey.findByPk(createdSurvey.id);
    console.log('Survey retrieved successfully:', retrievedSurvey?.id);
    
    if (retrievedSurvey) {
      // Parse the facilityData back from string to object
      const facilityDataObj = typeof retrievedSurvey.facilityData === 'string' 
        ? JSON.parse(retrievedSurvey.facilityData) 
        : retrievedSurvey.facilityData;
      
      console.log('Facility Data Structure:', Object.keys(facilityDataObj));
      console.log('Test successful!');
    } else {
      console.error('Failed to retrieve survey');
    }

    // Close database connection
    await testSequelize.close();

  } catch (error) {
    console.error('Error in survey test:', error);
  }
}

// Run the test
testSurveyModel();
