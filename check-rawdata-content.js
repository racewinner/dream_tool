// Check if rawData is populated in existing surveys
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function checkRawDataContent() {
  try {
    console.log('🔍 CHECKING rawData CONTENT IN EXISTING SURVEYS\n');
    
    // Get all surveys with their rawData status
    const [surveys] = await sequelize.query(`
      SELECT 
        id,
        "externalId",
        ("facilityData"->>'name') as facility_name,
        CASE 
          WHEN "rawData" IS NULL THEN 'NULL'
          WHEN "rawData" = 'null'::jsonb THEN 'JSONB_NULL' 
          WHEN jsonb_typeof("rawData") = 'object' AND jsonb_object_keys("rawData") IS NOT NULL THEN 'HAS_DATA'
          ELSE 'UNKNOWN'
        END as rawdata_status,
        CASE 
          WHEN "rawData" IS NOT NULL AND "rawData" != 'null'::jsonb 
          THEN (SELECT count(*) FROM jsonb_object_keys("rawData"))
          ELSE 0 
        END as rawdata_key_count
      FROM surveys 
      ORDER BY id
    `);
    
    console.log(`Found ${surveys.length} surveys:\n`);
    
    surveys.forEach((s, i) => {
      console.log(`${i+1}. Survey ID: ${s.id}`);
      console.log(`   External ID: ${s.externalId}`);
      console.log(`   Facility: ${s.facility_name}`);
      console.log(`   rawData Status: ${s.rawdata_status}`);
      console.log(`   rawData Keys: ${s.rawdata_key_count}\n`);
    });
    
    // Get sample rawData content from first survey with data
    console.log('📋 SAMPLE rawData CONTENT:\n');
    const [sampleData] = await sequelize.query(`
      SELECT "rawData" 
      FROM surveys 
      WHERE "rawData" IS NOT NULL 
      AND "rawData" != 'null'::jsonb
      LIMIT 1
    `);
    
    if (sampleData.length > 0) {
      const rawData = sampleData[0].rawData;
      console.log('Sample rawData keys:', Object.keys(rawData).slice(0, 15));
      console.log('Sample responses keys:', rawData.responses ? Object.keys(rawData.responses).slice(0, 10) : 'No responses object');
      
      // Check specific KoboToolbox fields that should be in rawData
      const koboFields = ['_id', '_submission_time', '_submitted_by', 'Name_HF', 'Q3_Region', 'Q9_District'];
      console.log('\n🏥 KoboToolbox field check:');
      koboFields.forEach(field => {
        const value = rawData[field];
        console.log(`  ${field}: ${value ? 'EXISTS' : 'MISSING'} ${value ? `(${String(value).substring(0, 20)}...)` : ''}`);
      });
      
    } else {
      console.log('❌ NO surveys found with populated rawData');
      console.log('\n🚨 CRITICAL: This means rawData is empty in all surveys!');
      console.log('This explains why frontend shows "No detailed question data available"');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkRawDataContent();
