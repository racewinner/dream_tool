const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const fs = require('fs');

async function runMigration() {
  const sequelize = new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  });

  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', '20250813_add_active_to_facility_status_enum.js');
    const migration = require(migrationPath);

    console.log('Running migration...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
