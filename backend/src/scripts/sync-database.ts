/**
 * Database Sync Script
 * 
 * This script ensures that database tables are synchronized with 
 * current model definitions. Use with caution in production as
 * it may alter or drop tables.
 */

import '../config'; // Load configuration first
import { sequelize } from '../models';

async function syncDatabase() {
  console.log('==============================');
  console.log('📦 DATABASE SYNC TOOL');
  console.log('==============================');
  
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');
    
    console.log('\nStarting database sync. This will update tables to match models.');
    console.log('WARNING: This may alter existing tables. Make sure you have a backup.');
    
    // Sync all models with the database
    // alter: true updates tables to match models (adds missing columns, etc.)
    // force: false prevents dropping tables
    await sequelize.sync({ alter: true, force: false });
    
    console.log('\n✅ Database sync completed successfully.');
    console.log('Database tables now match current model definitions.');
    
    return true;
  } catch (error) {
    console.error('\n❌ Database sync failed:');
    if (error instanceof Error) {
      console.error(`- Error name: ${error.name}`);
      console.error(`- Error message: ${error.message}`);
      console.error(`- Error stack: ${error.stack}`);
    } else {
      console.error('- Unknown error:', error);
    }
    
    return false;
  } finally {
    // Close the connection
    try {
      await sequelize.close();
      console.log('\nDatabase connection closed.');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncDatabase()
    .then(success => {
      console.log('\nSync process completed.');
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error in sync process:', err);
      process.exit(1);
    });
}

export default syncDatabase;
