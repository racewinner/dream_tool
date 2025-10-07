/**
 * Simple Database Operations Test
 * 
 * This script tests basic database operations on Survey and Facility models
 * to verify table existence and INSERT/SELECT capabilities.
 */

import '../config'; // Load environment variables first
import { sequelize, Sequelize } from '../models';
import { Survey } from '../models/survey';
import { Facility } from '../models/facility';

async function testDatabaseOperations() {
  console.log('\n====================================');
  console.log('🧪 SIMPLE DATABASE OPERATIONS TEST');
  console.log('====================================\n');
  
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get database tables
    console.log('\n📊 CHECKING DATABASE TABLES');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Check if our target tables exist
    const tableNames = tables.map((t: any) => t.table_name);
    const hasSurveys = tableNames.includes('surveys');
    const hasFacilities = tableNames.includes('facilities');
    
    console.log(`\nSurvey table exists: ${hasSurveys ? '✅' : '❌'}`);
    console.log(`Facility table exists: ${hasFacilities ? '✅' : '❌'}`);
    
    // If tables don't exist, try to create them
    if (!hasSurveys || !hasFacilities) {
      console.log('\n🔄 Tables missing, attempting to sync models...');
      await sequelize.sync({ alter: true });
      console.log('✅ Sync complete');
    }
    
    // Try a simple Facility creation
    console.log('\n🧪 TESTING FACILITY CREATION');
    console.log('Creating test facility...');
    
    try {
      const facility = await Facility.create({
        name: 'Test Facility',
        type: 'Hospital',
        location: 'Test Location',
        contactPerson: 'Test Person',
        contactEmail: 'test@example.com',
        contactPhone: '123-456-7890'
      });
      
      console.log(`✅ Created facility with ID: ${facility.id}`);
      
      // Query it back to verify
      const foundFacility = await Facility.findByPk(facility.id);
      console.log(`✅ Retrieved facility by ID: ${foundFacility?.id}, name: ${foundFacility?.name}`);
    } catch (facilityError) {
      console.error('❌ Facility creation failed:');
      if (facilityError instanceof Error) {
        console.error(`- Error name: ${facilityError.name}`);
        console.error(`- Error message: ${facilityError.message}`);
        console.error(`- Error stack: ${facilityError.stack}`);
      } else {
        console.error('- Unknown error:', facilityError);
      }
    }
    
    // Try a simple Survey creation
    console.log('\n🧪 TESTING SURVEY CREATION');
    console.log('Creating test survey...');
    
    try {
      // First get an existing facility to link to
      const existingFacility = await Facility.findOne();
      
      if (!existingFacility) {
        throw new Error('No facility found to link survey to');
      }
      
      const survey = await Survey.create({
        externalId: 'test-survey-' + Date.now(),
        facilityId: existingFacility.id,
        facilityData: {
          productiveSectors: ['health'],
          ownership: 'public',
          catchmentPopulation: 5000,
          coreServices: ['general', 'emergency'],
          electricitySource: 'grid',
          electricityReliability: 'good',
          electricityAvailability: '24h',
          operationalDays: 7,
          operationalHours: { day: 12, night: 12 },
          criticalNeeds: ['lighting', 'refrigeration'],
          supportStaff: 10,
          technicalStaff: 5,
          nightStaff: true,
          buildings: {
            total: 3,
            departmentsWithWiring: 3,
            rooms: 20,
            roomsWithConnection: 20
          },
          equipment: [
            {
              name: 'X-Ray',
              powerRating: 1500,
              quantity: 1,
              hoursPerDay: 8,
              hoursPerNight: 0,
              timeOfDay: 'morning',
              weeklyUsage: 5
            }
          ],
          infrastructure: {
            waterAccess: true,
            nationalGrid: true,
            transportationAccess: 'good',
            communication: 'phone',
            digitalConnectivity: 'broadband'
          }
        },
        collectionDate: new Date(),
        respondentId: 'test-user'
      });
      
      console.log(`✅ Created survey with ID: ${survey.id}`);
      
      // Query it back to verify
      const foundSurvey = await Survey.findByPk(survey.id);
      console.log(`✅ Retrieved survey by ID: ${foundSurvey?.id}, externalId: ${foundSurvey?.externalId}`);
      
    } catch (surveyError) {
      console.error('❌ Survey creation failed:');
      if (surveyError instanceof Error) {
        console.error(`- Error name: ${surveyError.name}`);
        console.error(`- Error message: ${surveyError.message}`);
        console.error(`- Error stack: ${surveyError.stack}`);
      } else {
        console.error('- Unknown error:', surveyError);
      }
      
      // Debug the Survey model and table specifics
      console.log('\n🔍 DEBUGGING SURVEY MODEL');
      console.log('- Model name:', Survey.name);
      console.log('- Table name:', Survey.tableName);
      console.log('- Primary key:', Survey.primaryKeyAttribute);
      
      try {
        const [surveyColumns] = await sequelize.query(
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'surveys' ORDER BY ordinal_position"
        ) as [any[], any];
        
        console.log('\n📋 Survey table structure:');
        if (surveyColumns.length === 0) {
          console.error('❌ No columns found in surveys table!');
        } else {
          surveyColumns.forEach((col: any) => console.log(`- ${col.column_name}: ${col.data_type}`));
        }
      } catch (schemaError) {
        console.error('❌ Error getting table schema:', schemaError);
      }
    }
    
    console.log('\n✨ Database tests completed');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
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

// Run the test
testDatabaseOperations()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
