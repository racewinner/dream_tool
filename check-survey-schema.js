const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function checkSurveySchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Check the actual table structure
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'surveys' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Survey table schema:');
    results.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Get a sample record to see the actual data structure
    const [sampleData] = await sequelize.query(`
      SELECT id, "externalId", "facilityId" 
      FROM surveys 
      LIMIT 1;
    `);
    
    if (sampleData.length > 0) {
      console.log('\n📋 Sample survey data:');
      console.log(sampleData[0]);
      
      // Try to get the JSONB columns specifically
      const [jsonbData] = await sequelize.query(`
        SELECT id, "externalId", facility_data, raw_data 
        FROM surveys 
        WHERE id = ${sampleData[0].id};
      `);
      
      if (jsonbData.length > 0) {
        const record = jsonbData[0];
        console.log('\n🗂️  JSONB column data:');
        console.log(`  - facility_data exists: ${!!record.facility_data}`);
        console.log(`  - raw_data exists: ${!!record.raw_data}`);
        
        if (record.facility_data) {
          const facilityData = typeof record.facility_data === 'string' 
            ? JSON.parse(record.facility_data) : record.facility_data;
          console.log(`  - facility_data keys (${Object.keys(facilityData).length}):`, Object.keys(facilityData).slice(0, 10));
        }
        
        if (record.raw_data) {
          const rawData = typeof record.raw_data === 'string' 
            ? JSON.parse(record.raw_data) : record.raw_data;
          console.log(`  - raw_data keys (${Object.keys(rawData).length}):`, Object.keys(rawData).slice(0, 10));
        }
      }
    } else {
      console.log('\n❌ No survey data found');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSurveySchema();
