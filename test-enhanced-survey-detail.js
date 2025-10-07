const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

const Survey = sequelize.define('Survey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  externalId: { type: DataTypes.STRING },
  facilityData: { type: DataTypes.JSONB },
  rawData: { type: DataTypes.JSONB },
  submissionDate: { type: DataTypes.DATE }
}, { tableName: 'surveys', timestamps: true });

async function testEnhancedSurveyDetail() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Get the first survey to test with
    const survey = await Survey.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    if (!survey) {
      console.log('❌ No surveys found in database');
      return;
    }
    
    console.log(`🔍 Testing survey ID: ${survey.id} (External ID: ${survey.externalId})`);
    
    // Test the data extraction logic locally (same as endpoint)
    let facilityData = {};
    let rawData = {};
    
    try {
      if (survey.facilityData) {
        facilityData = typeof survey.facilityData === 'string' 
          ? JSON.parse(survey.facilityData) : survey.facilityData;
      }
      
      if (survey.rawData) {
        rawData = typeof survey.rawData === 'string' 
          ? JSON.parse(survey.rawData) : survey.rawData;
      }
      
      console.log('📊 Data availability:');
      console.log(`  - facilityData keys: ${Object.keys(facilityData).length}`);
      console.log(`  - rawData keys: ${Object.keys(rawData).length}`);
      
      // Test comprehensive facility information extraction
      const facilityInfo = {
        // Basic facility information
        name: facilityData?.name || rawData?.Name_HF || rawData?.facility_name || 'Unknown Facility',
        region: facilityData?.region || rawData?.Q3_Region || rawData?.region || 'Unknown',
        district: facilityData?.district || rawData?.Q9_District || rawData?.district || 'Unknown', 
        facilityType: facilityData?.facilityType || facilityData?.subsectorActivities?.[0] || 'Health Post',
        
        // GPS coordinates for mapping functionality
        latitude: facilityData?.latitude || (rawData?._geolocation?.[0] ? parseFloat(rawData._geolocation[0]) : null),
        longitude: facilityData?.longitude || (rawData?._geolocation?.[1] ? parseFloat(rawData._geolocation[1]) : null),
        
        // Additional facility details
        ownership: facilityData?.ownership || null,
        electricitySource: facilityData?.electricitySource || null,
        catchmentPopulation: facilityData?.catchmentPopulation || null,
        operationalDays: facilityData?.operationalDays || null,
        numberOfBeds: facilityData?.numberOfBeds || null,
        
        // Infrastructure access
        waterAccess: facilityData?.infrastructure?.waterAccess || false,
        nationalGridAccess: facilityData?.infrastructure?.nationalGrid || false,
        transportAccess: facilityData?.infrastructure?.transportationAccess || null,
        
        // Staff information
        supportStaff: facilityData?.supportStaff || null,
        technicalStaff: facilityData?.technicalStaff || null,
        nightStaff: facilityData?.nightStaff || false,
        
        // Equipment count
        equipmentCount: Array.isArray(facilityData?.equipment) ? facilityData.equipment.length : 0,
        
        // Critical needs
        criticalNeeds: Array.isArray(facilityData?.criticalNeeds) ? facilityData.criticalNeeds : [],
        mostImportantNeed: facilityData?.mostImportantNeed || null
      };
      
      console.log('🎯 Enhanced facility info extracted:');
      console.log('  Basic Info:');
      console.log(`    - Name: ${facilityInfo.name}`);
      console.log(`    - Region: ${facilityInfo.region}`);
      console.log(`    - District: ${facilityInfo.district}`);
      console.log(`    - Facility Type: ${facilityInfo.facilityType}`);
      
      console.log('  GPS Coordinates:');
      if (facilityInfo.latitude && facilityInfo.longitude) {
        console.log(`    - Coordinates: ${facilityInfo.latitude}, ${facilityInfo.longitude}`);
      } else {
        console.log('    - Coordinates: Not available');
        // Try to find coordinates in different formats
        console.log('    - Checking rawData._geolocation:', rawData?._geolocation);
        console.log('    - Checking facilityData.latitude/longitude:', { 
          lat: facilityData?.latitude, 
          lng: facilityData?.longitude 
        });
      }
      
      console.log('  Additional Details:');
      console.log(`    - Ownership: ${facilityInfo.ownership}`);
      console.log(`    - Electricity Source: ${facilityInfo.electricitySource}`);
      console.log(`    - Equipment Count: ${facilityInfo.equipmentCount}`);
      console.log(`    - Staff (Support/Technical): ${facilityInfo.supportStaff}/${facilityInfo.technicalStaff}`);
      console.log(`    - Water Access: ${facilityInfo.waterAccess}`);
      console.log(`    - Critical Needs: ${facilityInfo.criticalNeeds.length} items`);
      
      // Test API endpoint by making HTTP request
      console.log('\n🌐 Testing actual API endpoint...');
      const response = await fetch(`http://localhost:3001/api/surveys/${survey.id}`, {
        headers: {
          'Authorization': 'Bearer fake-test-token' // This will fail auth but should show the endpoint structure
        }
      });
      
      if (response.status === 401) {
        console.log('⚠️  Expected 401 (no valid auth token), but endpoint is reachable');
      } else {
        const data = await response.json();
        console.log('✅ API Response received:', JSON.stringify(data, null, 2));
      }
      
    } catch (parseError) {
      console.error('❌ Error parsing survey data:', parseError.message);
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEnhancedSurveyDetail();
