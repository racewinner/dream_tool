import { Sequelize, QueryTypes } from 'sequelize';
import sequelize from '../src/config/database';

async function checkTableExists() {
  console.log('Starting raw_imports table check...');
  
  try {
    // Test the database connection first
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // List all tables in the database
    console.log('\nListing all tables in the database...');
    const allTables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`,
      { type: QueryTypes.SELECT }
    );
    
    console.log('\nFound tables:', allTables.map((t: any) => t.table_name).join(', '));
    
    // Check specifically for raw_imports table
    console.log('\nChecking for raw_imports table...');
    const [results] = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'raw_imports'`,
      { type: QueryTypes.SELECT }
    );

    if (results) {
      console.log('✅ raw_imports table exists');
      
      // Get table structure if it exists
      const tableInfo = await sequelize.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'raw_imports'`,
        { type: QueryTypes.SELECT }
      );
      
      console.log('\nTable structure:', tableInfo);
    } else {
      console.log('❌ raw_imports table does not exist');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\nClosing database connection...');
    await sequelize.close();
    console.log('Database connection closed');
  }
}

console.log('Starting script...');
checkTableExists()
  .then(() => console.log('✅ Script completed'))
  .catch(err => console.error('❌ Script failed:', err));
