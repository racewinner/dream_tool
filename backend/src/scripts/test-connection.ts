// src/scripts/test-connection.ts
import { Sequelize } from 'sequelize';
import { config } from '../config';

console.log('Starting database connection test...');
console.log('Using database configuration:', {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password ? '***' : '(empty)'
});

const testConnection = async () => {
  const sequelize = new Sequelize({
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT current_database(), current_user, version()');
    console.log('✅ Database info:', results);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('Connection closed.');
  }
};

// Run the test
testConnection()
  .then(success => {
    console.log(success ? '✅ Test completed successfully!' : '❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
