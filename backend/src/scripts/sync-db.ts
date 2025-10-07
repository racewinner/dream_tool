// src/scripts/sync-db.ts
console.log('🚀 Starting database synchronization script...');

// Import models to ensure they are registered with Sequelize
import { sequelize, models } from '../models';
console.log('✅ Models imported successfully');
console.log('📋 Models loaded:', Object.keys(models).join(', '));

// Self-executing async function to handle top-level await
(async () => {
  console.log('\n🔍 Checking database connection...');
  try {
    // Test the database connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    
    // Get all model names for logging
    const modelNames = Object.keys(sequelize.models);
    console.log(`📋 Found ${modelNames.length} models:`, modelNames.join(', '));

    console.log('\n🔄 Starting database synchronization...');
    const syncOptions = {
      force: true,  // This will drop tables if they exist
      logging: console.log,
      alter: false,
      match: /_test$/ // Only sync models ending with _test (temporary for debugging)
    };
    
    console.log('🔧 Sync options:', JSON.stringify(syncOptions, null, 2));
    
    // Sync all models
    await sequelize.sync(syncOptions);
    
    console.log('\n✅ Database synchronized successfully!');
    
    // Verify tables were created
    const [results] = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`
    );
    
    if (Array.isArray(results)) {
      const tableNames = results.map((r: any) => r.table_name).filter(Boolean);
      console.log(`\n📊 Found ${tableNames.length} tables in the database:`);
      console.log(tableNames.map(name => `  - ${name}`).join('\n'));
    } else {
      console.log('❌ Could not retrieve table information');
    }
    
  } catch (error) {
    console.error('\n❌ Error during database synchronization:');
    console.error(error);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
      console.log('\n🔌 Database connection closed.');
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
    process.exit(0);
  }
})();
