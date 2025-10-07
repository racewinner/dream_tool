// Test script to verify model initialization and database sync
console.log('🚀 Starting model sync test script...');

// Import the database connection and models
import { sequelize, models } from '../models';

// Log the loaded models
console.log('\n📋 Loaded models:');
const modelNames = Object.keys(sequelize.models);
console.log(`Found ${modelNames.length} models:`, modelNames.join(', '));

// Log details of each model
modelNames.forEach(name => {
  const model = sequelize.models[name];
  console.log(`\n🔍 Model: ${name}`);
  console.log(`- Table name: ${model.tableName}`);
  console.log(`- Attributes:`, Object.keys(model.rawAttributes).join(', '));
});

// Test the database connection and sync
async function testSync() {
  try {
    console.log('\n🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    // List current tables
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📊 Current tables in database:');
    if (Array.isArray(tables) && tables.length > 0) {
      tables.forEach((table: any) => console.log(`- ${table.table_name}`));
    } else {
      console.log('No tables found in the database.');
    }

    // Sync all models
    console.log('\n🔄 Syncing all models...');
    const syncOptions = {
      force: true,  // This will drop tables if they exist
      logging: console.log,
      alter: false,
    };
    
    await sequelize.sync(syncOptions);
    console.log('\n✅ Database synchronized successfully!');
    
    // List tables after sync
    const [newTables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📊 Tables after sync:');
    if (Array.isArray(newTables) && newTables.length > 0) {
      newTables.forEach((table: any) => console.log(`- ${table.table_name}`));
    } else {
      console.log('No tables found after sync.');
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Error during database sync:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
testSync()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
