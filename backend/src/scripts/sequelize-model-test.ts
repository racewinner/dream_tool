// Test script to verify Sequelize model initialization and sync
import { sequelize } from '../models';

async function testSequelizeModels() {
  try {
    console.log('🚀 Starting Sequelize model test...');

    // Log Sequelize configuration
    console.log('\n⚙️ Sequelize Configuration:');
    console.log(`- Dialect: ${sequelize.options.dialect}`);
    console.log(`- Host: ${sequelize.options.host}`);
    console.log(`- Database: ${sequelize.options.database}`);
    console.log(`- Port: ${sequelize.options.port}`);

    // Log registered models
    console.log('\n📋 Registered Models:');
    const modelNames = Object.keys(sequelize.models);
    console.log(`Found ${modelNames.length} models:`);
    modelNames.forEach(name => {
      const model = sequelize.models[name];
      console.log(`\n🔍 Model: ${name}`);
      console.log(`- Table name: ${model.tableName}`);
      console.log(`- Attributes:`, Object.keys(model.rawAttributes).join(', '));
      console.log(`- Options:`, JSON.stringify(model.options, null, 2));
    });

    // Test database connection
    console.log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    // Test sync with detailed logging
    console.log('\n🔄 Syncing models...');
    await sequelize.sync({
      force: true,
      logging: (msg) => {
        console.log('Sequelize:', msg);
      }
    });
    console.log('✅ Models synced successfully!');

    return true;
  } catch (error) {
    console.error('❌ Error during model test:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
console.log('Starting model test...');
testSequelizeModels()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
