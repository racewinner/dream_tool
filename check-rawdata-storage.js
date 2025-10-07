const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

const Survey = sequelize.define('Survey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  externalId: { type: DataTypes.STRING },
  facilityId: { type: DataTypes.INTEGER },
  facilityData: { type: DataTypes.JSONB },
  rawData: { type: DataTypes.JSONB },
  collectionDate: { type: DataTypes.DATE },
  respondentId: { type: DataTypes.STRING }
}, { tableName: 'surveys', timestamps: true });

async function checkRawDataStorage() {
  try {
    console.log('🔍 Checking rawData storage in surveys...\n');
    
    // Get all surveys
    const surveys = await Survey.findAll({
      attributes: ['id', 'externalId', 'facilityData', 'rawData'],
      limit: 5
    });
    
    console.log(`📊 Found ${surveys.length} surveys in database\n`);
    
    for (const survey of surveys) {
      console.log(`Survey ID: ${survey.id} (External: ${survey.externalId})`);
      console.log(`  Facility Name: ${survey.facilityData?.name || 'Unknown'}`);
      console.log(`  Has rawData: ${survey.rawData ? 'YES' : 'NO'}`);
      
      if (survey.rawData) {
        const rawDataKeys = Object.keys(survey.rawData);
        console.log(`  rawData keys (${rawDataKeys.length}):`, rawDataKeys.slice(0, 5).join(', '));
      }
      console.log('');
    }
    
    // Check rawData column exists
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'surveys' AND column_name = 'rawData'
    `);
    
    console.log('📋 Database schema check:');
    if (columns.length > 0) {
      console.log('✅ rawData column exists:', columns[0]);
    } else {
      console.log('❌ rawData column NOT found in database');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkRawDataStorage();
