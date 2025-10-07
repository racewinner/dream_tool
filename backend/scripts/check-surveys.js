/**
 * Script to check survey data in the database
 * This helps diagnose issues with data import and equipment data preservation
 */

const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();

// Database connection configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dream_tool',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  logging: console.log
});

async function checkSurveys() {
  console.log('🔍 Checking for surveys in the database...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Check if surveys table exists and has data
    const [surveys] = await sequelize.query(`
      SELECT 
        s.id,
        s."externalId",
        f.name as facility_name,
        s."createdAt",
        s."updatedAt",
        jsonb_typeof("facilityData") as data_type,
        "facilityData"->'equipment' as equipment_data,
        jsonb_typeof("facilityData"->'equipment') as equipment_type,
        "facilityData" as full_facility_data
      FROM 
        surveys s
      LEFT JOIN 
        facilities f ON s."facilityId" = f.id
      ORDER BY 
        s."createdAt" DESC
      LIMIT 5;
    `, { type: QueryTypes.SELECT });

    console.log(`\n📋 Found ${surveys.length} surveys in the database:`);
    
    if (surveys.length === 0) {
      console.log('❌ No surveys found in the database.');
      console.log('\nPossible causes:');
      console.log('1. No surveys have been imported yet');
      console.log('2. There was an error during the import process');
      console.log('3. The surveys table is empty or does not exist');
      return;
    }
    
    // Display basic survey info
    surveys.forEach((survey, index) => {
      console.log(`\n--- Survey ${index + 1} ---`);
      console.log(`ID: ${survey.id}`);
      console.log(`External ID: ${survey.externalId || 'N/A'}`);
      console.log(`Facility: ${survey.facility_name || 'N/A'}`);
      console.log(`Created: ${survey.createdAt}`);
      console.log(`FacilityData Type: ${survey.data_type || 'N/A'}`);
      
      if (survey.equipment_data) {
        console.log('Equipment Data Type:', survey.equipment_type);
        console.log('Equipment Data Sample:', JSON.stringify(survey.equipment_data, null, 2));
      } else {
        console.log('Equipment Data Exists: No');
      }
    });
    
    // Check the structure of facilityData in one survey
    if (surveys.length > 0) {
      console.log('\n🔍 Checking facilityData structure...');
      const sampleSurvey = surveys[0];
      
      if (sampleSurvey.full_facility_data) {
        console.log('\nSample facilityData structure:');
        console.log(JSON.stringify(sampleSurvey.full_facility_data, null, 2));
      } else {
        console.log('\nNo facilityData found in any surveys');
      }
    }
    
    // Check if we have any equipment data at all in any column
    console.log('\n🔍 Checking for any equipment data in the database...');
    const [equipmentCheck] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT("facilityData"->'equipment') as surveys_with_equipment,
        COUNT(DISTINCT "facilityId") as unique_facilities
      FROM surveys
      WHERE "facilityData"->'equipment' IS NOT NULL;
    `, { type: QueryTypes.SELECT });
    
    console.log('\n📊 Equipment Data Statistics:');
    console.log(`Total surveys: ${equipmentCheck.total_surveys}`);
    console.log(`Surveys with equipment data: ${equipmentCheck.surveys_with_equipment}`);
    console.log(`Unique facilities with equipment data: ${equipmentCheck.unique_facilities}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.original) {
      console.error('Database Error:', error.original.message);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkSurveys().catch(console.error);
