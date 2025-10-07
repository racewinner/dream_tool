/**
 * Database Table Fix Script
 * 
 * This script uses a simpler approach to fix database table issues
 * by using Sequelize's sync mechanism with proper options.
 */

import '../config'; // Load environment variables first
import { sequelize } from '../models';

async function fixDatabaseTables() {
  console.log('\n====================================');
  console.log('🔧 DATABASE TABLE FIX UTILITY');
  console.log('====================================\n');
  
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check existing tables
    console.log('\n📊 CHECKING DATABASE TABLES');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Force sync all models to create the required tables
    console.log('\n🔄 FORCE SYNCING ALL MODELS...');
    
    try {
      // Force sync entire database
      console.log('Performing complete database sync (force: true)...');
      await sequelize.sync({ force: true });
      console.log('✅ Database sync completed successfully');
    } catch (syncError) {
      console.error('❌ Database sync error:', syncError instanceof Error ? syncError.message : String(syncError));
      throw syncError;
    }
    
    // Verify table creation
    console.log('\n🔍 VERIFYING DATABASE TABLES');
    const [tablesAfter] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`Found ${tablesAfter.length} tables after sync:`);
    tablesAfter.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Check specifically for the survey and facility tables
    const surveyTableExists = tablesAfter.some((t: any) => 
      t.table_name === 'surveys' || t.table_name === 'Surveys');
      
    const facilityTableExists = tablesAfter.some((t: any) => 
      t.table_name === 'facilities' || t.table_name === 'Facilities');
    
    console.log(`\nSurvey table exists: ${surveyTableExists ? '✅' : '❌'}`);
    console.log(`Facility table exists: ${facilityTableExists ? '✅' : '❌'}`);
    
    // If the expected tables don't exist, we have an issue
    if (!surveyTableExists || !facilityTableExists) {
      console.error('❌ Some required tables are missing after sync!');
    } else {
      console.log('\n✅ All required tables have been created successfully');
    }
    
    // Check survey table structure
    console.log('\n📋 VERIFYING TABLE STRUCTURES');
    
    try {
      const [surveyColumns] = await sequelize.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'surveys' ORDER BY ordinal_position"
      ) as [any[], any];
      
      console.log('\nSurvey table structure:');
      if (surveyColumns.length === 0) {
        console.error('❌ No columns found in surveys table!');
      } else {
        surveyColumns.forEach((col: any) => console.log(`- ${col.column_name}: ${col.data_type}`));
      }
    } catch (error) {
      console.error('❌ Error fetching survey table structure:', error instanceof Error ? error.message : String(error));
    }
    
    try {
      const [facilityColumns] = await sequelize.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'facilities' ORDER BY ordinal_position"
      ) as [any[], any];
      
      console.log('\nFacility table structure:');
      if (facilityColumns.length === 0) {
        console.error('❌ No columns found in facilities table!');
      } else {
        facilityColumns.forEach((col: any) => console.log(`- ${col.column_name}: ${col.data_type}`));
      }
    } catch (error) {
      console.error('❌ Error fetching facility table structure:', error instanceof Error ? error.message : String(error));
    }
    
  } catch (error) {
    console.error('\n❌ Database fix script failed:');
    if (error instanceof Error) {
      console.error(`- Error name: ${error.name}`);
      console.error(`- Error message: ${error.message}`);
      console.error(`- Error stack: ${error.stack}`);
    } else {
      console.error('- Unknown error:', error);
    }
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed');
  }
}

// Run the script
fixDatabaseTables()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
