const { Client } = require('pg');
require('dotenv').config();

async function testPermissions() {
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

    // Check current user and permissions
    console.log('\n🔍 Checking user permissions...');
    const userRes = await client.query('SELECT current_user, current_database(), current_schema()');
    console.log('Current user:', userRes.rows[0].current_user);
    console.log('Current database:', userRes.rows[0].current_database);
    console.log('Current schema:', userRes.rows[0].current_schema);

    // Check if we have permissions to create tables
    console.log('\n🔍 Checking table creation permissions...');
    try {
      await client.query('CREATE TABLE test_permissions (id SERIAL PRIMARY KEY)');
      console.log('✅ Successfully created test table - user has table creation permissions');
      await client.query('DROP TABLE test_permissions');
      console.log('✅ Successfully dropped test table');
    } catch (err) {
      console.error('❌ Error creating test table:', err);
    }

    // Check if we can list tables
    console.log('\n📋 Checking table listing...');
    try {
      const res = await client.query(
        "SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema = 'public'"
      );
      console.log(`Found ${res.rows.length} tables:`);
      res.rows.forEach(row => console.log(`- ${row.table_schema}.${row.table_name}`));
    } catch (err) {
      console.error('❌ Error listing tables:', err);
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  } finally {
    try {
      await client.end();
      console.log('\n🔌 Database connection closed.');
    } catch (err) {
      console.error('❌ Error closing connection:', err);
    }
  }
}

// Run the test
console.log('🚀 Starting database permissions test...');
testPermissions()
  .then(success => {
    console.log(success ? '✅ Test completed successfully!' : '❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
