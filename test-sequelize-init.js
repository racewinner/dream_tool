const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

console.log('🚀 Testing Sequelize initialization...');
console.log('Environment:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log(`- DB_PORT: ${process.env.DB_PORT}`);
console.log(`- DB_NAME: ${process.env.DB_NAME}`);
console.log(`- DB_USER: ${process.env.DB_USER}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);

// Create a new Sequelize instance with detailed logging
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => console.log(`[SEQUELIZE] ${msg}`),
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

// Define a simple model
const TestModel = sequelize.define('TestModel', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'test_models',
  timestamps: true,
});

async function testSync() {
  try {
    console.log('\n🔄 Testing sync with force: false...');
    await TestModel.sync({ force: false });
    console.log('✅ Sync with force: false completed');
    
    // Try force sync if the first one doesn't create the table
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_models'"
    );
    
    if (results.length === 0) {
      console.log('\nℹ️ Table not found, trying with force: true...');
      await TestModel.sync({ force: true });
      console.log('✅ Force sync completed');
    }
    
    // Verify the table exists
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_models'"
    );
    
    if (tables.length > 0) {
      console.log('✅ Test table exists in the database');
      
      // Test CRUD operations
      console.log('\n➕ Creating test record...');
      const record = await TestModel.create({
        name: 'Test Record',
        description: 'This is a test record',
      });
      console.log('✅ Created record:', record.toJSON());
      
      console.log('\n🔍 Fetching records...');
      const records = await TestModel.findAll();
      console.log('✅ Found records:', JSON.stringify(records, null, 2));
      
      return true;
    } else {
      console.log('❌ Test table was not created');
      return false;
    }
  } catch (error) {
    console.error('❌ Sync error:', error);
    throw error;
  }
}

async function runTest() {
  try {
    console.log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    await testSync();
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
runTest()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
