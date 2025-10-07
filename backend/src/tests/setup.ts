import { config } from '../config';
import { Redis } from 'ioredis';
import { Sequelize } from 'sequelize';
import { User } from '../models/user';
import { Facility } from '../models/facility';
import { Survey } from '../models/survey';
import { TechnoEconomicAnalysis } from '../models/techno-economic-analysis';

// Test database configuration
const testConfig = {
  ...config.database,
  database: `${config.database.database}_test`
};

// Test Redis configuration
const testRedis = new Redis({
  ...config.redis,
  prefix: 'test:'
});

// Test database connection
const testDb = new Sequelize({
  ...testConfig,
  logging: false
});

// Test models
const testModels = {
  User: User.init(testDb),
  Facility: Facility.init(testDb),
  Survey: Survey.init(testDb),
  TechnoEconomicAnalysis: TechnoEconomicAnalysis.init(testDb)
};

// Helper functions
export const setupTestDatabase = async () => {
  try {
    // Drop existing database
    await testDb.drop({ cascade: true });
    
    // Create tables
    await testDb.sync({ force: true });

    // Create test data
    await createTestData();
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

export const clearTestDatabase = async () => {
  try {
    // Clear Redis
    await testRedis.flushall();
    
    // Drop tables
    await testDb.drop({ cascade: true });
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
};

export const createTestData = async () => {
  try {
    // Create test users
    const admin = await testModels.User.create({
      email: 'admin@test.com',
      password: 'test123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    });

    const user = await testModels.User.create({
      email: 'user@test.com',
      password: 'test123',
      role: 'user',
      firstName: 'Regular',
      lastName: 'User'
    });

    // Create test facilities
    const facility = await testModels.Facility.create({
      name: 'Test Facility',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      userId: admin.id
    });

    // Create test survey
    const survey = await testModels.Survey.create({
      name: 'Test Survey',
      description: 'Test survey data',
      facilityId: facility.id,
      userId: admin.id,
      data: {
        equipment: [
          { type: 'PV', capacity: 100 },
          { type: 'Battery', capacity: 50 }
        ]
      }
    });

    // Create test analysis
    await testModels.TechnoEconomicAnalysis.create({
      facilityId: facility.id,
      dailyUsage: 100,
      peakHours: 8,
      batteryAutonomyFactor: 0.8,
      batteryDepthOfDischarge: 0.8,
      batteryType: 'lithium',
      inverterEfficiency: 0.95,
      costingMethod: 'perWatt',
      panelCostPerWatt: 0.5,
      panelCostPerKw: 500,
      userId: admin.id
    });

    return {
      admin,
      user,
      facility,
      survey
    };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
};

export const getTestToken = async (user: any) => {
  try {
    const token = await testModels.User.generateToken(user);
    return token;
  } catch (error) {
    console.error('Error generating test token:', error);
    throw error;
  }
};

export const setupTestServer = async () => {
  try {
    // Initialize database
    await setupTestDatabase();

    // Return test utilities
    return {
      db: testDb,
      models: testModels,
      redis: testRedis,
      clear: clearTestDatabase
    };
  } catch (error) {
    console.error('Error setting up test server:', error);
    throw error;
  }
};
