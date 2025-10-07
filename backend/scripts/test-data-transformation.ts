import { ExternalDataCollectionProvider } from '../src/services/providers/dataCollectionProvider';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function testDataTransformation() {
  console.log('🚀 Testing data transformation...');
  
  // Sample flat data structure that matches what we get from the API
  const sampleFlatData = [{
    _id: 'kobo-test-123',
    end: '2025-07-29T10:48:44.065Z',
    gps: '-1.2921 36.8219',
    start: '2025-07-29T10:48:44.065Z',
    _version_: 'v1',
    _submission_time: '2025-07-29T10:48:44.064Z',
    
    // Facility information
    facility_name: 'Test Health Center',  // This will be used by getOrCreateFacility
    facility_type: 'health_center',
    ownership: 'public',
    catchment_population: '1500',
    core_services: 'healthcare,emergency',
    
    // Electricity information
    electricity_source: 'grid',
    electricity_reliability: 'unreliable',
    electricity_availability: 'partial',
    operational_days: '7',
    operational_hours_day: '12',
    operational_hours_night: '8',
    critical_needs: 'refrigeration,lighting',
    
    // Staff information
    support_staff: '5',
    technical_staff: '2',
    night_staff: 'yes',
    
    // Building information
    buildings_total: '3',
    departments_with_wiring: '2',
    rooms: '15',
    rooms_with_connection: '10',
    
    // Equipment information
    facility_equipment_types: 'fridge,incubator,microscope',
    facility_equipment_count: '5',
    
    // Infrastructure
    water_access: 'yes',
    national_grid: 'yes',
    transportation_access: 'paved_road',
    communication: 'mobile_network',
    digital_connectivity: 'mobile_data',
    
    // Other fields
    productive_sectors: 'health,education',
    subsector_activities: 'primary_healthcare,primary_education',
    respondent_name: 'Test User',
    respondent_phone: '+254700000000'
  }];

  // Create a test instance of the provider
  const provider = new ExternalDataCollectionProvider();
  
  try {
    console.log('📋 Input data:');
    console.log(JSON.stringify(sampleFlatData[0], null, 2));
    
    // Transform the data
    console.log('\n🔄 Transforming data...');
    const transformedData = (provider as any).transformSurveyData(sampleFlatData);
    
    // Output the transformed data
    console.log('\n✅ Transformed data:');
    const output = {
      input: sampleFlatData[0],
      output: transformedData[0]
    };
    
    console.log(JSON.stringify(output, null, 2));
    
    // Save to file for easier inspection
    const outputPath = join(__dirname, 'test-data-transformation-output.json');
    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Test output saved to: ${outputPath}`);
    
    // Verify facility name is properly set in rawData.responses.facility_name
    const facilityName = transformedData[0]?.rawData?.responses?.facility_name;
    if (facilityName === sampleFlatData[0].facility_name) {
      console.log('✅ Facility name correctly preserved in rawData.responses.facility_name');
    } else {
      console.error('❌ Facility name not properly set in rawData.responses.facility_name');
      console.log(`Expected: ${sampleFlatData[0].facility_name}, Got: ${facilityName}`);
    }
    
    return transformedData[0];
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testDataTransformation()
    .then(() => console.log('\n✨ Test completed successfully!'))
    .catch((error) => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
}

export { testDataTransformation };
