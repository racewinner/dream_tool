/**
 * Database Table Synchronization Script
 * 
 * This script ensures all database tables are created with correct case-sensitive names
 * and resolves any table name inconsistencies between models and database.
 */

import '../config'; // Load environment variables first
import { sequelize } from '../models';
// Import the model initializers and actual model instances
import { initSurveyModel } from '../models/survey';
import { initFacilityModel } from '../models/facility';

// Get model instances from sequelize
const Survey = sequelize.models.Survey;
const Facility = sequelize.models.Facility;

/**
 * Print sequelize model details for debugging
 */
function logModelDetails(modelName: string, model: any) {
  console.log(`\n🔍 Model details for ${modelName}:`);
  console.log(`- Name: ${model.name}`);
  console.log(`- Table name: ${model.tableName}`);
  console.log(`- Schema: ${model.schema || 'default'}`);
  console.log(`- Primary key: ${model.primaryKeyAttribute}`);
  console.log(`- Model options:`, JSON.stringify({
    timestamps: model.options?.timestamps,
    underscored: model.options?.underscored,
    freezeTableName: model.options?.freezeTableName
  }, null, 2));
}

async function syncDatabaseTables() {
  console.log('\n====================================');
  console.log('🔄 DATABASE TABLE SYNCHRONIZATION');
  console.log('====================================\n');
  
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check current tables
    console.log('\n📊 Current database tables:');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    tables.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Drop problematic tables if they exist (CAREFUL WITH THIS IN PRODUCTION!)
    console.log('\n🗑️ Checking for tables with incorrect case...');
    
    // Check for "Surveys" table (wrong case)
    const hasCapitalizedSurveys = tables.some((t: any) => t.table_name === 'Surveys');
    if (hasCapitalizedSurveys) {
      console.log('⚠️ Found "Surveys" table with incorrect capitalization, dropping...');
      await sequelize.query('DROP TABLE "Surveys" CASCADE');
      console.log('✅ Dropped incorrectly capitalized "Surveys" table');
    }
    
    // Check model instances
    console.log('\n🔍 Checking model instances...');
    
    if (!Survey) {
      console.error('❌ Survey model not found in sequelize.models!'); 
      console.log('Available models:', Object.keys(sequelize.models));
      throw new Error('Survey model not available');
    }
    
    if (!Facility) {
      console.error('❌ Facility model not found in sequelize.models!');
      console.log('Available models:', Object.keys(sequelize.models));
      throw new Error('Facility model not available');
    }
    
    // Log model details for debugging
    logModelDetails('Survey', Survey);
    logModelDetails('Facility', Facility);
    
    // Force-sync models to ensure correct table names
    console.log('\n🔄 Syncing database tables (forced)...');
    
    // Create direct queries to drop tables if they exist
    console.log('- Dropping tables if they exist to ensure clean sync...');
    try {
      await sequelize.query('DROP TABLE IF EXISTS "Surveys" CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS "surveys" CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS "Facilities" CASCADE');
      await sequelize.query('DROP TABLE IF EXISTS "facilities" CASCADE');
      console.log('✅ Tables dropped successfully');
    } catch (dropError) {
      console.warn('⚠️ Error dropping tables:', dropError instanceof Error ? dropError.message : String(dropError));
      // Continue with sync anyway
    }
    
    // Sync specific models individually with correct options
    console.log('- Syncing Survey model...');
    try {
      await sequelize.models.Survey.sync({ force: true });
      console.log('✅ Survey table synced');
    } catch (surveyError) {
      console.error('❌ Failed to sync Survey model:', surveyError instanceof Error ? surveyError.message : String(surveyError));
      throw surveyError;
    }
    
    console.log('- Syncing Facility model...');
    try {
      await sequelize.models.Facility.sync({ force: true });
      console.log('✅ Facility table synced');
    } catch (facilityError) {
      console.error('❌ Failed to sync Facility model:', facilityError instanceof Error ? facilityError.message : String(facilityError));
      throw facilityError;
    }
    
    // Verify table creation
    console.log('\n🔍 Verifying database tables after sync:');
    const [tablesAfter] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    tablesAfter.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Check for Survey table columns to verify structure
    console.log('\n📋 Verifying Survey table structure:');
    const [surveyColumns] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'surveys' ORDER BY ordinal_position"
    ) as [any[], any];
    
    if (surveyColumns.length === 0) {
      console.error('❌ Survey table structure issue: No columns found!');
    } else {
      surveyColumns.forEach((col: any) => console.log(`- ${col.column_name}: ${col.data_type}`));
    }
    
    console.log('\n✨ Database synchronization completed successfully');
    
  } catch (error) {
    console.error('\n❌ Database synchronization failed:');
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
syncDatabaseTables()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
