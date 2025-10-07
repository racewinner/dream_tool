/**
 * Script to check the actual table names in the database
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const { Sequelize } = require('sequelize');

console.log('========================================');
console.log('Database Schema Check');
console.log('========================================');

// Database connection from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// Log configuration
console.log('Database:', `${dbConfig.username}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log('----------------------------------------');

// Initialize database connection
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: false
  }
);

// Query to get all tables in the database
const tableQuery = `
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name;
`;

// Main function
async function main() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Get all tables
    console.log('\nGetting all tables in the database...');
    const [tables] = await sequelize.query(tableQuery);
    
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    // Check specifically for Survey and Facility tables
    console.log('\nChecking for survey and facility tables:');
    const surveyTables = tables.filter(t => 
      t.table_name.toLowerCase().includes('survey')
    );
    
    const facilityTables = tables.filter(t => 
      t.table_name.toLowerCase().includes('facilit')
    );
    
    if (surveyTables.length > 0) {
      console.log('Found survey tables:');
      surveyTables.forEach(t => console.log(`- ${t.table_name}`));
    } else {
      console.log('No survey tables found');
    }
    
    if (facilityTables.length > 0) {
      console.log('Found facility tables:');
      facilityTables.forEach(t => console.log(`- ${t.table_name}`));
    } else {
      console.log('No facility tables found');
    }
    
    // Get column information for survey table if it exists
    if (surveyTables.length > 0) {
      const surveyTableName = surveyTables[0].table_name;
      console.log(`\nGetting columns for ${surveyTableName}:`);
      
      const columnQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = '${surveyTableName}'
        ORDER BY ordinal_position;
      `;
      
      const [columns] = await sequelize.query(columnQuery);
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    }
    
    // Get column information for facility table if it exists
    if (facilityTables.length > 0) {
      const facilityTableName = facilityTables[0].table_name;
      console.log(`\nGetting columns for ${facilityTableName}:`);
      
      const columnQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = '${facilityTableName}'
        ORDER BY ordinal_position;
      `;
      
      const [columns] = await sequelize.query(columnQuery);
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    }
    
  } catch (error) {
    console.error('Error in database schema check:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the main function
main()
  .then(() => {
    console.log('\n========================================');
    console.log('Schema check completed');
    console.log('========================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
