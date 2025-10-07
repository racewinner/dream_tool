// Direct PostgreSQL test using pg module
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dream_tool',
  password: process.env.DB_PASSWORD || 'password123',
  port: parseInt(process.env.DB_PORT || '5432'),
};

console.log('Database configuration:', {
  ...dbConfig,
  password: '***', // Don't log the actual password
});

// Create a new client
const client = new Client(dbConfig);

// Connect to the database
console.log('\n🔍 Connecting to the database...');
client.connect()
  .then(() => {
    console.log('✅ Successfully connected to the database!');
    
    // Create a test table
    return client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  })
  .then(() => {
    console.log('✅ Test table created or already exists');
    
    // Insert a test record
    return client.query(
      'INSERT INTO test_table (name) VALUES ($1) RETURNING *',
      ['Test Record']
    );
  })
  .then((result) => {
    console.log('✅ Test record inserted:', result.rows[0]);
    
    // Query all test records
    return client.query('SELECT * FROM test_table');
  })
  .then((result) => {
    console.log('\n📋 All test records:');
    console.table(result.rows);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
  })
  .finally(() => {
    // Close the connection
    client.end()
      .then(() => console.log('\n🔌 Database connection closed'))
      .catch(err => console.error('Error closing connection:', err));
  });
