import { Sequelize, Model, DataTypes, ModelStatic, ModelCtor } from 'sequelize';
import { 
  initSurveyModel, 
  mapSurveyRowToFacilityData, 
  SurveyModel, 
  SurveyInstance, 
  SurveyAttributes,
  FacilityData,
  ElectricitySource,
  TransportAccess,
  TimeOfDay,
  Equipment,
  BuildingInfo,
  Infrastructure,
  OperationalHours
} from '../models/survey';

// Extended SurveyModel with our custom methods
type ExtendedSurveyModel = ModelStatic<SurveyInstance> & {
  findByExternalId(externalId: string): Promise<SurveyInstance | null>;
  findByFacility(facilityId: number): Promise<SurveyInstance[]>;
  findLatestForFacility(facilityId: number): Promise<SurveyInstance | null>;
  associate?(models: { Facility: ModelCtor<Model> }): void;
};

// Helper type for test data
type TestSurveyData = Omit<SurveyAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

// Mock enums for testing
const MockElectricityReliability = {
  RELIABLE: 'reliable',
  UNRELIABLE: 'unreliable',
  NONE: 'none'
} as const;

const MockCommunicationMethod = {
  MOBILE: 'mobile',
  LANDLINE: 'landline',
  NONE: 'none'
} as const;

const MockDigitalConnectivity = {
  TWO_G: '2g',
  THREE_G: '3g',
  FOUR_G: '4g',
  FIBER: 'fiber',
  NONE: 'none'
} as const;

const MockWaterTreatmentMethod = {
  BOILING: 'boiling',
  FILTRATION: 'filtration',
  CHLORINATION: 'chlorination',
  NONE: 'none'
} as const;

// Mock Facility model for testing associations
class Facility extends Model {
  public id!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Create a new Sequelize instance for testing
const testSequelize = new Sequelize('sqlite::memory:', { 
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Initialize Facility model
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

describe('Survey Model', () => {
  let Survey: ExtendedSurveyModel;

  beforeAll(async () => {
    console.log('=== Setting up test database for Survey Model tests ===');
    try {
      console.log('Initializing Survey model...');
      // Initialize Survey model
      const SurveyModel = initSurveyModel(testSequelize);
      
      // Extend the model with custom methods
      const extendedModel = Object.assign(SurveyModel, {
        // Add custom methods
        async findByExternalId(externalId: string): Promise<SurveyInstance | null> {
          return (this as any).findOne({ where: { externalId } });
        },
        
        async findByFacility(facilityId: number): Promise<SurveyInstance[]> {
          return (this as any).findAll({ 
            where: { facilityId },
            order: [['collectionDate', 'DESC']]
          });
        },
        
        async findLatestForFacility(facilityId: number): Promise<SurveyInstance | null> {
          return (this as any).findOne({
            where: { facilityId },
            order: [['collectionDate', 'DESC']],
            limit: 1
          });
        },
        
        // Add associate method
        associate(models: { Facility: ModelCtor<Model> }) {
          (this as any).belongsTo(models.Facility, {
            foreignKey: 'facilityId',
            as: 'facility'
          });
        }
      }) as unknown as ExtendedSurveyModel;
      
      Survey = extendedModel;
      
      // Set up associations
      if (Survey.associate) {
        Survey.associate({ 
          Facility: Facility as unknown as ModelCtor<Model> 
        });
      }
      
      // Create tables
      await testSequelize.sync({ force: true });
      
      // Create a test facility
      await Facility.create({
        id: 1,
        name: 'Test Health Center'
      });
    } catch (error) {
      console.error('Error in beforeAll setup:', error);
      console.error('Error in beforeAll:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await testSequelize.close();
  });

  describe('mapSurveyRowToFacilityData', () => {
    it('should map raw survey data to FacilityData structure', () => {
      const mockRow = {
        'Type of health facility': 'Health Center',
        'Ownership': 'Public',
        'Population served': '5000',
        'Q12. What is the main source of electricity for the clinic?': 'Solar',
        'Q14. The selected source of electricity powers the following;': 'Lighting;Refrigeration',
        'Q15. Is the electricity available at the facility reliable ?': 'Most of the time',
        'Q13. Electricity available at the facility for how long on average?': '8 hours',
        'Number of operational days': '6',
        'Average operational hours during day': '8',
        'Average operational hours during night': '4',
        'Number of support staff': '5',
        'Number of technical staff': '3',
        'Night staff present': 'Yes',
        'Q51. How many separate buildings does the facility have?': '3',
        'Q52. How many of these buildings are staff quarters?': '1',
        'Q53. Is there a power supply at staff houses in this health facility?': 'Yes',
        'Q54. How many departments have electric wiring for lighting and other medical equipment?': '2',
        'Q18. Transport access': 'paved_road',
        'Q34. Is there a functioning mobile or landline phone at the facility today owned by facility (not staff member)?': 'Yes',
        'Q19. Internet connectivity': 'Mobile data',
        'Q37. How many water pumps are being used in the facility to access water ?': '1',
        'Q24. What is the secondary/backup source of electricity for the facility?': 'Generator',
        'Q27. How much is the monthly cost of diesel fuel for the health facility on average?': '5000',
        'Q28. What is the fuel consumption per month(worst scenario) in liters?': '200',
        'Q29. On average, how much does the facility spend on servicing the diesel generator every year?': '12000',
        'Q30. Who provides operations and maintenance for the source of electricity at the facility?': 'Facility staff',
        'Q38. What is the main source of power for the water pumps at the health facility?': 'Electricity',
        'Q40. What is the main water treatment method used in the facility?': 'Boiling',
        'Q42 Does the facility take inpatients and outpatients?': 'Both',
        'Q43. How many beds does the health facility have for overnight patient care?': '10',
        'Q46. What do you think is the facility\'s most important need in terms of providing better health services?': 'Reliable electricity',
        'Q50. On average, how many patients were attended to by the facility per month?': '500',
        'Q65. Which departments need electric sockets for using additional medical equipment? (mark all that apply)': 'Laboratory;Pharmacy',
        'Q67. Which equipment would the health facility consider to have if there was available and reliable electricity on site?': 'Ultrasound;X-ray'
      };

      const result = mapSurveyRowToFacilityData(mockRow);

      // Test some key mappings
      expect(result.ownership).toBe('Public');
      expect(result.catchmentPopulation).toBe(5000);
      expect(result.electricitySource).toBe('solar');
      expect(result.coreServices).toContain('Lighting');
      expect(result.coreServices).toContain('Refrigeration');
      expect(result.operationalHours.day).toBe(8);
      expect(result.operationalHours.night).toBe(4);
      expect(result.buildings.total).toBe(3);
      expect(result.infrastructure.waterAccess).toBe(true);
      expect(result.departmentsNeedingSockets).toContain('Laboratory');
      expect(result.futureEquipmentNeeds).toContain('Ultrasound');
    });
  });

  describe('Survey Model CRUD', () => {
    console.log('Starting Survey Model CRUD tests');
    it('should create a new survey', async () => {
      console.log('Test: should create a new survey');
      // Test creating a survey with minimal required fields
      const surveyData: TestSurveyData = {
        externalId: 'minimal-survey',
        facilityId: 1,
        collectionDate: new Date(),
        respondentId: 'test-respondent-1',
        facilityData: {
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
        }
      };
      
      const minimalSurvey = await Survey.create(surveyData);
      
      const createdSurvey = await Survey.findByPk(minimalSurvey.id, {
        include: ['facility']
      });
      
      expect(createdSurvey).toBeDefined();
      if (!createdSurvey) return;
      
      expect(createdSurvey.externalId).toBe('minimal-survey');
      expect(createdSurvey.facilityId).toBe(1);
      expect(createdSurvey.respondentId).toBe('test-respondent-1');
      expect(createdSurvey.facilityData).toBeDefined();
      expect(createdSurvey.facilityData.productiveSectors).toContain('health facility');
      expect(createdSurvey.facilityData.electricitySource).toBe(ElectricitySource.SOLAR);
      expect(createdSurvey.facilityData.infrastructure.transportationAccess).toBe(TransportAccess.PAVED_ROAD);
      
      // Test the utility methods
      const foundByExternalId = await Survey.findByExternalId('minimal-survey');
      expect(foundByExternalId?.id).toBe(minimalSurvey.id);
      
      const facilitySurveys = await Survey.findByFacility(1);
      expect(facilitySurveys.length).toBe(1);
      expect(facilitySurveys[0].id).toBe(minimalSurvey.id);
      
      const latestSurvey = await Survey.findLatestForFacility(1);
      expect(latestSurvey?.id).toBe(minimalSurvey.id);
      
      // Test the association
      // Test the association
      // Test the association
      const facility = await (minimalSurvey as any).getFacility();
      expect(facility).toBeDefined();
      expect(facility.id).toBe(1);
      expect(facility.name).toBe('Test Health Center');
    });
  });
  
  describe('Utility Methods', () => {
    beforeEach(async () => {
      // Clear all test data
      await Survey.destroy({ where: {}, truncate: true });
      
      // Create a minimal valid facilityData object with all required fields
      const minimalFacilityData: FacilityData = {
        // Required fields with default values
        productiveSectors: ['health'],
        subsectorActivities: ['general'],
        ownership: 'public',
        catchmentPopulation: 1000,
        coreServices: ['outpatient'],
        electricitySource: ElectricitySource.NATIONAL_GRID,
        electricityReliability: 'reliable',
        electricityAvailability: '8-12 hours',
        operationalDays: 5,
        operationalHours: { day: 8, night: 4 },
        criticalNeeds: [],
        supportStaff: 1,
        technicalStaff: 1,
        nightStaff: false,
        buildings: {
          total: 1,
          departmentsWithWiring: 1,
          rooms: 1,
          roomsWithConnection: 1
        },
        equipment: [],
        infrastructure: {
          waterAccess: true,
          nationalGrid: true,
          transportationAccess: TransportAccess.PAVED_ROAD,
          communication: 'mobile',
          digitalConnectivity: '3g'
        },
        // Optional fields with default values
        secondaryElectricitySource: ElectricitySource.DIESEL_GENERATOR,
        monthlyDieselCost: 0,
        monthlyFuelConsumption: 0,
        annualMaintenanceCost: 0,
        electricityMaintenanceProvider: 'provider',
        hasFacilityPhone: true,
        numberOfWaterPumps: 1,
        waterPumpPowerSource: 'electric',
        waterTreatmentMethod: 'boiling',
        inpatientOutpatient: 'both',
        numberOfBeds: 10,
        mostImportantNeed: 'reliable electricity',
        averageMonthlyPatients: 100,
        numberOfBuildings: 1,
        numberOfStaffQuarters: 1,
        staffQuartersPowered: true,
        departmentsNeedingSockets: ['lab', 'pharmacy'],
        futureEquipmentNeeds: ['ultrasound', 'xray']
      };
      
      // Create test facilities
      await Facility.bulkCreate([
        { id: 1, name: 'Test Facility 1' },
        { id: 2, name: 'Test Facility 2' }
      ]);
      
      // Create test surveys with all required fields
      const testSurveys: TestSurveyData[] = [
        {
          externalId: 'survey-1',
          facilityId: 1,
          collectionDate: new Date('2023-01-01'),
          respondentId: 'respondent-1',
          facilityData: {
            ...minimalFacilityData,
            electricitySource: ElectricitySource.SOLAR,
            infrastructure: {
              ...minimalFacilityData.infrastructure,
              transportationAccess: TransportAccess.PAVED_ROAD
            }
          }
        },
        {
          externalId: 'survey-2',
          facilityId: 2,
          collectionDate: new Date('2023-01-02'),
          respondentId: 'respondent-2',
          facilityData: {
            ...minimalFacilityData,
            electricitySource: ElectricitySource.NATIONAL_GRID,
            infrastructure: {
              ...minimalFacilityData.infrastructure,
              transportationAccess: TransportAccess.UNPAVED_ROAD
            }
          }
        },
        {
          externalId: 'survey-3',
          facilityId: 1,
          collectionDate: new Date('2023-03-01'),
          respondentId: 'user-1',
          facilityData: {
            ...minimalFacilityData,
            ownership: 'public',
            electricitySource: ElectricitySource.SOLAR,
            infrastructure: {
              ...minimalFacilityData.infrastructure,
              transportationAccess: TransportAccess.PAVED_ROAD
            }
          }
        }
      ];
    });
    
    it('should find survey by external ID', async () => {
      const survey = await Survey.findByExternalId('survey-2');
      expect(survey).not.toBeNull();
      expect(survey?.facilityData.ownership).toBe('Private');
    });
    
    it('should find all surveys for a facility', async () => {
      const surveys = await Survey.findByFacility(1);
      expect(surveys.length).toBe(2);
      expect(surveys[0].externalId).toBe('survey-2'); // Should be ordered by date desc
      expect(surveys[1].externalId).toBe('survey-1');
    });
    
    it('should find latest survey for a facility', async () => {
      const latest = await Survey.findLatestForFacility(1);
      expect(latest?.externalId).toBe('survey-2');
      expect(latest?.facilityData.ownership).toBe('Private');
    });
    
    it('should return null when no survey found', async () => {
      const survey = await Survey.findByExternalId('non-existent');
      expect(survey).toBeNull();
    });
  });
});
