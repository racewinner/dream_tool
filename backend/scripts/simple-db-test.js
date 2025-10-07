const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function testConnection() {
  console.log('🚀 Testing PostgreSQL connection...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    statement_timeout: 5000,
    idle_in_transaction_session_timeout: 5000
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL database!');
    
    const res = await client.query('SELECT $1::text as message', ['Database connection successful!']);
    console.log('📊 Query result:', res.rows[0].message);
    
    const dbInfo = await client.query(
      'SELECT current_database(), current_user, version() as version'
    );
    
    console.log('\n📋 Database Information:');
    console.log('- Database:', dbInfo.rows[0].current_database);
    console.log('- User:', dbInfo.rows[0].current_user);
    console.log('- Version:', dbInfo.rows[0].version.split('\n')[0]);
    
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

testConnection().catch(console.error);
