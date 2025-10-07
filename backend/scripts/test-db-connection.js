console.log('🚀 Testing database connection...');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Check required variables
const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required database environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('🔧 Using database configuration:');
console.log(`- Host: ${process.env.DB_HOST}`);
console.log(`- Port: ${process.env.DB_PORT}`);
console.log(`- Database: ${process.env.DB_NAME}`);
console.log(`- User: ${process.env.DB_USER}`);
console.log(`- Password: ${process.env.DB_PASSWORD ? '****' + process.env.DB_PASSWORD.slice(-4) : 'not set'}`);

// Test database connection
async function testConnection() {
  const { Sequelize } = require('sequelize');
  
  console.log('\n🔧 Creating Sequelize instance with configuration:');
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: (msg) => {
      // Filter out heartbeat pings for cleaner output
      if (!msg.includes('Executing (default)')) {
        console.log(`  ${msg}`);
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 10000,
      idle: 5000
    }
  });
  
  try {
    console.log('\n🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    console.log('\n🔍 Testing a simple query...');
    try {
      const [results] = await sequelize.query("SELECT current_database(), current_user, version() as db_version");
      console.log('\n📊 Database information:');
      console.log('- Current database:', results[0]?.current_database || 'N/A');
      console.log('- Current user:', results[0]?.current_user || 'N/A');
      console.log('- Database version:', results[0]?.db_version ? results[0].db_version.split('\n')[0] : 'N/A');
    } catch (queryError) {
      console.error('\n❌ Query failed:');
      console.error('- Error:', queryError.message);
      throw queryError;
    }
    
    // Check if tables exist
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📋 Found tables:');
    if (tables.length > 0) {
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
    } else {
      console.log('No tables found in the database.');
    }
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.original) {
      console.error('Original error:', error.original);
    }
    
    process.exit(1);
  } finally {
    // Close the connection
    if (sequelize) {
      await sequelize.close();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the test
testConnection().catch(console.error);
