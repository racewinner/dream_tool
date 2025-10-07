const axios = require('axios');

async function debugSurveyDetail() {
  try {
    console.log('🔍 Debugging survey detail data extraction...\n');
    
    // Step 1: Get list of surveys
    console.log('📋 Step 1: Fetching survey list...');
    const surveysResponse = await axios.get('http://localhost:3001/api/surveys');
    const surveys = surveysResponse.data;
    
    console.log(`Found ${surveys.length} surveys`);
    
    if (surveys.length === 0) {
      console.log('❌ No surveys found. Import data first.');
      return;
    }
    
    // Step 2: Test survey detail endpoint for first survey
    const firstSurvey = surveys[0];
    console.log(`\n🧪 Step 2: Testing survey detail for ID ${firstSurvey.id} (External: ${firstSurvey.externalId})`);
    
    const detailResponse = await axios.get(`http://localhost:3001/api/surveys/${firstSurvey.id}`);
    const surveyDetail = detailResponse.data;
    
    console.log('\n📊 SURVEY DETAIL RESPONSE:');
    console.log('Basic Info:');
    console.log(`  - ID: ${surveyDetail.id}`);
    console.log(`  - External ID: ${surveyDetail.externalId}`);
    console.log(`  - Collection Date: ${surveyDetail.collectionDate}`);
    console.log(`  - Respondent: ${surveyDetail.respondentId}`);
    console.log(`  - Completeness: ${surveyDetail.completeness}%`);
    
    console.log('\nFacility Info:');
    console.log(`  - Facility Name: ${surveyDetail.facilityName || 'MISSING'}`);
    console.log(`  - Region: ${surveyDetail.region || 'MISSING'}`);
    console.log(`  - District: ${surveyDetail.district || 'MISSING'}`);
    console.log(`  - Facility Type: ${surveyDetail.facilityType || 'MISSING'}`);
    console.log(`  - GPS Coordinates: ${surveyDetail.latitude && surveyDetail.longitude ? 
      `${surveyDetail.latitude}, ${surveyDetail.longitude}` : 'MISSING'}`);
    
    console.log('\nInfrastructure & Operations:');
    console.log(`  - Ownership: ${surveyDetail.ownership || 'MISSING'}`);
    console.log(`  - Electricity Source: ${surveyDetail.electricitySource || 'MISSING'}`);
    console.log(`  - Catchment Population: ${surveyDetail.catchmentPopulation || 'MISSING'}`);
    console.log(`  - Water Access: ${surveyDetail.waterAccess !== undefined ? surveyDetail.waterAccess : 'MISSING'}`);
    console.log(`  - National Grid: ${surveyDetail.nationalGridAccess !== undefined ? surveyDetail.nationalGridAccess : 'MISSING'}`);
    
    console.log('\nStaff & Equipment:');
    console.log(`  - Support Staff: ${surveyDetail.supportStaff || 'MISSING'}`);
    console.log(`  - Technical Staff: ${surveyDetail.technicalStaff || 'MISSING'}`);
    console.log(`  - Equipment Count: ${surveyDetail.equipmentCount || 'MISSING'}`);
    console.log(`  - Equipment Details: ${surveyDetail.equipment ? 'Available' : 'MISSING'}`);
    
    console.log('\nCritical Needs:');
    console.log(`  - Critical Needs: ${Array.isArray(surveyDetail.criticalNeeds) ? 
      surveyDetail.criticalNeeds.length + ' items' : 'MISSING'}`);
    console.log(`  - Most Important Need: ${surveyDetail.mostImportantNeed || 'MISSING'}`);
    
    // Step 3: Check raw facilityData structure
    console.log('\n🔍 Step 3: Examining raw facilityData structure...');
    
    if (surveyDetail.facilityData) {
      const facilityData = typeof surveyDetail.facilityData === 'string' 
        ? JSON.parse(surveyDetail.facilityData) 
        : surveyDetail.facilityData;
      
      console.log(`Raw facilityData keys (${Object.keys(facilityData).length}):`, Object.keys(facilityData));
      
      // Check specific fields that might be missing
      const criticalFields = [
        'name', 'region', 'district', 'facilityType', 'latitude', 'longitude',
        'electricitySource', 'ownership', 'supportStaff', 'technicalStaff',
        'equipment', 'criticalNeeds', 'mostImportantNeed'
      ];
      
      console.log('\nField-by-field analysis:');
      criticalFields.forEach(field => {
        const value = facilityData[field];
        const status = value !== undefined && value !== null && value !== '' ? '✅' : '❌';
        console.log(`  ${status} ${field}: ${JSON.stringify(value)}`);
      });
      
      // Check nested structures
      if (facilityData.infrastructure) {
        console.log('\nInfrastructure data:');
        console.log(`  - Water Access: ${facilityData.infrastructure.waterAccess}`);
        console.log(`  - National Grid: ${facilityData.infrastructure.nationalGrid}`);
        console.log(`  - Transport Access: ${facilityData.infrastructure.transportationAccess}`);
      }
      
      if (Array.isArray(facilityData.equipment)) {
        console.log(`\nEquipment data: ${facilityData.equipment.length} items`);
        facilityData.equipment.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.name || 'Unnamed'} - ${item.powerRating || 0}W`);
        });
      }
      
    } else {
      console.log('❌ No facilityData found in survey detail response');
    }
    
    // Step 4: Check if the issue is in the backend transformation
    console.log('\n🔧 Step 4: Recommendations based on findings...');
    
    const missingFields = [];
    if (!surveyDetail.facilityName || surveyDetail.facilityName === 'Unknown Facility') missingFields.push('Facility Name');
    if (!surveyDetail.latitude || !surveyDetail.longitude) missingFields.push('GPS Coordinates');
    if (!surveyDetail.electricitySource) missingFields.push('Electricity Source');
    if (!surveyDetail.equipmentCount || surveyDetail.equipmentCount === 0) missingFields.push('Equipment Data');
    
    if (missingFields.length > 0) {
      console.log('❌ MISSING DATA DETECTED:');
      missingFields.forEach(field => console.log(`  - ${field}`));
      console.log('\n🔧 LIKELY CAUSES:');
      console.log('  1. KoboToolbox field mapping issues in dataCollectionProvider.ts');
      console.log('  2. Survey detail endpoint not extracting data correctly');
      console.log('  3. Raw KoboToolbox data structure different than expected');
      console.log('\n💡 NEXT STEPS:');
      console.log('  1. Check backend logs during import for transformation warnings');
      console.log('  2. Verify KoboToolbox field names match extraction logic');
      console.log('  3. Update field mappings in dataCollectionProvider.ts');
    } else {
      console.log('✅ All critical data fields are present!');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugSurveyDetail();
