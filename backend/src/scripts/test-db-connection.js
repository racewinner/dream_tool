// Test script to verify database connection and model loading
console.log('1. Starting database connection test');

// Load environment variables first
require('dotenv').config();

// Log environment
console.log('2. Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  // Don't log password for security
  DB_PASSWORD: process.env.DB_PASSWORD ? '***' : 'not set'
});

// Initialize Sequelize directly
const { Sequelize } = require('sequelize');

// Create a new connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'dream_tool',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
async function testConnection() {
  try {
    console.log('3. Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('4. Running test query...');
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log('5. Query result:', results);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Run the test
testConnection()
  .then(success => {
    console.log(`6. Test completed ${success ? 'successfully' : 'with errors'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
