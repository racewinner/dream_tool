/**
 * Simple script to verify equipment data preservation in surveys
 * This script directly queries the database to check if equipment data
 * is properly stored in the survey records after import.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dream_tool',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password123', // Fallback to known password
  logging: console.log
});

// Query function to find surveys with equipment data
async function checkSurveyEquipment() {
  console.log('🔍 Checking for surveys with equipment data...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Query to find surveys with equipment data
    const [results] = await sequelize.query(`
      SELECT 
        s.id, 
        s."externalId", 
        f.name as facility_name,
        s."facilityData"->>'equipment' as equipment_json_string,
        jsonb_array_length(s."facilityData"->'equipment') as equipment_count
      FROM 
        surveys s
      JOIN 
        facilities f ON s."facilityId" = f.id
      WHERE 
        s."facilityData" IS NOT NULL
        AND s."facilityData"->>'equipment' IS NOT NULL
        AND s."facilityData"->>'equipment' != '[]'
      ORDER BY 
        s.id DESC
      LIMIT 10;
    `);

    console.log(`\n📋 Found ${results.length} surveys with equipment data:`);
    
    if (results.length === 0) {
      console.log('❌ No surveys with equipment data found.');
      console.log('\nPossible causes:');
      console.log('1. No surveys have been imported yet');
      console.log('2. Equipment data extraction is not working properly');
      console.log('3. Equipment data is not being preserved during transformation');
      return;
    }
    
    // Display results
    results.forEach((survey, index) => {
      console.log(`\n--- Survey ${index + 1} ---`);
      console.log(`ID: ${survey.id}`);
      console.log(`External ID: ${survey.externalId}`);
      console.log(`Facility: ${survey.facility_name}`);
      console.log(`Equipment Count: ${survey.equipment_count}`);
      
      // Parse and show equipment details
      try {
        const equipment = JSON.parse(survey.equipment_json_string);
        console.log('\nEquipment Items:');
        equipment.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.name || 'Unknown'} (${item.quantity || '?'}x) - ${item.condition || 'Unknown condition'}`);
        });
        
        if (equipment.length > 3) {
          console.log(`  ... and ${equipment.length - 3} more items`);
        }
      } catch (e) {
        console.log(`❌ Error parsing equipment data: ${e.message}`);
        console.log(`Raw data: ${survey.equipment_json_string}`);
      }
    });
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the check
checkSurveyEquipment().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
