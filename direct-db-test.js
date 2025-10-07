// Direct database test without TypeScript
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Log environment variables for debugging
console.log('Environment:');
console.log('- DB_HOST:', process.env.DB_HOST);
console.log('- DB_PORT:', process.env.DB_PORT);
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(not set)');

// Create a new Sequelize instance
const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  logging: console.log
});

// Define a simple model
const Test = sequelize.define('Test', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'test_table',
  timestamps: true
});

// Test function
async function test() {
  try {
    console.log('\n🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    console.log('\n🔄 Syncing test model...');
    await Test.sync({ force: true });
    console.log('✅ Test model synced successfully!');

    console.log('\n📊 Creating test record...');
    const testRecord = await Test.create({ name: 'Test Record' });
    console.log('✅ Test record created:', testRecord.toJSON());

    console.log('\n📋 Listing all test records:');
    const records = await Test.findAll();
    console.log(records.map(r => r.toJSON()));

    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error; // Re-throw to ensure the error is caught by the outer catch
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
console.log('🚀 Starting direct database test...');
test()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error in test:', error);
    process.exit(1);
  });
