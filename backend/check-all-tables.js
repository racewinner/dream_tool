const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dream_tool', 'postgres', 'password123', {
  host: 'postgres', port: 5432, dialect: 'postgres', logging: false
});

async function checkAllTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Check all tables in the database
    console.log('\n📊 ALL TABLES IN DATABASE:');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check surveys table specifically
    console.log('\n🔍 SURVEYS TABLE STATUS:');
    try {
      const [surveyCount] = await sequelize.query(`SELECT COUNT(*) as count FROM surveys;`);
      console.log(`  - Total surveys: ${surveyCount[0].count}`);
      
      if (surveyCount[0].count > 0) {
        const [sampleSurvey] = await sequelize.query(`
          SELECT id, "externalId", "facilityId", "collectionDate" 
          FROM surveys 
          LIMIT 3;
        `);
        
        console.log('  - Sample surveys:');
        sampleSurvey.forEach(survey => {
          console.log(`    ID: ${survey.id}, External: ${survey.externalId}, Facility: ${survey.facilityId}`);
        });
      }
    } catch (surveyError) {
      console.log(`  - Error accessing surveys table: ${surveyError.message}`);
    }
    
    // Check facilities table
    console.log('\n🏥 FACILITIES TABLE STATUS:');
    try {
      const [facilityCount] = await sequelize.query(`SELECT COUNT(*) as count FROM facilities;`);
      console.log(`  - Total facilities: ${facilityCount[0].count}`);
      
      if (facilityCount[0].count > 0) {
        const [sampleFacility] = await sequelize.query(`
          SELECT id, name, type, latitude, longitude 
          FROM facilities 
          LIMIT 3;
        `);
        
        console.log('  - Sample facilities:');
        sampleFacility.forEach(facility => {
          console.log(`    ID: ${facility.id}, Name: ${facility.name}, Type: ${facility.type}`);
        });
      }
    } catch (facilityError) {
      console.log(`  - Error accessing facilities table: ${facilityError.message}`);
    }
    
    // Check users table
    console.log('\n👥 USERS TABLE STATUS:');
    try {
      const [userCount] = await sequelize.query(`SELECT COUNT(*) as count FROM users;`);
      console.log(`  - Total users: ${userCount[0].count}`);
      
      if (userCount[0].count > 0) {
        const [sampleUser] = await sequelize.query(`
          SELECT id, email, "firstName", "lastName", "isVerified" 
          FROM users 
          LIMIT 3;
        `);
        
        console.log('  - Sample users:');
        sampleUser.forEach(user => {
          console.log(`    ID: ${user.id}, Email: ${user.email}, Verified: ${user.isVerified}`);
        });
      }
    } catch (userError) {
      console.log(`  - Error accessing users table: ${userError.message}`);
    }
    
    // Check if there are any import-related tables
    console.log('\n📥 IMPORT-RELATED TABLES:');
    const importTables = tables.filter(t => 
      t.table_name.includes('import') || 
      t.table_name.includes('raw') || 
      t.table_name.includes('kobo')
    );
    
    if (importTables.length > 0) {
      for (const table of importTables) {
        try {
          const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.table_name};`);
          console.log(`  - ${table.table_name}: ${count[0].count} records`);
        } catch (error) {
          console.log(`  - ${table.table_name}: Error accessing (${error.message})`);
        }
      }
    } else {
      console.log('  - No import-related tables found');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkAllTables();
