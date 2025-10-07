/**
 * Direct SQL Table Creation Script
 * 
 * This script bypasses Sequelize's sync mechanism and creates tables directly
 * with SQL to ensure correct naming and structure.
 */

import '../config'; // Load environment variables first
import { sequelize } from '../models';

async function createTablesDirect() {
  console.log('\n====================================');
  console.log('🔧 DIRECT SQL TABLE CREATION');
  console.log('====================================\n');
  
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check existing tables first
    console.log('\n📊 Current database tables:');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    tables.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Drop tables if they exist (using IF EXISTS to avoid errors)
    console.log('\n🗑️ Dropping existing tables...');
    await sequelize.query('DROP TABLE IF EXISTS "surveys" CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS "facilities" CASCADE');
    console.log('✅ Tables dropped (if they existed)');
    
    // Create facilities table first (since it's referenced by surveys)
    console.log('\n📝 Creating facilities table...');
    await sequelize.query(`
      CREATE TABLE facilities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(255),
        location VARCHAR(255),
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Facilities table created successfully');
    
    // Create surveys table
    console.log('\n📝 Creating surveys table...');
    await sequelize.query(`
      CREATE TABLE surveys (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255) NOT NULL UNIQUE,
        facility_id INTEGER NOT NULL REFERENCES facilities(id),
        facility_data JSONB NOT NULL,
        collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
        respondent_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Surveys table created successfully');
    
    // Verify tables and columns after creation
    console.log('\n🔍 Verifying table creation:');
    const [tablesAfter] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    tablesAfter.forEach((t: any) => console.log(`- ${t.table_name}`));
    
    // Check facilities table structure
    console.log('\n📋 Facilities table structure:');
    const [facilityColumns] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'facilities' ORDER BY ordinal_position"
    ) as [any[], any];
    
    facilityColumns.forEach((col: any) => console.log(`- ${col.column_name}: ${col.data_type}`));
    
    // Check surveys table structure
    console.log('\n📋 Surveys table structure:');
    const [surveyColumns] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'surveys' ORDER BY ordinal_position"
    ) as [any[], any];
    
    surveyColumns.forEach((col: any) => console.log(`- ${col.column_name}: ${col.data_type}`));
    
    // Test inserting a facility
    console.log('\n🧪 Testing facility insertion...');
    const [facilityResult] = await sequelize.query(`
      INSERT INTO facilities (name, type, location, contact_person, contact_email, contact_phone)
      VALUES ('Test Facility', 'Hospital', 'Test Location', 'Test Person', 'test@example.com', '123-456-7890')
      RETURNING id
    `) as [any[], any];
    
    const facilityId = facilityResult[0].id;
    console.log(`✅ Facility inserted with ID: ${facilityId}`);
    
    // Test inserting a survey
    console.log('\n🧪 Testing survey insertion...');
    const surveyData = {
      externalId: 'test-survey-' + Date.now(),
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
      }
    };
    
    const [surveyResult] = await sequelize.query(`
      INSERT INTO surveys (
        external_id, 
        facility_id, 
        facility_data, 
        collection_date, 
        respondent_id
      )
      VALUES (
        :externalId,
        :facilityId,
        :facilityData,
        CURRENT_TIMESTAMP,
        'test-user'
      )
      RETURNING id
    `, {
      replacements: {
        externalId: surveyData.externalId,
        facilityId: facilityId,
        facilityData: JSON.stringify(surveyData.facilityData)
      }
    }) as [any[], any];
    
    const surveyId = surveyResult[0].id;
    console.log(`✅ Survey inserted with ID: ${surveyId}`);
    
    console.log('\n✅ All database operations completed successfully');
    
  } catch (error) {
    console.error('\n❌ Script failed:');
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
createTablesDirect()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
