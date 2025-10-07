// Debug the complete import flow step by step
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function debugImportFlow() {
  try {
    console.log('🔍 DEBUGGING COMPLETE IMPORT FLOW\n');
    
    // Step 1: Check database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Step 2: Check surveys table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'surveys' 
      ORDER BY ordinal_position
    `);
    console.log('📋 Surveys table structure:');
    columns.forEach(col => console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`));
    
    // Step 3: Count total surveys
    const [countResult] = await sequelize.query('SELECT COUNT(*) as count FROM surveys');
    const surveyCount = countResult[0].count;
    console.log(`\n📊 Total surveys in database: ${surveyCount}`);
    
    if (surveyCount > 0) {
      // Step 4: Check recent surveys with rawData status
      const [surveys] = await sequelize.query(`
        SELECT 
          id,
          "externalId",
          "createdAt",
          ("facilityData"->>'name') as facility_name,
          CASE WHEN "rawData" IS NOT NULL THEN 'YES' ELSE 'NO' END as has_rawdata,
          CASE WHEN "rawData" IS NOT NULL THEN jsonb_array_length(jsonb_object_keys("rawData")) ELSE 0 END as rawdata_keys_count
        FROM surveys 
        ORDER BY "createdAt" DESC 
        LIMIT 5
      `);
      
      console.log('\n🔍 Recent surveys:');
      surveys.forEach(s => {
        console.log(`  Survey ${s.id}:`);
        console.log(`    External ID: ${s.externalId}`);
        console.log(`    Facility: ${s.facility_name || 'Unknown'}`);
        console.log(`    Has rawData: ${s.has_rawdata}`);
        console.log(`    Created: ${s.createdAt}`);
        console.log('');
      });
      
      // Step 5: Check a specific survey's rawData content
      const [sampleSurvey] = await sequelize.query(`
        SELECT "rawData", "facilityData"
        FROM surveys 
        WHERE "rawData" IS NOT NULL
        LIMIT 1
      `);
      
      if (sampleSurvey.length > 0) {
        const rawData = sampleSurvey[0].rawData;
        const facilityData = sampleSurvey[0].facilityData;
        
        console.log('🔬 Sample rawData analysis:');
        console.log(`  rawData keys (${Object.keys(rawData || {}).length}):`, Object.keys(rawData || {}).slice(0, 10));
        console.log(`  facilityData name: ${facilityData?.name}`);
        console.log(`  facilityData region: ${facilityData?.region}`);
      }
      
    } else {
      console.log('❌ No surveys found in database despite import success logs');
    }
    
    // Step 6: Check facilities table
    const [facilityCount] = await sequelize.query('SELECT COUNT(*) as count FROM facilities');
    console.log(`\n🏥 Total facilities in database: ${facilityCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await sequelize.close();
  }
}

debugImportFlow();
