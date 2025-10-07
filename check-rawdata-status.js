const { Sequelize } = require('sequelize');
const s = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function checkRawDataStatus() {
  try {
    console.log('=== rawData STATUS CHECK ===');
    
    const [results] = await s.query(`
      SELECT 
        id, 
        "externalId", 
        ("rawData" IS NOT NULL) as has_rawdata, 
        jsonb_typeof("rawData") as rawdata_type 
      FROM surveys 
      LIMIT 3
    `);
    
    results.forEach(r => 
      console.log(`ID:${r.id} External:${r.externalId} Has rawData:${r.has_rawdata} Type:${r.rawdata_type}`)
    );
    
    if (results.some(r => r.has_rawdata)) {
      const [keys] = await s.query(`
        SELECT jsonb_object_keys("rawData") as keys 
        FROM surveys 
        WHERE "rawData" IS NOT NULL 
        LIMIT 1
      `);
      console.log('Sample rawData keys:', keys.slice(0, 10).map(k => k.keys));
    } else {
      console.log('❌ NO surveys have rawData - this is the problem!');
      console.log('This explains why frontend shows "No detailed question data available"');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await s.close();
  }
}

checkRawDataStatus();
