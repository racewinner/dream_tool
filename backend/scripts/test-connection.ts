import { Sequelize } from 'sequelize';
import { config } from '../src/config';

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  // Log configuration (without password)
  const dbConfig = {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password ? '***' : 'not set',
    dialect: 'postgres' as const
  };
  
  console.log('📡 Database configuration:', dbConfig);
  
  // Create a new connection
  const sequelize = new Sequelize({
    ...dbConfig,
    password: config.database.password,
    logging: console.log,
    dialectOptions: {
      ssl: false,
      authMechanism: 'DEFAULT'
    },
    pool: {
      max: 1,
      min: 0,
      acquire: 10000,
      idle: 10000
    }
  });
  
  try {
    // Test authentication
    console.log('🔐 Authenticating...');
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test a simple query
    console.log('🔍 Running test query...');
    const [results] = await sequelize.query('SELECT version()');
    console.log('📊 Database version:', results);
    
    // List all tables
    const [tables] = await sequelize.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📋 Found ${tables.length} tables:`);
    console.table(tables);
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Connection closed');
  }
}

testConnection().catch(console.error);
