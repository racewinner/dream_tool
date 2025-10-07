const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres',
  port: 5432,
  dialect: 'postgres',
  logging: false
});

const Survey = sequelize.define('Survey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  externalId: { type: DataTypes.STRING },
  rawData: { type: DataTypes.JSONB },
  facilityData: { type: DataTypes.JSONB },
  facility_data: { type: DataTypes.JSONB },
}, { tableName: 'surveys', timestamps: true });

async function debugSurveyData() {
  try {
    await sequelize.authenticate();
    console.log('=== SURVEY DATA DEBUG ===');
    
    // Get first survey
    const survey = await Survey.findOne({ 
      attributes: ['id', 'externalId', 'rawData', 'facilityData', 'facility_data'],
      raw: true 
    });
    
    if (!survey) {
      console.log('No surveys found');
      return;
    }
    
    console.log('Survey External ID:', survey.externalId);
    console.log('Has rawData:', !!survey.rawData);
    console.log('Has facilityData:', !!survey.facilityData);
    console.log('Has facility_data:', !!survey.facility_data);
    
    // Check rawData structure
    if (survey.rawData) {
      const rawData = survey.rawData;
      console.log('\n=== RAW DATA ANALYSIS ===');
      console.log('Type:', typeof rawData);
      
      if (typeof rawData === 'object') {
        const keys = Object.keys(rawData);
        console.log('Total keys:', keys.length);
        console.log('First 20 keys:', keys.slice(0, 20));
        
        // Look for facility name patterns
        const facilityKeys = keys.filter(k => 
          k.toLowerCase().includes('name') || 
          k.toLowerCase().includes('facility') ||
          k.toLowerCase().includes('hf') ||
          k.includes('Name') ||
          k.includes('HF')
        );
        console.log('\nFacility name keys:', facilityKeys);
        
        // Look for location patterns
        const locationKeys = keys.filter(k =>
          k.toLowerCase().includes('region') ||
          k.toLowerCase().includes('district') ||
          k.toLowerCase().includes('location') ||
          k.includes('Region') ||
          k.includes('District')
        );
        console.log('Location keys:', locationKeys);
        
        // Show actual values for these keys
        console.log('\n=== ACTUAL VALUES ===');
        [...facilityKeys, ...locationKeys].slice(0, 10).forEach(key => {
          console.log(`${key}:`, rawData[key]);
        });
        
        // Check for nested objects
        console.log('\n=== NESTED STRUCTURE ANALYSIS ===');
        keys.slice(0, 10).forEach(key => {
          const value = rawData[key];
          if (typeof value === 'object' && value !== null) {
            console.log(`${key} is object with keys:`, Object.keys(value));
          }
        });
      }
    }
    
    // Check facilityData if exists
    if (survey.facilityData) {
      console.log('\n=== FACILITY DATA ===');
      console.log('facilityData keys:', Object.keys(survey.facilityData));
    }
    
    if (survey.facility_data) {
      console.log('\n=== FACILITY_DATA ===');
      console.log('facility_data keys:', Object.keys(survey.facility_data));
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugSurveyData();
