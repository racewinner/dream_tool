/**
 * Database Initialization Script
 * 
 * This script initializes the database schema by calling the same
 * initialization functions used by the backend application.
 */

import '../config'; // Load configuration first
import { sequelize } from '../models';
import { initializeDatabase } from '../utils/databaseInit';

async function initDb() {
  console.log('==============================');
  console.log('📦 DATABASE INITIALIZATION TOOL');
  console.log('==============================');
  
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');
    
    console.log('\nStarting database initialization...');
    
    // Initialize database using the same function as the backend
    await initializeDatabase();
    
    console.log('\n✅ Database initialization completed successfully.');
    
    return true;
  } catch (error) {
    console.error('\n❌ Database initialization failed:');
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

// Run the initialization if this script is executed directly
if (require.main === module) {
  initDb()
    .then(success => {
      console.log('\nInitialization process completed.');
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error in initialization process:', err);
      process.exit(1);
    });
}

export default initDb;
