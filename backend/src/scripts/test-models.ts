// Simple test script to check model loading and database connection
console.log('🚀 Starting model test script...');

// Import the database connection and models
import { sequelize, models } from '../models';

console.log('✅ Database connection and models imported');

// Log the loaded models
console.log('\n📋 Loaded models:');
Object.entries(models).forEach(([name, model]) => {
  console.log(`- ${name}:`, model?.tableName || 'No tableName');
});

// Test the database connection
async function testConnection() {
  try {
    console.log('\n🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    // List all tables in the database
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📊 Current tables in database:');
    if (Array.isArray(tables) && tables.length > 0) {
      tables.forEach((table: any) => console.log(`- ${table.table_name}`));
    } else {
      console.log('No tables found in the database.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
testConnection()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
