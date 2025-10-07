const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  // Test with localhost (from .env)
  const client1 = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password123',
    database: 'dream_tool'
  });
  
  try {
    await client1.connect();
    console.log('✅ Connection successful with localhost');
    await client1.end();
    return true;
  } catch (error) {
    console.log('❌ Connection failed with localhost:', error.message);
  }
  
  // Test with host.docker.internal (from logs)
  const client2 = new Client({
    host: 'host.docker.internal',
    port: 5432,
    user: 'postgres',
    password: 'password123',
    database: 'dream_tool'
  });
  
  try {
    await client2.connect();
    console.log('✅ Connection successful with host.docker.internal');
    await client2.end();
    return true;
  } catch (error) {
    console.log('❌ Connection failed with host.docker.internal:', error.message);
  }
  
  console.log('❌ All connection attempts failed');
  return false;
}

testConnection();
