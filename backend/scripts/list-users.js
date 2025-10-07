const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const config = require('../src/config/database');

async function listUsers() {
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

    // Query to get users
    const [users] = await sequelize.query(
      'SELECT id, email, "isVerified" FROM "Users" LIMIT 5;'
    );

    console.log('Users in the database:');
    console.table(users);
  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
listUsers();
