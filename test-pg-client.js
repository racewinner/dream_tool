const { Client } = require('pg');
require('dotenv').config();

console.log('🚀 Testing PostgreSQL connection with pg client...');
console.log('Environment:');
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log(`- DB_PORT: ${process.env.DB_PORT}`);
console.log(`- DB_NAME: ${process.env.DB_NAME}`);
console.log(`- DB_USER: ${process.env.DB_USER}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  statement_timeout: 5000,
});

async function runTest() {
  try {
    console.log('\n🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // List databases
    console.log('\n📋 Listing databases:');
    const dbs = await client.query('SELECT datname FROM pg_database;');
    console.log(dbs.rows.map(r => `- ${r.datname}`).join('\n'));

    // List tables in current database
    console.log('\n📋 Listing tables in current database:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    if (tables.rows.length > 0) {
      console.log(tables.rows.map(r => `- ${r.table_name}`).join('\n'));
    } else {
      console.log('No tables found in the database.');
    }

    // Create a test table
    console.log('\n🔄 Creating test table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Test table created');

    // Insert test data
    console.log('\n➕ Inserting test data...');
    await client.query(
      'INSERT INTO test_table (name) VALUES ($1) RETURNING *',
      ['Test Record']
    );
    console.log('✅ Test data inserted');

    // Query test data
    console.log('\n📝 Querying test data:');
    const result = await client.query('SELECT * FROM test_table;');
    console.log(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from PostgreSQL');
  }
}

runTest()
  .then(() => console.log('\n✅ Test completed successfully!'))
  .catch(() => console.log('\n❌ Test failed'))
  .finally(() => process.exit(0));
