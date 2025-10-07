import { Sequelize, Options } from 'sequelize';
import { config } from './index';

// Log database connection details (without password)
console.log('Using database configuration:', {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password ? '***' : 'not set',
  dialect: 'postgres'
});

// Define the connection options in a structured way
const options: Options = {
  dialect: 'postgres',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: String(config.database.password || ''), // Explicitly cast to string as a safeguard
  logging: config.server.environment === 'development' ? console.log : false,
  dialectOptions: {
    ssl: false, // Disable SSL for local development
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3,
    timeout: 30000,
    backoffBase: 1000,
    backoffExponent: 1.5,
  },
  define: {
    timestamps: true,
    // underscored: true, // Removed - was causing snake_case conversion issues
  },
};

// Create the Sequelize instance using the single options object
const sequelize = new Sequelize(options);

export default sequelize;
