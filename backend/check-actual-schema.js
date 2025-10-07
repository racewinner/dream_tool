// Check actual database schema and survey data
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function checkActualSchema() {
  try {
    console.log('📋 ACTUAL DATABASE SCHEMA CHECK\n');
    
    // Check surveys table schema
    console.log('🔍 Surveys table schema:');
    const [surveyCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'surveys' 
      ORDER BY ordinal_position
    `);
    surveyCols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));
    
    // Check facilities table schema  
    console.log('\n🔍 Facilities table schema:');
    const [facilityCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'facilities' 
      ORDER BY ordinal_position
    `);
    facilityCols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`));
    
    // Check actual survey data with rawData status
    console.log('\n📊 ACTUAL SURVEY DATA:');
    const [surveys] = await sequelize.query(`
      SELECT 
        id,
        "externalId",
        "facilityId",
        "collectionDate",
        "respondentId",
        ("facilityData"->>'name') as facility_name,
        CASE 
          WHEN "rawData" IS NULL THEN 'NULL'
          WHEN "rawData" = 'null'::jsonb THEN 'JSONB_NULL' 
          ELSE 'HAS_DATA'
        END as rawdata_status,
        CASE 
          WHEN "rawData" IS NOT NULL AND "rawData" != 'null'::jsonb 
          THEN jsonb_array_length(jsonb_object_keys("rawData")) 
          ELSE 0 
        END as rawdata_key_count
      FROM surveys 
      ORDER BY id
    `);
    
    console.log(`Found ${surveys.length} surveys:`);
    surveys.forEach(s => {
      console.log(`  Survey ${s.id}:`);
      console.log(`    External ID: ${s.externalId}`);
      console.log(`    Facility: ${s.facility_name || 'Unknown'}`);
      console.log(`    rawData Status: ${s.rawdata_status}`);
      console.log(`    rawData Keys: ${s.rawdata_key_count}`);
      console.log(`    Collection Date: ${s.collectionDate}`);
      console.log('');
    });
    
    // Get sample rawData content if exists
    console.log('🔬 SAMPLE rawData CONTENT:');
    const [sampleRaw] = await sequelize.query(`
      SELECT "rawData", "facilityData"
      FROM surveys 
      WHERE "rawData" IS NOT NULL AND "rawData" != 'null'::jsonb
      LIMIT 1
    `);
    
    if (sampleRaw.length > 0) {
      const rawData = sampleRaw[0].rawData;
      console.log('Sample rawData keys:', Object.keys(rawData || {}).slice(0, 10));
      console.log('Sample facilityData name:', sampleRaw[0].facilityData?.name);
    } else {
      console.log('❌ No surveys found with populated rawData');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkActualSchema();
