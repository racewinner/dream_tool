const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

const Survey = sequelize.define('Survey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  externalId: { type: DataTypes.STRING },
  facilityId: { type: DataTypes.INTEGER },
  facilityData: { type: DataTypes.JSONB },
  rawData: { type: DataTypes.JSONB }, // Test the new field
  collectionDate: { type: DataTypes.DATE },
  respondentId: { type: DataTypes.STRING }
}, { tableName: 'surveys', timestamps: true });

async function testRawDataField() {
  try {
    console.log('🧪 Testing rawData field in Survey model...\n');
    
    // Test creating a survey with rawData
    const testSurvey = {
      externalId: 'TEST_RAWDATA_001',
      facilityId: 1,
      facilityData: {
        name: 'Test Facility',
        region: 'Test Region'
      },
      rawData: {
        question1: 'Answer 1',
        question2: 'Answer 2',
        metadata: {
          source: 'test'
        }
      },
      collectionDate: new Date(),
      respondentId: 'test_user'
    };
    
    console.log('📝 Creating test survey with rawData...');
    const created = await Survey.create(testSurvey);
    console.log('✅ Survey created successfully with ID:', created.id);
    
    // Test retrieving the survey
    console.log('🔍 Retrieving survey to verify rawData...');
    const retrieved = await Survey.findByPk(created.id);
    
    if (retrieved && retrieved.rawData) {
      console.log('✅ rawData field working correctly:');
      console.log('  - question1:', retrieved.rawData.question1);
      console.log('  - question2:', retrieved.rawData.question2);
      console.log('  - metadata:', retrieved.rawData.metadata);
    } else {
      console.log('❌ rawData field not working - data not retrieved');
    }
    
    // Clean up test data
    await Survey.destroy({ where: { externalId: 'TEST_RAWDATA_001' } });
    console.log('🧹 Test data cleaned up');
    
    console.log('\n🎯 rawData field test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

testRawDataField();
