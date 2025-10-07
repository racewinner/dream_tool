import { DataImportService } from '../services/dataImportService';
import { sequelize } from '../models';
import { ElectricitySource, TransportAccess } from '../models/survey';
import { Transaction } from 'sequelize';

// Mock the models and their methods
jest.mock('../models', () => {
  const originalModule = jest.requireActual('../models');
  return {
    ...originalModule,
    sequelize: {
      ...originalModule.sequelize,
      transaction: jest.fn().mockImplementation((callback) => {
        return callback({}); // Return empty transaction object
      }),
      models: {
        Survey: {
          findOne: jest.fn(),
          create: jest.fn().mockResolvedValue({ id: 1 })
        },
        Facility: {
          findOrCreate: jest.fn().mockResolvedValue([{ id: 1, update: jest.fn() }])
        }
      }
    }
  };
});

describe('DataImportService', () => {
  let service: DataImportService;
  let mockTransaction: jest.Mocked<Transaction>;

  beforeAll(async () => {
    // Initialize the service
    service = new DataImportService();
    
    // Create a mock transaction
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      // Add other required Transaction properties
    } as unknown as jest.Mocked<Transaction>;
    
    // Mock the transaction method to return our mock transaction
    (sequelize.transaction as jest.Mock).mockImplementation((callback) => {
      return callback(mockTransaction);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Close the database connection if needed
    await sequelize.close();
  });

  describe('createDefaultFacilityData', () => {
    it('should create a valid FacilityData object with all required fields', () => {
      // Use type assertion to access private method
      const facilityData = (service as any).createDefaultFacilityData();
      
      // Verify required fields exist
      expect(facilityData).toHaveProperty('productiveSectors');
      expect(facilityData).toHaveProperty('electricitySource');
      expect(facilityData).toHaveProperty('buildings');
      expect(facilityData).toHaveProperty('infrastructure');
      
      // Verify enum fields are either valid or null
      expect([null, ...Object.values(ElectricitySource)]).toContain(facilityData.electricitySource);
      
      // Verify infrastructure fields
      if (facilityData.infrastructure) {
        expect([null, ...Object.values(TransportAccess)]).toContain(facilityData.infrastructure.transportationAccess);
      }
    });
  });

  describe('transformSurveyData', () => {
    it('should transform raw survey data correctly', () => {
      const rawData = {
        _id: 'test-survey-123',
        _submission_time: '2023-01-01T00:00:00Z',
        facility_info: {
          electricity_source: 'solar',
          transportation_access: 'paved_road'
        },
        respondentId: 'respondent-123',
        responses: {},
        metadata: {}
      };

      const transformed = (service as any).transformSurveyData(rawData);
      
      // Verify transformed data structure
      expect(transformed).toMatchObject({
        externalId: 'test-survey-123',
        collectionDate: new Date('2023-01-01T00:00:00Z'),
        respondentId: 'respondent-123'
      });
      
      // Verify rawData is included
      expect(transformed.rawData).toBeDefined();
      expect(transformed.rawData.id).toBe('test-survey-123');
      
      // Verify facility data transformation
      expect(transformed.facilityData.electricitySource).toBe(ElectricitySource.SOLAR);
      expect(transformed.facilityData.infrastructure?.transportationAccess).toBe(TransportAccess.PAVED_ROAD);
    });
  });
});
