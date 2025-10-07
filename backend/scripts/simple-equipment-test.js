// Simple script to test equipment data preservation
require('dotenv').config();

// Mock survey data with equipment
const mockSurvey = {
  id: "test_survey_123",
  externalId: "test_survey_123",
  facilityName: "Test Facility",
  facilityData: {
    equipment: [
      {
        id: "equip1",
        name: "Ultrasound Machine",
        quantity: 2,
        hoursPerDay: 8,
        condition: "good"
      },
      {
        id: "equip2",
        name: "X-Ray Machine",
        quantity: 1,
        hoursPerDay: 4,
        condition: "fair"
      }
    ]
  }
};

async function testEquipmentPreservation() {
  console.log('🧪 Testing equipment data preservation');
  
  try {
    // Load DataImportService
    const { DataImportService } = require('../dist/services/dataImportService');
    const importService = new DataImportService();
    console.log('✅ Import service created');

    // Access private transformSurveyData method
    // This is a hack for testing purposes only
    const transformMethod = importService['transformSurveyData'].bind(importService);
    
    // Transform the mock survey data
    console.log('Original equipment items:', mockSurvey.facilityData.equipment.length);
    
    const transformedData = transformMethod(mockSurvey);
    
    console.log('Transformed equipment items:', 
      transformedData.facilityData.equipment ? 
      transformedData.facilityData.equipment.length : 'none');
    
    if (transformedData.facilityData.equipment && 
        transformedData.facilityData.equipment.length === mockSurvey.facilityData.equipment.length) {
      console.log('✅ Equipment data preserved successfully!');
      console.log('Sample equipment:', JSON.stringify(transformedData.facilityData.equipment[0], null, 2));
    } else {
      console.error('❌ Equipment data was not preserved correctly');
      console.log('Original:', JSON.stringify(mockSurvey.facilityData.equipment, null, 2));
      console.log('Transformed:', JSON.stringify(transformedData.facilityData.equipment, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testEquipmentPreservation();
