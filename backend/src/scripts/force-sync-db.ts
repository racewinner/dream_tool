// Force database sync script
import { sequelize } from '../models';

async function forceSync() {
  try {
    console.log('🔍 Testing database connection...');
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

    // Force sync all models
    console.log('\n🔄 Forcing sync of all models...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized successfully!');
    
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

// Run the sync
console.log('🚀 Starting database sync...');
forceSync()
  .then(success => {
    console.log(success ? '\n✅ Sync completed successfully!' : '\n❌ Sync failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
