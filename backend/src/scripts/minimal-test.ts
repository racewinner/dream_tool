// Minimal test script to verify database connection and model sync
console.log('🚀 Starting minimal test script...');

import { Sequelize, DataTypes, Model } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables directly
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

// Define a simple test model
class TestModel extends Model {}
TestModel.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Test',
  tableName: 'test_table'
});

// Test function
async function test() {
  try {
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    console.log('\n🔄 Syncing test model...');
    await TestModel.sync({ force: true });
    console.log('✅ Test model synced successfully!');

    console.log('\n📊 Creating test record...');
    const testRecord = await TestModel.create({ name: 'Test Record' });
    console.log('✅ Test record created:', testRecord.toJSON());

    console.log('\n📋 Listing all test records:');
    const records = await TestModel.findAll();
    console.log(records.map(r => r.toJSON()));

    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
test()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
