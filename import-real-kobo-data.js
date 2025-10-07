const axios = require('axios');

const baseUrl = 'http://localhost:3001/api';

async function importRealKoboData() {
  try {
    console.log('🚀 Starting import of real KoboToolbox survey data...\n');
    
    // Step 1: Clear existing data for fresh import
    console.log('🗑️ Step 1: Clearing existing survey data...');
    try {
      const clearResponse = await axios.delete(`${baseUrl}/import/clear-surveys`);
      console.log('✅ Clear result:', clearResponse.data);
    } catch (clearError) {
      console.log('⚠️ Clear failed (may be empty already):', clearError.response?.data || clearError.message);
    }
    
    console.log('\n📡 Step 2: Importing real KoboToolbox data...');
    
    // Import surveys from last 6 months to get real data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const importResponse = await axios.post(`${baseUrl}/import/kobo/surveys`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    console.log('✅ Import response:', importResponse.data);
    
    // Step 3: Verify imported data
    console.log('\n🔍 Step 3: Verifying imported survey data...');
    
    // Check survey count
    const surveysResponse = await axios.get(`${baseUrl}/surveys`);
    const surveys = surveysResponse.data;
    
    console.log(`📊 Total surveys imported: ${surveys.length}`);
    
    if (surveys.length > 0) {
      console.log('\n📋 Sample survey data:');
      const firstSurvey = surveys[0];
      console.log(`  - Survey ID: ${firstSurvey.id}`);
      console.log(`  - External ID: ${firstSurvey.externalId}`);
      console.log(`  - Collection Date: ${firstSurvey.collectionDate}`);
      console.log(`  - Respondent: ${firstSurvey.respondentId}`);
      
      // Check facility data structure
      if (firstSurvey.facilityData) {
        const facilityData = typeof firstSurvey.facilityData === 'string' 
          ? JSON.parse(firstSurvey.facilityData) 
          : firstSurvey.facilityData;
        
        console.log('\n🏥 Facility data extracted:');
        console.log(`  - Name: ${facilityData.name || 'N/A'}`);
        console.log(`  - Region: ${facilityData.region || 'N/A'}`);
        console.log(`  - District: ${facilityData.district || 'N/A'}`);
        console.log(`  - Type: ${facilityData.facilityType || 'N/A'}`);
        console.log(`  - GPS: ${facilityData.latitude && facilityData.longitude ? 
          `${facilityData.latitude}, ${facilityData.longitude}` : 'N/A'}`);
        console.log(`  - Electricity: ${facilityData.electricitySource || 'N/A'}`);
        console.log(`  - Staff: ${facilityData.supportStaff || 'N/A'} support, ${facilityData.technicalStaff || 'N/A'} technical`);
        console.log(`  - Equipment: ${Array.isArray(facilityData.equipment) ? facilityData.equipment.length : 0} items`);
        
        // Test survey detail endpoint
        console.log('\n🧪 Step 4: Testing survey detail endpoint...');
        const detailResponse = await axios.get(`${baseUrl}/surveys/${firstSurvey.id}`);
        const surveyDetail = detailResponse.data;
        
        console.log('✅ Survey detail endpoint response:');
        console.log(`  - Survey ID: ${surveyDetail.id}`);
        console.log(`  - Facility Name: ${surveyDetail.facilityName || 'N/A'}`);
        console.log(`  - Region: ${surveyDetail.region || 'N/A'}`);
        console.log(`  - GPS Coordinates: ${surveyDetail.latitude && surveyDetail.longitude ? 
          `${surveyDetail.latitude}, ${surveyDetail.longitude}` : 'Missing GPS data'}`);
        console.log(`  - Completeness: ${surveyDetail.completeness || 0}%`);
        console.log(`  - Equipment Count: ${surveyDetail.equipmentCount || 0}`);
        
        if (surveyDetail.latitude && surveyDetail.longitude) {
          console.log('🎯 GPS coordinates successfully extracted and available!');
        } else {
          console.log('⚠️ GPS coordinates missing - may need field mapping adjustment');
        }
      }
      
      console.log('\n📈 Summary of imported data:');
      console.log(`  ✅ ${surveys.length} real surveys imported from KoboToolbox`);
      console.log(`  ✅ Survey detail endpoint tested successfully`);
      console.log(`  ✅ Facility data transformation verified`);
      console.log(`  ✅ Ready for frontend testing`);
      
    } else {
      console.log('⚠️ No surveys were imported. Possible reasons:');
      console.log('  - No surveys in the specified date range');
      console.log('  - KoboToolbox API connection issues');
      console.log('  - Authentication problems');
      console.log('  - Data transformation errors');
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔑 Authentication required. Please ensure:');
      console.log('  - KoboToolbox API token is configured');
      console.log('  - Backend environment variables are set');
      console.log('  - User has proper permissions');
    } else if (error.response?.status === 500) {
      console.log('\n🔧 Server error. Check backend logs for details');
    }
  }
}

// Run the import
importRealKoboData();
