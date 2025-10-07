const { Client } = require('pg');
require('dotenv').config();

const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dream_tool',
  password: process.env.DB_PASSWORD || 'password123',
  port: parseInt(process.env.DB_PORT || '5432'),
};

async function testConnection() {
  console.log('🔌 Testing direct PostgreSQL connection...');
  console.log('📡 Connection config:', {
    ...DB_CONFIG,
    password: DB_CONFIG.password ? '***' : 'not set'
  });

  const client = new Client(DB_CONFIG);
  
  try {
    // Test connection
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to database');
    
    // Test query
    console.log('🔍 Running test query...');
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version);
    
    // List tables
    const tables = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📋 Found ${tables.rows.length} tables:`);
    console.table(tables.rows);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    // Provide troubleshooting tips
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Is PostgreSQL running?');
      console.error('2. Check if the host and port are correct');
      console.error('3. Verify the database name and credentials');
    } else if (error.code === '28P01') {
      console.error('\n🔧 Authentication failed. Check your username and password.');
    } else if (error.code === '3D000') {
      console.error('\n🔧 Database does not exist. Check the database name.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

testConnection().catch(console.error);
