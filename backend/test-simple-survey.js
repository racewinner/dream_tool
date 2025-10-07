const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

const Survey = sequelize.define('Survey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  externalId: { type: DataTypes.STRING },
  facilityData: { type: DataTypes.JSONB }
}, { tableName: 'surveys', timestamps: true });

async function testSimpleSurvey() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Get one survey to test data extraction
    const survey = await Survey.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    if (!survey) {
      console.log('❌ No surveys found');
      return;
    }
    
    console.log(`🔍 Testing survey ID: ${survey.id}`);
    
    // Test facilityData extraction (only column that exists)
    let facilityData = {};
    
    if (survey.facilityData) {
      facilityData = typeof survey.facilityData === 'string' 
        ? JSON.parse(survey.facilityData) : survey.facilityData;
    }
    
    console.log(`📊 facilityData keys (${Object.keys(facilityData).length}):`, Object.keys(facilityData).slice(0, 10));
    
    // Extract facility info using correct data source
    const facilityInfo = {
      name: facilityData?.name || 'Unknown Facility',
      region: facilityData?.region || 'Unknown',
      district: facilityData?.district || 'Unknown',
      facilityType: facilityData?.facilityType || facilityData?.subsectorActivities?.[0] || 'Health Post',
      latitude: facilityData?.latitude || null,
      longitude: facilityData?.longitude || null,
      ownership: facilityData?.ownership || null,
      electricitySource: facilityData?.electricitySource || null
    };
    
    console.log('🎯 Extracted facility info:');
    console.log(`  - Name: ${facilityInfo.name}`);
    console.log(`  - Region: ${facilityInfo.region}`);
    console.log(`  - District: ${facilityInfo.district}`);
    console.log(`  - Type: ${facilityInfo.facilityType}`);
    console.log(`  - Coordinates: ${facilityInfo.latitude && facilityInfo.longitude ? 
      `${facilityInfo.latitude}, ${facilityInfo.longitude}` : 'Not available'}`);
    console.log(`  - Ownership: ${facilityInfo.ownership}`);
    console.log(`  - Electricity: ${facilityInfo.electricitySource}`);
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleSurvey();
