// Script to verify the data was imported correctly
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Log file for output
const outputFile = path.join(__dirname, 'verify-import-output.txt');

// Clear log file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// Function to write to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  fs.appendFileSync(outputFile, logMessage, 'utf8');
}

// Database configuration
const dbConfig = {
  user: 'postgres',
  password: 'password123',
  host: 'localhost',
  port: 5432,
  database: 'dream_tool'
};

async function verifyImport() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    log('✅ Connected to the database');
    
    // Get the most recent facility
    log('\nMost recent facility:');
    const facilityResult = await client.query(
      'SELECT * FROM facilities ORDER BY id DESC LIMIT 1;'
    );
    
    if (facilityResult.rows.length === 0) {
      log('No facilities found in the database.');
    } else {
      log(JSON.stringify(facilityResult.rows[0], null, 2));
      
      // Get surveys for this facility
      const facilityId = facilityResult.rows[0].id;
      log(`\nSurveys for facility ID ${facilityId}:`);
      
      const surveyResult = await client.query(
        'SELECT * FROM surveys WHERE "facilityId" = $1 ORDER BY id DESC;',
        [facilityId]
      );
      
      if (surveyResult.rows.length === 0) {
        log('No surveys found for this facility.');
      } else {
        surveyResult.rows.forEach((row, index) => {
          log(`\nSurvey #${index + 1}:`);
          // Format the output for better readability
          const formattedRow = { ...row };
          // Parse the facilityData JSON if it exists
          if (formattedRow.facilityData) {
            try {
              formattedRow.facilityData = JSON.parse(formattedRow.facilityData);
            } catch (e) {
              // If parsing fails, leave it as is
              log(`Could not parse facilityData: ${e.message}`);
            }
          }
          log(JSON.stringify(formattedRow, null, 2));
        });
      }
    }
    
    // Get the total count of facilities and surveys
    const countResult = await client.query(
      'SELECT (SELECT COUNT(*) FROM facilities) as facility_count, ' +
      '(SELECT COUNT(*) FROM surveys) as survey_count;'
    );
    
    log('\nDatabase Summary:');
    log(`- Total facilities: ${countResult.rows[0].facility_count}`);
    log(`- Total surveys: ${countResult.rows[0].survey_count}`);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    if (error.stack) {
      log('Stack trace:');
      log(error.stack);
    }
  } finally {
    await client.end();
    log('\nDisconnected from the database');
    log('\nCheck the complete output in: ' + outputFile);
  }
}

// Run the verification
log('===== Starting Data Import Verification =====');
verifyImport().catch(error => {
  log(`Unhandled error: ${error.message}`);
  if (error.stack) {
    log('Stack trace:');
    log(error.stack);
  }
  process.exit(1);
});
