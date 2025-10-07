/**
 * Test script for direct survey insert
 * 
 * This script bypasses the DataImportService and directly attempts to create 
 * a facility and survey record using the Sequelize models to isolate any issues.
 */

console.log('===== Starting test-survey-insert.ts script =====');

import '../config'; // Load environment variables first
import { sequelize } from '../models';

// Get the models from the sequelize instance (safer than direct imports)
const Survey = sequelize.models.Survey;
const Facility = sequelize.models.Facility;

async function testSurveyInsert(): Promise<void> {
  let transaction;
  
  try {
    console.log('\n🔍 VERIFYING DATABASE TABLES');
    
    // Check if tables exist
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`Found ${tables.length} tables in database:`);
    tables.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Verify that our required tables exist
    const surveysTableExists = tables.some((t: any) => 
      t.table_name === 'surveys' || t.table_name === 'Surveys');
      
    const facilitiesTableExists = tables.some((t: any) => 
      t.table_name === 'facilities' || t.table_name === 'Facilities');
    
    console.log(`\nSurveys table exists: ${surveysTableExists ? '✅' : '❌'}`);
    console.log(`Facilities table exists: ${facilitiesTableExists ? '✅' : '❌'}`);
    
    if (!surveysTableExists || !facilitiesTableExists) {
      throw new Error('Required tables do not exist in database');
    }
    
    // Log model and table name information
    console.log('\n🔍 VERIFYING SEQUELIZE MODELS');
    console.log('Facility model:', {
      tableName: Facility.tableName,
      modelName: Facility.name,
      attributes: Object.keys(Facility.getAttributes())
    });
    
    console.log('Survey model:', {
      tableName: Survey.tableName,
      modelName: Survey.name,
      attributes: Object.keys(Survey.getAttributes())
    });
    
    // Start a transaction for data consistency
    console.log('\n🔄 Starting transaction...');
    transaction = await sequelize.transaction();
    
    // Create a test facility
    console.log('\n🏥 Creating test facility...');
    const testFacility = await Facility.create({
      name: 'Test Facility Direct',
      type: 'Hospital',
      location: 'Test Location',
      contactPerson: 'Test Person',
      contactEmail: 'test@example.com',
      contactPhone: '123-456-7890'
    }, { transaction });
    
    console.log('✅ Test facility created successfully:', {
      id: testFacility.id,
      name: testFacility.name
    });
    
    // Create a test survey
    console.log('\n📋 Creating test survey...');
    const testSurvey = await Survey.create({
      externalId: 'test-direct-' + Date.now(),
      facilityId: testFacility.id,
      facilityData: {
        productiveSectors: ['health'],
        subsectorActivities: ['medical'],
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
    }, { transaction });
    
    console.log('✅ Test survey created successfully:', {
      id: testSurvey.id,
      externalId: testSurvey.externalId
    });
    
    // Commit the transaction
    console.log('\n💾 Committing transaction...');
    await transaction.commit();
    console.log('✅ Transaction committed successfully');
    
    // Verify the created records
    console.log('\n🔍 VERIFYING CREATED RECORDS');
    
    const facility = await Facility.findByPk(testFacility.id);
    console.log(`Facility record exists: ${facility ? '✅' : '❌'}`);
    if (facility) {
      console.log('Facility:', {
        id: facility.id,
        name: facility.name
      });
    }
    
    const survey = await Survey.findOne({ 
      where: { externalId: testSurvey.externalId } 
    });
    console.log(`Survey record exists: ${survey ? '✅' : '❌'}`);
    if (survey) {
      console.log('Survey:', {
        id: survey.id,
        externalId: survey.externalId,
        facilityId: survey.facilityId
      });
    }
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    
    if (error instanceof Error) {
      console.error(`- Error name: ${error.name}`);
      console.error(`- Error message: ${error.message}`);
      console.error(`- Error stack: ${error.stack}`);
      
      // Handle specific database errors
      if (error.name === 'SequelizeValidationError') {
        console.error('- Validation errors:');
        // @ts-ignore: Accessing errors property on SequelizeValidationError
        for (const validationError of error.errors) {
          console.error(`  - ${validationError.path}: ${validationError.message}`);
        }
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        console.error('- Foreign key constraint error. Check that related records exist.');
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        console.error('- Unique constraint error. Record with this unique key already exists.');
      } else if (error.name === 'SequelizeDatabaseError') {
        console.error('- Database error. Check SQL syntax and data types.');
        // Attempt to identify column type mismatches
        const columnMatch = error.message.match(/column "([^"]+)" is of type ([^ ]+) but expression is of type ([^ ]+)/);
        if (columnMatch) {
          console.error(`- Column type mismatch: column "${columnMatch[1]}" expects ${columnMatch[2]} but received ${columnMatch[3]}`);
        }
      }
    } else {
      console.error('- Unknown error:', error);
    }
    
    // Rollback transaction if it was started
    if (transaction) {
      try {
        console.log('\n🔄 Rolling back transaction...');
        await transaction.rollback();
        console.log('✅ Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Error during transaction rollback:', rollbackError);
      }
    }
  } finally {
    // Close the database connection
    try {
      await sequelize.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Run the test
console.log(`⏱️ Test start time: ${new Date().toISOString()}`);
testSurveyInsert()
  .then(() => {
    console.log(`⏱️ Test end time: ${new Date().toISOString()}`);
    console.log('\n====== TEST SUMMARY ======');
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n====== UNHANDLED ERROR ======');
    console.error(`Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`Error message: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack.split('\n').slice(0, 10).join('\n'));
    }
    
    // Try to get more information about database state
    console.log('\n====== DATABASE INSPECTION ======');
    try {
      console.log('Model information:');
      console.log('- Survey model:', Survey ? 'exists' : 'undefined');
      console.log('- Facility model:', Facility ? 'exists' : 'undefined');
      
      if (Survey) {
        console.log('\nSurvey model details:');
        console.log('- Table name:', Survey.tableName);
        console.log('- Model name:', Survey.name);
        console.log('- Attributes:', Object.keys(Survey.getAttributes()));
      }
      
      if (Facility) {
        console.log('\nFacility model details:');
        console.log('- Table name:', Facility.tableName);
        console.log('- Model name:', Facility.name);
        console.log('- Attributes:', Object.keys(Facility.getAttributes()));
      }
    } catch (inspectionError) {
      console.error('Error during model inspection:', inspectionError);
    }
    
    console.log(`\n⏱️ Test end time: ${new Date().toISOString()}`);
    process.exit(1);
  });
