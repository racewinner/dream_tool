// Direct SQL test script for Survey model
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Direct SQL Test for Survey Model ===\n');

async function runDirectSqlTest() {
  // Create an in-memory SQLite database with verbose logging
  const sequelize = new Sequelize('sqlite::memory:', {
    logging: msg => console.log(`[SEQUELIZE] ${msg}`),
    retry: { max: 5, timeout: 60000 }
  });

  try {
    console.log('1. Testing direct SQL execution...');
    
    // Create tables directly using raw SQL
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Facilities" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" VARCHAR(255) NOT NULL,
        "createdAt" DATETIME NOT NULL,
        "updatedAt" DATETIME NOT NULL
      );
    `);
    
    console.log('   - Created Facilities table');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "Surveys" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "externalId" VARCHAR(255) UNIQUE,
        "facilityId" INTEGER REFERENCES "Facilities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "facilityData" JSONB NOT NULL,
        "collectionDate" DATETIME NOT NULL,
        "respondentId" VARCHAR(255) NOT NULL,
        "createdAt" DATETIME NOT NULL,
        "updatedAt" DATETIME NOT NULL
      );
    `);
    
    console.log('   - Created Surveys table');
    
    // Insert test data
    console.log('2. Inserting test data...');
    
    // Insert a facility
    const [facilityResult] = await sequelize.query(`
      INSERT INTO "Facilities" ("id", "name", "createdAt", "updatedAt")
      VALUES (1, 'Test Facility', datetime('now'), datetime('now'));
    `);
    
    console.log('   - Inserted test facility');
    
    // Insert a survey
    const testFacilityData = {
      name: 'Test Facility',
      productiveSectors: ['health facility'],
      subsectorActivities: ['Health Center'],
      ownership: 'public',
      catchmentPopulation: 5000,
      coreServices: ['Outpatient', 'Inpatient']
    };
    
    const [surveyResult] = await sequelize.query(`
      INSERT INTO "Surveys" (
        "externalId",
        "facilityId",
        "facilityData",
        "collectionDate",
        "respondentId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        :externalId,
        :facilityId,
        :facilityData,
        :collectionDate,
        :respondentId,
        datetime('now'),
        datetime('now')
      )
    `, {
      replacements: {
        externalId: 'direct-sql-test-1',
        facilityId: 1,
        facilityData: JSON.stringify(testFacilityData),
        collectionDate: new Date().toISOString(),
        respondentId: 'test-respondent-1'
      }
    });
    
    console.log('   - Inserted test survey');
    
    // Query the data back
    console.log('3. Querying test data...');
    const [surveys] = await sequelize.query('SELECT * FROM "Surveys"');
    
    console.log('\n=== QUERY RESULTS ===');
    console.log('Found surveys:', surveys);
    
    if (surveys.length > 0) {
      console.log('\nFirst survey details:');
      console.log('  - ID:', surveys[0].id);
      console.log('  - External ID:', surveys[0].externalId);
      console.log('  - Facility ID:', surveys[0].facilityId);
      console.log('  - Collection Date:', surveys[0].collectionDate);
      console.log('  - Respondent ID:', surveys[0].respondentId);
      
      try {
        const facilityData = typeof surveys[0].facilityData === 'string' 
          ? JSON.parse(surveys[0].facilityData)
          : surveys[0].facilityData;
          
        console.log('  - Facility Data (parsed):', JSON.stringify(facilityData, null, 2));
      } catch (parseError) {
        console.error('  - Error parsing facilityData:', parseError.message);
      }
    }
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    
    if (error.original) {
      console.error('Original error:', error.original.message);
      if (error.original.sql) {
        console.error('SQL:', error.original.sql);
        console.error('Parameters:', error.original.parameters);
      }
    }
    
    console.error('\nStack:', error.stack);
    process.exit(1);
    
  } finally {
    await sequelize.close();
  }
}

// Run the test
runDirectSqlTest().catch(console.error);
