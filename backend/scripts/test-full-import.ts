console.log('🔍 Script test-full-import.ts is starting...');

import { DataImportService } from '../src/services/dataImportService';
import { ExternalDataCollectionProvider } from '../src/services/providers/dataCollectionProvider';
import { sequelize } from '../src/models';
import { FacilityData } from '../src/models/survey';
import { ImportSummary } from '../src/types/import';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}

// Extend Sequelize Model type
declare module 'sequelize' {
  interface Model {
    id?: number | string;
    name?: string;
    type?: string;
    external_id?: string;
    collection_date?: Date;
    respondent_id?: string;
    facilityId?: number | string;
    Surveys?: Array<{
      id?: number | string;
      external_id?: string;
      collection_date?: Date;
      respondent_id?: string;
    }>;
  }
}

async function testFullImport() {
  console.log('🚀 Starting full import test...');
  
  try {
    console.log('1. Initializing services...');
    // Initialize the data provider and import service
    console.log('   - Creating ExternalDataCollectionProvider...');
    const dataProvider = new ExternalDataCollectionProvider();
    console.log('   - Creating DataImportService...');
    const importService = new DataImportService();
    
    // Test connection to the database
    console.log('\n2. Testing database connection...');
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      throw new Error('Database connection failed');
    }
    
    // Create minimal test data that matches the expected interface
    console.log('\n3. Creating test data...');
    const testData = {
      externalId: 'kobo-test-' + Date.now(),
      collectionDate: new Date(),
      respondentId: 'test-respondent-' + Math.floor(Math.random() * 1000),
      facilityData: {
        name: 'Test Health Center ' + Math.floor(Math.random() * 1000),
        type: 'health_center',
        ownership: 'public',
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [36.8219, -1.2921],
          address: '123 Test Street',
          region: 'Test Region',
          country: 'Kenya',
          gpsCoordinates: '-1.2921,36.8219'
        },
        infrastructure: {
          waterAccess: true,
          nationalGrid: true,
          transportationAccess: 'paved_road',
          communication: 'mobile_network',
          digitalConnectivity: 'mobile_data'
        },
        equipment: [
          {
            name: 'fridge',
            powerRating: 150,
            quantity: 1,
            hoursPerDay: 8,
            hoursPerNight: 0,
            timeOfDay: 'day',
            weeklyUsage: 5
          }
        ]
      },
      rawData: {
        _id: 'kobo-test-' + Date.now(),
        end: new Date().toISOString(),
        gps: '-1.2921 36.8219',
        start: new Date().toISOString(),
        _version_: 'v1',
        _submission_time: new Date().toISOString(),
        facility_name: 'Test Health Center',
        facility_type: 'health_center',
        ownership: 'public',
        catchment_population: '1500',
        core_services: 'healthcare,emergency',
        electricity_source: 'grid',
        electricity_reliability: 'unreliable',
        electricity_availability: 'partial',
        operational_days: '7',
        operational_hours_day: '12',
        operational_hours_night: '8',
        critical_needs: 'refrigeration,lighting',
        support_staff: '5',
        technical_staff: '2',
        night_staff: 'yes',
        buildings_total: '3',
        departments_with_wiring: '2',
        rooms: '15',
        rooms_with_connection: '10',
        facility_equipment_types: 'fridge,incubator,microscope',
        facility_equipment_count: '5',
        water_access: 'yes',
        national_grid: 'yes',
        transportation_access: 'paved_road',
        communication: 'mobile_network',
        digital_connectivity: 'mobile_data',
        productive_sectors: 'health,education',
        subsector_activities: 'primary_healthcare,primary_education',
        respondent_name: 'Test User',
        respondent_phone: '+254700000000',
        responses: {
          facility_name: 'Test Health Center',
          latitude: '-1.2921',
          longitude: '36.8219'
        }
      }
    };
    
    console.log('🔄 Starting import process...');
    
    console.log('\n4. Starting import process...');
    console.log(`   - Using survey ID: ${testData.externalId}`);
    
    try {
      console.log('   - Calling importService.importSurveyById()...');
      const result: ImportSummary = await importService.importSurveyById(testData.externalId);
      
      console.log('\n✅ Import completed successfully');
      console.log('📊 Import result:', {
        success: result.success,
        imported: result.imported,
        failed: result.failed,
        message: result.message
      });
      
      // Verify the data was imported correctly if the import was successful
      if (result.success && result.imported > 0) {
        console.log('🔍 Verifying imported data...');
        
        // Check if facility was created
        const facility = await sequelize.models.Facility.findOne({
          where: { name: testData.facilityData.name },
          include: [{
            model: sequelize.models.Survey,
            where: { external_id: testData.externalId }
          }]
        });
        
        if (facility) {
          console.log('✅ Facility created successfully:', {
            id: facility.id,
            name: facility.name,
            type: facility.type,
            surveyCount: facility.Surveys?.length || 0
          });
          
          if (facility.Surveys && facility.Surveys.length > 0) {
            const survey = facility.Surveys[0];
            console.log('📝 Survey data:', {
              id: survey.id,
              externalId: survey.external_id,
              collectionDate: survey.collection_date,
              respondentId: survey.respondent_id
            });
          }
        } else {
          console.warn('⚠️ Facility not found after import');
        }
      }
    }
    
    return { success: result };
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  console.log('🔍 Script test-full-import.ts has started execution');
  testFullImport()
  .then(() => console.log('\n✨ Full import test completed!'))
  .catch(error => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('🔍 Script test-full-import.ts has completed execution');
  });
}

export { testFullImport };
