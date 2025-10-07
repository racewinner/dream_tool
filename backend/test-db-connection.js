// Simple database connection test
const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🔌 Testing PostgreSQL connection...');
  
  const client = new Client({
    host: 'host.docker.internal',
    port: 5432,
    database: 'dream_tool',
    user: 'postgres',
    password: 'password123'
  });

  try {
    console.log('⏳ Attempting to connect...');
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query test successful:', result.rows[0]);
    
    await client.end();
    console.log('✅ Connection closed successfully');
    
    console.log('\n🎉 DATABASE IS WORKING!');
    console.log('The backend should now start successfully.');
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 PostgreSQL server is not running or not accessible.');
      console.log('Solutions:');
      console.log('1. Start PostgreSQL server');
      console.log('2. Check if Docker is running (if using Docker)');
      console.log('3. Verify host.docker.internal resolves correctly');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('\n💡 Authentication issue.');
      console.log('Solutions:');
      console.log('1. Check if password is correct');
      console.log('2. Verify user "postgres" exists');
      console.log('3. Check PostgreSQL authentication settings');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n💡 Database does not exist.');
      console.log('Solutions:');
      console.log('1. Create database "dream_tool"');
      console.log('2. Run: CREATE DATABASE dream_tool;');
    }
  }
}

testDatabaseConnection();
