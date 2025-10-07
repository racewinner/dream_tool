const {Sequelize} = require('sequelize');
const s = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function showFacilityDataPoints() {
  try {
    const [results] = await s.query('SELECT "facilityData" FROM surveys LIMIT 1');
    const facilityData = results[0].facilityData;
    
    console.log('=== FACILITY DATA STRUCTURE ===');
    console.log('Total top-level fields:', Object.keys(facilityData || {}).length);
    
    if (facilityData) {
      Object.entries(facilityData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            console.log(`\n${key}: (object with ${Object.keys(value).length} fields)`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              console.log(`  ${subKey}: ${subValue}`);
            });
          } else if (Array.isArray(value)) {
            console.log(`\n${key}: [${value.length} items]`);
            if (value.length > 0) {
              console.log(`  Sample: ${JSON.stringify(value[0]).substring(0, 100)}...`);
            }
          } else {
            console.log(`${key}: ${value}`);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await s.close();
  }
}

showFacilityDataPoints();
