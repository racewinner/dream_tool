const axios = require('axios');
const fs = require('fs');

console.log('🔍 Starting detailed SQL error diagnosis...');
console.log('📅 Timestamp:', new Date().toISOString());

// Capture console output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

let capturedLogs = [];

function captureLog(type, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  capturedLogs.push({
    timestamp,
    type,
    message
  });
  
  // Still output to console
  if (type === 'log') originalConsoleLog(...args);
  else if (type === 'error') originalConsoleError(...args);
  else if (type === 'warn') originalConsoleWarn(...args);
}

// Override console methods
console.log = (...args) => captureLog('log', ...args);
console.error = (...args) => captureLog('error', ...args);
console.warn = (...args) => captureLog('warn', ...args);

async function diagnoseSQLErrors() {
  try {
    console.log('\n🚀 Triggering KoboToolbox import with enhanced logging...');
    
    const startTime = Date.now();
    
    const response = await axios.post('http://localhost:3001/api/import/kobo/surveys/recent', {}, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n📊 Import Response:');
    console.log('Status:', response.status);
    console.log('Duration:', `${duration}ms`);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Wait a moment for any async logging to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Filter logs for SQL errors and database operations
    const sqlErrors = capturedLogs.filter(log => 
      log.message.includes('ERROR:') || 
      log.message.includes('error:') ||
      log.message.includes('Error processing survey') ||
      log.message.includes('Error in getOrCreateFacility') ||
      log.message.includes('SequelizeError') ||
      log.message.includes('DatabaseError') ||
      log.message.includes('ValidationError') ||
      log.message.includes('constraint') ||
      log.message.includes('violates') ||
      log.message.includes('duplicate key') ||
      log.message.includes('relation') ||
      log.message.includes('column') ||
      log.message.includes('SQL')
    );
    
    const facilityLogs = capturedLogs.filter(log =>
      log.message.includes('facility') ||
      log.message.includes('Facility') ||
      log.message.includes('🏥')
    );
    
    const surveyLogs = capturedLogs.filter(log =>
      log.message.includes('Processing survey') ||
      log.message.includes('Successfully imported survey') ||
      log.message.includes('Survey') ||
      log.message.includes('📝')
    );
    
    // Save comprehensive diagnosis
    const diagnosis = {
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      response: {
        status: response.status,
        data: response.data
      },
      sqlErrors: sqlErrors,
      facilityLogs: facilityLogs,
      surveyLogs: surveyLogs,
      allLogs: capturedLogs
    };
    
    fs.writeFileSync('sql-error-diagnosis.json', JSON.stringify(diagnosis, null, 2));
    console.log('\n💾 Comprehensive diagnosis saved to: sql-error-diagnosis.json');
    
    // Summary output
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log(`- Total logs captured: ${capturedLogs.length}`);
    console.log(`- SQL errors found: ${sqlErrors.length}`);
    console.log(`- Facility operations: ${facilityLogs.length}`);
    console.log(`- Survey operations: ${surveyLogs.length}`);
    
    if (sqlErrors.length > 0) {
      console.log('\n❌ SQL ERRORS DETECTED:');
      sqlErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.timestamp}] ${error.message}`);
      });
    }
    
    if (!response.data.success) {
      console.log('\n❌ IMPORT FAILED ANALYSIS:');
      console.log('Failed records:', response.data.failed);
      console.log('Error message:', response.data.message);
      
      // Look for specific error patterns
      const constraintErrors = sqlErrors.filter(log => 
        log.message.includes('constraint') || log.message.includes('violates')
      );
      const typeErrors = sqlErrors.filter(log => 
        log.message.includes('type') || log.message.includes('invalid input')
      );
      const relationErrors = sqlErrors.filter(log => 
        log.message.includes('relation') || log.message.includes('does not exist')
      );
      
      if (constraintErrors.length > 0) {
        console.log('- Constraint violations detected:', constraintErrors.length);
      }
      if (typeErrors.length > 0) {
        console.log('- Data type errors detected:', typeErrors.length);
      }
      if (relationErrors.length > 0) {
        console.log('- Table/relation errors detected:', relationErrors.length);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Error during diagnosis:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Save error logs anyway
    const errorDiagnosis = {
      timestamp: new Date().toISOString(),
      error: error.message,
      capturedLogs: capturedLogs
    };
    
    fs.writeFileSync('sql-error-diagnosis-failed.json', JSON.stringify(errorDiagnosis, null, 2));
  }
}

// Run diagnosis
diagnoseSQLErrors().then(() => {
  console.log('\n✅ SQL error diagnosis completed');
}).catch(error => {
  console.error('\n💥 Diagnosis failed:', error.message);
});
