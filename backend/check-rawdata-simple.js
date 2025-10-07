// Simple rawData check script for Docker execution
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

(async () => {
  try {
    console.log('🔍 Checking rawData storage...');
    
    // Check if rawData column exists
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'surveys' AND column_name = 'rawData'
    `);
    
    console.log('rawData column exists:', columns.length > 0 ? 'YES' : 'NO');
    if (columns.length > 0) {
      console.log('Column details:', columns[0]);
    }
    
    // Check surveys with rawData
    const [surveys] = await sequelize.query(`
      SELECT id, "externalId", 
             ("facilityData"->>'name') as facility_name,
             CASE WHEN "rawData" IS NOT NULL THEN 'YES' ELSE 'NO' END as has_rawdata
      FROM surveys 
      LIMIT 5
    `);
    
    console.log(`\n📊 Found ${surveys.length} surveys:`);
    surveys.forEach(survey => {
      console.log(`  Survey ${survey.id}: ${survey.facility_name || 'Unknown'} - rawData: ${survey.has_rawdata}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
})();
