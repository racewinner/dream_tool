const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function auditCurrentState() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // 1. Check survey table schema
    console.log('\n📊 SURVEY TABLE SCHEMA:');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'surveys' 
      ORDER BY ordinal_position;
    `);
    
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Check actual data availability
    console.log('\n📋 DATA AVAILABILITY:');
    const [dataCheck] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_surveys,
        COUNT("facilityData") as has_facility_data,
        COUNT(facility_data) as has_facility_data_snake,
        COUNT(raw_data) as has_raw_data
      FROM surveys;
    `);
    
    if (dataCheck.length > 0) {
      const stats = dataCheck[0];
      console.log(`  - Total surveys: ${stats.total_surveys}`);
      console.log(`  - Has facilityData (camelCase): ${stats.has_facility_data}`);
      console.log(`  - Has facility_data (snake_case): ${stats.has_facility_data_snake}`);
      console.log(`  - Has raw_data: ${stats.has_raw_data}`);
    }
    
    // 3. Sample data structure
    console.log('\n🔍 SAMPLE DATA STRUCTURE:');
    const [sample] = await sequelize.query(`
      SELECT id, "externalId", "facilityData", facility_data, raw_data
      FROM surveys 
      LIMIT 1;
    `);
    
    if (sample.length > 0) {
      const record = sample[0];
      console.log(`  - Survey ID: ${record.id}`);
      console.log(`  - External ID: ${record.externalId}`);
      console.log(`  - facilityData (camelCase) exists: ${!!record.facilityData}`);
      console.log(`  - facility_data (snake_case) exists: ${!!record.facility_data}`);
      console.log(`  - raw_data exists: ${!!record.raw_data}`);
      
      // Check which column has the actual data
      if (record.facilityData) {
        const data = typeof record.facilityData === 'string' 
          ? JSON.parse(record.facilityData) : record.facilityData;
        console.log(`  - facilityData keys (${Object.keys(data).length}):`, Object.keys(data).slice(0, 5));
      }
      
      if (record.facility_data) {
        const data = typeof record.facility_data === 'string' 
          ? JSON.parse(record.facility_data) : record.facility_data;
        console.log(`  - facility_data keys (${Object.keys(data).length}):`, Object.keys(data).slice(0, 5));
      }
      
      if (record.raw_data) {
        const data = typeof record.raw_data === 'string' 
          ? JSON.parse(record.raw_data) : record.raw_data;
        console.log(`  - raw_data keys (${Object.keys(data).length}):`, Object.keys(data).slice(0, 5));
      }
    }
    
    // 4. Check facilities table
    console.log('\n🏥 FACILITIES TABLE:');
    const [facilityCount] = await sequelize.query(`
      SELECT COUNT(*) as total_facilities FROM facilities;
    `);
    console.log(`  - Total facilities: ${facilityCount[0]?.total_facilities || 0}`);
    
    // 5. Check users table
    console.log('\n👥 USERS TABLE:');
    const [userCount] = await sequelize.query(`
      SELECT COUNT(*) as total_users FROM users;
    `);
    console.log(`  - Total users: ${userCount[0]?.total_users || 0}`);
    
    // 6. Test a sample facility data extraction
    console.log('\n🧪 SAMPLE FACILITY DATA EXTRACTION:');
    if (sample.length > 0) {
      const record = sample[0];
      
      // Try both column naming conventions
      let facilityData = {};
      let rawData = {};
      
      if (record.facilityData) {
        facilityData = typeof record.facilityData === 'string' 
          ? JSON.parse(record.facilityData) : record.facilityData;
      } else if (record.facility_data) {
        facilityData = typeof record.facility_data === 'string' 
          ? JSON.parse(record.facility_data) : record.facility_data;
      }
      
      if (record.raw_data) {
        rawData = typeof record.raw_data === 'string' 
          ? JSON.parse(record.raw_data) : record.raw_data;
      }
      
      // Extract facility info using the same logic as the endpoint
      const facilityInfo = {
        name: facilityData?.name || rawData?.Name_HF || rawData?.facility_name || 'Unknown Facility',
        region: facilityData?.region || rawData?.Q3_Region || rawData?.region || 'Unknown',
        district: facilityData?.district || rawData?.Q9_District || rawData?.district || 'Unknown',
        facilityType: facilityData?.facilityType || facilityData?.subsectorActivities?.[0] || 'Health Post',
        latitude: facilityData?.latitude || (rawData?._geolocation?.[0] ? parseFloat(rawData._geolocation[0]) : null),
        longitude: facilityData?.longitude || (rawData?._geolocation?.[1] ? parseFloat(rawData._geolocation[1]) : null),
      };
      
      console.log('  Extracted facility info:');
      console.log(`    - Name: ${facilityInfo.name}`);
      console.log(`    - Region: ${facilityInfo.region}`);
      console.log(`    - District: ${facilityInfo.district}`);
      console.log(`    - Type: ${facilityInfo.facilityType}`);
      console.log(`    - Coordinates: ${facilityInfo.latitude && facilityInfo.longitude ? 
        `${facilityInfo.latitude}, ${facilityInfo.longitude}` : 'Not available'}`);
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

auditCurrentState();
