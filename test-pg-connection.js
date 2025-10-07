const { Pool } = require('pg');
require('dotenv').config();

console.log('🚀 Testing PostgreSQL connection...');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',  // Try both 'postgres' (Docker service name) and 'localhost'
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',  // Try connecting to default 'postgres' database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000,  // 5 second timeout
  query_timeout: 5000,
  statement_timeout: 5000,
});

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('✅ Connected to PostgreSQL');
    
    // List databases
    const dbs = await client.query('SELECT datname FROM pg_database;');
    console.log('\n📋 Available databases:');
    console.log(dbs.rows.map(r => `- ${r.datname}`).join('\n'));
    
    // List tables in current database
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log('\n📋 Tables in current database:');
    if (tables.rows.length > 0) {
      console.log(tables.rows.map(r => `- ${r.table_name}`).join('\n'));
    } else {
      console.log('No tables found.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL:', error.message);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
