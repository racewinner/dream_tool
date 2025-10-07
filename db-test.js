const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'dream_tool',
    password: process.env.DB_PASSWORD || 'password123',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Successfully connected to the database!');

    // List all tables
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📋 Current tables in the database:');
    if (res.rows.length > 0) {
      res.rows.forEach(row => console.log(`- ${row.table_name}`));
    } else {
      console.log('No tables found in the database.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
console.log('🚀 Starting database connection test...');
testConnection()
  .then(success => {
    console.log(success ? '✅ Test completed successfully!' : '❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
