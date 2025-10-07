// Simple direct DB connection test
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('Testing database connection...');
console.log('DB Host:', process.env.DB_HOST);
console.log('DB Port:', process.env.DB_PORT);
console.log('DB Name:', process.env.DB_NAME);
console.log('DB User:', process.env.DB_USER);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('✅ Connected to database');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection()
  .then(success => {
    console.log(success ? '✅ Test completed successfully!' : '❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
