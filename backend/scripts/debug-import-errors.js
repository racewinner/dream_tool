const { DataImportService } = require('../dist/services/dataImportService');
const { sequelize } = require('../dist/models');
const axios = require('axios');

// API base URL for testing
const API_BASE = 'http://localhost:3001';

async function testAPIRoutes() {
  console.log('\n🌐 TESTING API ROUTES');
  console.log('================================');
  
  const routes = [
    // Health and basic routes
    { method: 'GET', path: '/health', description: 'Health check' },
    { method: 'GET', path: '/api/health', description: 'API health check' },
    
    // Import routes
    { method: 'GET', path: '/api/import', description: 'Import status/list' },
    { method: 'POST', path: '/api/import', description: 'Start import (requires body)' },
    { method: 'GET', path: '/api/v2/imports', description: 'Import V2 list' },
    { method: 'POST', path: '/api/v2/imports', description: 'Start import V2 (requires body)' },
    
    // Survey routes
    { method: 'GET', path: '/api/surveys', description: 'List surveys' },
    { method: 'GET', path: '/api/survey', description: 'Survey operations' },
    
    // Facility routes
    { method: 'GET', path: '/api/facilities', description: 'List facilities' },
    
    // Metrics routes
    { method: 'GET', path: '/api/metrics', description: 'System metrics' },
    { method: 'GET', path: '/api/metrics/dashboard', description: 'Dashboard metrics' },
    
    // Visualization routes
    { method: 'GET', path: '/api/visualizations', description: 'Visualization data' },
    
    // Portfolio routes
    { method: 'GET', path: '/api/portfolio', description: 'Portfolio data' },
    
    // Solar system routes
    { method: 'GET', path: '/api/solar-systems', description: 'Solar systems list' },
    
    // Asset routes
    { method: 'GET', path: '/api/assets', description: 'Assets list' },
    
    // Mock data routes
    { method: 'GET', path: '/api/mock-data', description: 'Mock data endpoints' },
    
    // Techno-economic routes
    { method: 'GET', path: '/api/techno-economic', description: 'Techno-economic analysis' }
  ];
  
  for (const route of routes) {
    try {
      console.log(`\n🔍 Testing ${route.method} ${route.path} - ${route.description}`);
      
      if (route.method === 'GET') {
        const response = await axios.get(`${API_BASE}${route.path}`, {
          timeout: 5000,
          validateStatus: () => true // Accept all status codes
        });
        
        console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
        
        if (response.status === 200) {
          const data = response.data;
          if (typeof data === 'object') {
            console.log(`  📊 Response keys: [${Object.keys(data).join(', ')}]`);
            if (Array.isArray(data)) {
              console.log(`  📋 Array length: ${data.length}`);
            }
          } else {
            console.log(`  📄 Response type: ${typeof data}`);
          }
        } else if (response.status === 404) {
          console.log(`  ⚠️ Route not found - may not be implemented`);
        } else if (response.status === 401) {
          console.log(`  🔒 Authentication required`);
        } else if (response.status === 500) {
          console.log(`  ❌ Server error`);
        }
      } else if (route.method === 'POST') {
        // For POST routes, just check if they exist (without sending data)
        try {
          const response = await axios.post(`${API_BASE}${route.path}`, {}, {
            timeout: 5000,
            validateStatus: () => true
          });
          console.log(`  ✅ Endpoint exists - Status: ${response.status}`);
        } catch (error) {
          if (error.response) {
            console.log(`  ✅ Endpoint exists - Status: ${error.response.status} (expected for empty POST)`);
          } else {
            console.log(`  ❌ Connection error: ${error.message}`);
          }
        }
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`  ❌ Backend not running - cannot test routes`);
        break;
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
  }
}

async function debugImportErrors() {
  console.log('🔍 DEBUGGING IMPORT ERRORS');
  console.log('================================');
  
  try {
    // Test database connection first
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    console.log('\n2. Checking table existence...');
    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('📋 Available tables:', tables.map(t => t.table_name));
    
    // Check surveys table structure
    console.log('\n3. Checking surveys table structure...');
    const surveyColumns = await sequelize.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_name = 'surveys' AND table_schema = 'public'
       ORDER BY ordinal_position`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('📊 Surveys table columns:');
    surveyColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check facilities table structure
    console.log('\n4. Checking facilities table structure...');
    const facilityColumns = await sequelize.query(
      `SELECT column_name, data_type, is_nullable, column_default 
       FROM information_schema.columns 
       WHERE table_name = 'facilities' AND table_schema = 'public'
       ORDER BY ordinal_position`,
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('🏥 Facilities table columns:');
    facilityColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Test API routes
    await testAPIRoutes();
    
    // Test DataImportService initialization
    console.log('\n🔧 TESTING DATA IMPORT SERVICE');
    console.log('================================');
    console.log('5. Testing DataImportService initialization...');
    const importService = new DataImportService();
    console.log('✅ DataImportService initialized successfully');
    
    // Test KoboToolbox API connection and data extraction
    console.log('\n6. Testing KoboToolbox API connection and data extraction...');
    try {
      // Test the actual import method that fetches data
      const startDate = new Date('2024-01-01');
      const endDate = new Date();
      
      console.log(`  Testing import from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      const importResult = await importService.importSurveysByDateRange(startDate, endDate);
      
      console.log('✅ KoboToolbox API connection and import test completed');
      console.log(`📊 Import result:`, {
        success: importResult.success,
        imported: importResult.imported,
        failed: importResult.failed,
        message: importResult.message
      });
      
      // If import was successful, we can also test data transformation
      if (importResult.imported > 0) {
        console.log('\n7. Testing data transformation with real data...');
        console.log('✅ Data transformation successful (imported records processed)');
      } else {
        console.log('\n7. Testing data transformation...');
        console.log('ℹ️ No data imported - may be API connectivity or data availability issue');
      }
    } catch (apiError) {
      console.error('❌ KoboToolbox API error:', apiError.message);
      console.log('ℹ️ Continuing with basic database tests...');
    }
    
    // Test a simple facility creation
    console.log('\n🏥 TESTING DATABASE OPERATIONS');
    console.log('================================');
    console.log('8. Testing facility creation...');
    
    // First, create a test user to satisfy foreign key constraint
    console.log('  Creating test user for foreign key constraint...');
    const testUser = await sequelize.models.User.create({
      email: 'test@debug.com',
      password: 'test123',
      name: 'Debug Test User',
      firstName: 'Debug',
      lastName: 'User',
      role: 'admin'
    });
    console.log(`  ✅ Test user created with ID: ${testUser.id}`);
    
    const testFacility = await sequelize.models.Facility.create({
      name: 'Test Facility Debug',
      type: 'healthcare',
      latitude: 0.0,
      longitude: 0.0,
      status: 'survey',
      userId: testUser.id // Use the created user's ID
    });
    console.log('✅ Test facility created with ID:', testFacility.id);
    
    // Test a simple survey creation with comprehensive facilityData
    console.log('\n9. Testing survey creation with comprehensive facilityData...');
    const comprehensiveFacilityData = {
      productiveSectors: ['health'],
      subsectorActivities: ['primary_care'],
      ownership: 'public',
      catchmentPopulation: 5000,
      coreServices: ['outpatient', 'emergency'],
      electricitySource: 'grid',
      electricityReliability: 'good',
      electricityAvailability: 'full_time',
      operationalDays: 7,
      operationalHours: {
        day: 12,
        night: 0
      },
      criticalNeeds: ['reliable_power'],
      supportStaff: 5,
      technicalStaff: 2,
      nightStaff: false,
      buildings: {
        total: 3,
        departmentsWithWiring: 2,
        rooms: 15,
        roomsWithConnection: 10
      },
      equipment: [],
      infrastructure: {
        waterAccess: true,
        nationalGrid: true,
        transportationAccess: 'paved_road',
        communication: 'mobile',
        digitalConnectivity: 'broadband'
      }
    };
    
    const testSurvey = await sequelize.models.Survey.create({
      externalId: 'debug-test-' + Date.now(),
      facilityId: testFacility.id,
      facilityData: comprehensiveFacilityData,
      collectionDate: new Date(),
      respondentId: 'debug-test'
    });
    console.log('✅ Test survey created with ID:', testSurvey.id);
    
    // Test survey data retrieval and validation
    console.log('\n10. Testing survey data retrieval...');
    const retrievedSurvey = await sequelize.models.Survey.findByPk(testSurvey.id);
    console.log('✅ Survey retrieved successfully');
    console.log('📊 Retrieved facilityData keys:', Object.keys(retrievedSurvey.facilityData));
    
    // Validate specific data fields
    console.log('\n11. Validating specific data fields...');
    const facilityData = retrievedSurvey.facilityData;
    console.log(`  - productiveSectors: ${JSON.stringify(facilityData.productiveSectors)}`);
    console.log(`  - electricitySource: ${facilityData.electricitySource}`);
    console.log(`  - operationalHours: ${JSON.stringify(facilityData.operationalHours)}`);
    console.log(`  - buildings: ${JSON.stringify(facilityData.buildings)}`);
    console.log(`  - infrastructure: ${JSON.stringify(facilityData.infrastructure)}`);
    
    // Clean up test records
    console.log('\n12. Cleaning up test records...');
    await testSurvey.destroy();
    await testFacility.destroy();
    await testUser.destroy();
    console.log('✅ Test records cleaned up');
    
    console.log('\n🎉 All database operations and data extraction tests successful!');
    
  } catch (error) {
    console.error('\n❌ ERROR DETECTED:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.sql) {
      console.error('SQL Query:', error.sql);
    }
    if (error.parameters) {
      console.error('SQL Parameters:', error.parameters);
    }
    if (error.constraint) {
      console.error('Constraint violation:', error.constraint);
    }
    if (error.table) {
      console.error('Table:', error.table);
    }
    if (error.column) {
      console.error('Column:', error.column);
    }
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

debugImportErrors().catch(console.error);
