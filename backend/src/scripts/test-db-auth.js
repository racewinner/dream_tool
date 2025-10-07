// Test script to help identify correct PostgreSQL credentials
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Log file for output
const logFile = path.join(__dirname, 'db-auth-test.log');

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

log('===== Starting PostgreSQL Authentication Test =====');

// Common connection parameters
const commonConfig = {
  host: 'localhost',
  port: 5432,
  database: 'dream_tool',
  // Test with a short timeout to fail faster
  connectionTimeoutMillis: 3000,
  query_timeout: 2000,
  statement_timeout: 2000
};

// List of common usernames to test
const usernames = [
  'postgres',
  'postgresql',
  'admin',
  'root',
  'user',
  'dreamtool',
  'dream_tool',
  'dreamtool_user',
  process.env.DB_USER,  // From environment
  process.env.POSTGRES_USER,  // Common env var
  process.env.PGUSER  // Another common env var
].filter(Boolean); // Remove any undefined values

// List of common passwords to test
const passwords = [
  'postgres',
  'password',
  'admin',
  'root',
  'dreamtool',
  'dream_tool',
  'password123',
  process.env.DB_PASSWORD,  // From environment
  process.env.POSTGRES_PASSWORD,  // Common env var
  process.env.PGPASSWORD  // Another common env var
].filter(Boolean); // Remove any undefined values

// Try to find working credentials
async function testCredentials() {
  log(`Testing ${usernames.length} usernames and ${passwords.length} passwords...`);
  
  // Try each username with each password
  for (const user of usernames) {
    for (const pass of passwords) {
      const config = {
        ...commonConfig,
        user,
        password: pass
      };
      
      log(`\nTesting credentials - User: '${user}'`);
      
      const client = new Client(config);
      
      try {
        await client.connect();
        log('✅ SUCCESS! Working credentials found!');
        log(`Username: ${user}`);
        log(`Password: ${pass}`);
        
        // Get database info
        const dbInfo = await client.query('SELECT current_database(), current_user, version()');
        log('\nDatabase Info:');
        log(`- Database: ${dbInfo.rows[0].current_database}`);
        log(`- User: ${dbInfo.rows[0].current_user}`);
        log(`- Version: ${dbInfo.rows[0].version.split(' ').slice(0, 3).join(' ')}`);
        
        // List all tables
        const tables = await client.query(
          `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' ORDER BY table_name`
        );
        
        log(`\nFound ${tables.rows.length} tables:`);
        tables.rows.forEach(row => log(`- ${row.table_name}`));
        
        await client.end();
        process.exit(0);
        
      } catch (error) {
        // Only log authentication failures, not connection timeouts or other errors
        if (error.message.includes('password authentication failed') || 
            error.message.includes('role') && error.message.includes('does not exist')) {
          log(`❌ Failed: ${error.message.split('\n')[0]}`);
        } else {
          log(`⚠️  Error (${error.code || 'UNKNOWN'}): ${error.message}`);
        }
      } finally {
        try {
          await client.end();
        } catch (e) {
          // Ignore errors on close
        }
      }
    }
  }
  
  log('\n❌ No working credentials found. Checked:');
  log(`- Usernames: ${usernames.join(', ')}`);
  log(`- Passwords: ${passwords.map(p => p ? '***' : '').filter(Boolean).join(', ')}`);
  log('\nPlease check your PostgreSQL server configuration and try again.');
  process.exit(1);
}

// Run the test
testCredentials().catch(error => {
  log(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
});
