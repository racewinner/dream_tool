// Debug import process step by step
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: console.log
});

// Define models exactly as they are in the app
const Survey = sequelize.define('Survey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  externalId: { type: DataTypes.STRING, allowNull: false },
  facilityId: { type: DataTypes.INTEGER, allowNull: false },
  facilityData: { type: DataTypes.JSONB, allowNull: false },
  rawData: { type: DataTypes.JSONB, allowNull: true },
  collectionDate: { type: DataTypes.DATE, allowNull: false },
  respondentId: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'surveys', timestamps: true });

const Facility = sequelize.define('Facility', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  region: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: false },
  facilityType: { type: DataTypes.STRING, allowNull: true },
  latitude: { type: DataTypes.FLOAT, allowNull: true },
  longitude: { type: DataTypes.FLOAT, allowNull: true }
}, { tableName: 'facilities', timestamps: true });

async function debugStepByStep() {
  try {
    console.log('🔍 STEP-BY-STEP IMPORT DEBUG\n');
    
    // Step 1: Check database state BEFORE any import
    console.log('📊 BEFORE Import - Database State:');
    const [beforeSurveys] = await sequelize.query('SELECT COUNT(*) as count FROM surveys');
    const [beforeFacilities] = await sequelize.query('SELECT COUNT(*) as count FROM facilities');
    console.log(`  Surveys: ${beforeSurveys[0].count}`);
    console.log(`  Facilities: ${beforeFacilities[0].count}\n`);
    
    // Step 2: Test basic database operations
    console.log('🧪 Testing Database Operations:');
    
    // Test facility creation
    try {
      const testFacility = await Facility.create({
        name: 'Test Facility DEBUG',
        region: 'Test Region', 
        district: 'Test District',
        facilityType: 'Test Type'
      });
      console.log(`  ✅ Facility creation works - ID: ${testFacility.id}`);
      
      // Test survey creation with rawData
      const testSurvey = await Survey.create({
        externalId: 'TEST_DEBUG_001',
        facilityId: testFacility.id,
        facilityData: { name: 'Test Facility', region: 'Test Region' },
        rawData: { test_question: 'test_answer', debug: true },
        collectionDate: new Date(),
        respondentId: 'test_user'
      });
      console.log(`  ✅ Survey creation with rawData works - ID: ${testSurvey.id}`);
      
      // Clean up test data
      await testSurvey.destroy();
      await testFacility.destroy();
      console.log('  🧹 Test data cleaned up\n');
      
    } catch (testError) {
      console.error('  ❌ Database operation test FAILED:', testError.message);
      console.error('  Stack:', testError.stack);
      return;
    }
    
    // Step 3: Check for data import service specific issues
    console.log('🔍 Checking Import Service Issues:');
    
    // Check if surveys are being created but then deleted/rolled back
    const transaction = await sequelize.transaction();
    try {
      console.log('  Testing transaction behavior...');
      
      const testFacilityTx = await Facility.create({
        name: 'Transaction Test Facility',
        region: 'TX Region',
        district: 'TX District'  
      }, { transaction });
      
      const testSurveyTx = await Survey.create({
        externalId: 'TX_TEST_001',
        facilityId: testFacilityTx.id,
        facilityData: { name: 'TX Test' },
        rawData: { tx_test: true },
        collectionDate: new Date(),
        respondentId: 'tx_test'
      }, { transaction });
      
      console.log('  ✅ Transaction operations successful');
      
      // Commit the transaction
      await transaction.commit();
      console.log('  ✅ Transaction committed');
      
      // Verify data exists after commit
      const verifyFacility = await Facility.findByPk(testFacilityTx.id);
      const verifySurvey = await Survey.findByPk(testSurveyTx.id);
      
      if (verifyFacility && verifySurvey) {
        console.log('  ✅ Data persists after transaction commit');
        
        // Clean up
        await verifySurvey.destroy();
        await verifyFacility.destroy();
        console.log('  🧹 Transaction test data cleaned up');
      } else {
        console.log('  ❌ Data NOT found after commit - MAJOR ISSUE!');
      }
      
    } catch (txError) {
      await transaction.rollback();
      console.error('  ❌ Transaction test FAILED:', txError.message);
    }
    
    // Step 4: Final database state check
    console.log('\n📊 AFTER Tests - Database State:');
    const [afterSurveys] = await sequelize.query('SELECT COUNT(*) as count FROM surveys');
    const [afterFacilities] = await sequelize.query('SELECT COUNT(*) as count FROM facilities');
    console.log(`  Surveys: ${afterSurveys[0].count}`);
    console.log(`  Facilities: ${afterFacilities[0].count}`);
    
    // Step 5: Check for any actual survey data
    console.log('\n🔍 Checking for ANY survey data:');
    const [allSurveys] = await sequelize.query(`
      SELECT id, "externalId", "createdAt", 
             ("facilityData"->>'name') as facility_name,
             CASE WHEN "rawData" IS NOT NULL THEN 'YES' ELSE 'NO' END as has_rawdata
      FROM surveys 
      ORDER BY "createdAt" DESC
    `);
    
    if (allSurveys.length > 0) {
      console.log(`  Found ${allSurveys.length} surveys:`);
      allSurveys.forEach((s, i) => {
        console.log(`    ${i+1}. ID:${s.id} External:${s.externalId} Facility:${s.facility_name} rawData:${s.has_rawdata}`);
      });
    } else {
      console.log('  ❌ NO SURVEYS FOUND IN DATABASE');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

debugStepByStep();
