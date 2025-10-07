// Test script to verify database connection and test data import
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Log file for output
const logFile = path.join(__dirname, 'test-db-import.log');

// Clear log file
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  fs.appendFileSync(logFile, logMessage, 'utf8');
}

log('===== Starting Database Import Test =====');

// Database configuration
const dbConfig = {
  user: 'postgres',
  password: 'password123',
  host: 'localhost',
  port: 5432,
  database: 'dream_tool'
};

// Sample facility data for testing
// Valid type values: 'healthcare', 'education', 'community'
const sampleFacility = {
  name: 'Test Healthcare Facility',
  type: 'healthcare', // Using a valid enum value
  latitude: 0,
  longitude: 0,
  status: 'survey',
  userId: null, // Set to NULL to avoid foreign key constraint issues
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Sample survey data for testing
const sampleSurvey = {
  externalId: `TEST-${Date.now()}`,
  facilityId: null, // Will be set after facility creation
  facilityData: {
    type: 'healthcare',
    operational_status: 'operational',
    has_electricity: true,
    power_source: 'grid',
    backup_power: 'generator',
    notes: 'Test survey entry',
    // Add any other fields that might be required by the application
    surveyor_name: 'Test User',
    gps_coordinates: { lat: 0, lng: 0 }
  },
  collectionDate: new Date().toISOString(),
  respondentId: 'test-respondent-123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: null // Set to null to avoid foreign key issues
};

async function testDatabase() {
  const client = new Client(dbConfig);
  
  try {
    // Connect to the database
    log('1. Connecting to the database...');
    await client.connect();
    log('✅ Connected to the database');
    
    // Verify tables exist
    log('\n2. Verifying tables exist...');
    const tablesRes = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('surveys', 'facilities')`
    );
    
    const tableNames = tablesRes.rows.map(row => row.table_name);
    log(`Found tables: ${tableNames.join(', ') || 'None'}`);
    
    if (!tableNames.includes('surveys') || !tableNames.includes('facilities')) {
      throw new Error('Required tables (surveys, facilities) not found in database');
    }
    
    // Test inserting data
    log('\n3. Testing data insertion...');
    
    // Insert a facility first
    log('Inserting facility...');
    const facilityResult = await client.query(
      `INSERT INTO facilities (name, type, latitude, longitude, status, "userId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        sampleFacility.name,
        sampleFacility.type,
        sampleFacility.latitude,
        sampleFacility.longitude,
        sampleFacility.status,
        sampleFacility.userId,
        sampleFacility.createdAt,
        sampleFacility.updatedAt
      ]
    );
    
    const facilityId = facilityResult.rows[0].id;
    log(`✅ Inserted facility with ID: ${facilityId}`);
    
    // Set the facility ID for the survey
    sampleSurvey.facilityId = facilityId;
    
    // Log the survey data for debugging
    log('\nSurvey data to be inserted:');
    log(JSON.stringify(sampleSurvey, null, 2));
    
    // Insert a survey
    log('\nInserting survey...');
    const surveyResult = await client.query(
      `INSERT INTO surveys ("externalId", "facilityId", "facilityData", 
        "collectionDate", "respondentId", "createdAt", "updatedAt", "createdBy")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        sampleSurvey.externalId,
        sampleSurvey.facilityId,
        JSON.stringify(sampleSurvey.facilityData), // Convert to JSON string
        sampleSurvey.collectionDate,
        sampleSurvey.respondentId,
        sampleSurvey.createdAt,
        sampleSurvey.updatedAt,
        sampleSurvey.createdBy
      ]
    );
    
    const surveyId = surveyResult.rows[0].id;
    log(`✅ Inserted survey with ID: ${surveyId}`);
    
    // Verify data was inserted
    log('\n4. Verifying data...');
    const surveyCheck = await client.query(
      'SELECT * FROM surveys WHERE id = $1',
      [surveyId]
    );
    
    if (surveyCheck.rows.length === 0) {
      throw new Error('Failed to verify survey insertion');
    }
    
    log('✅ Data verification successful!');
    log('\n===== Test Completed Successfully =====');
    log('The database connection and data import are working correctly.');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    if (error.detail) {
      log(`Detail: ${error.detail}`);
    }
    if (error.hint) {
      log(`Hint: ${error.hint}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
testDatabase().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
  process.exit(1);
});
