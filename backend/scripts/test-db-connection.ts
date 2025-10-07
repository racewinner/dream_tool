import { sequelize } from '../src/models';

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    // Log connection details (without password)
    const config = sequelize.config;
    console.log(`📡 Connecting to database: ${config.database}@${config.host}:${config.port} as ${config.username}`);
    
    // Test authentication with timeout
    console.log('🔐 Authenticating...');
    const authPromise = sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Authentication timed out after 10 seconds')), 10000)
    );
    
    await Promise.race([authPromise, timeoutPromise]);
    console.log('✅ Database connection established successfully');
    
    // Test a simple query
    console.log('🔍 Running test query...');
    try {
      const [results] = await sequelize.query('SELECT version()');
      console.log('📊 Database version:', results);
    } catch (queryError) {
      console.error('❌ Test query failed:', queryError);
      throw queryError;
    }
    
    // List all tables in the database
    console.log('📋 Listing database tables...');
    try {
      const [tables] = await sequelize.query(`
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      if (tables.length === 0) {
        console.log('ℹ️ No tables found in the database');
      } else {
        console.log(`📋 Found ${tables.length} tables:`);
        console.table(tables);
      }
      
      // Check for raw_imports table specifically
      const [rawImports] = await sequelize.query(`
        SELECT * FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'raw_imports'
      `);
      
      if (rawImports.length === 0) {
        console.warn('⚠️ raw_imports table not found in the database');
      } else {
        console.log('✅ raw_imports table exists');
      }
      
    } catch (schemaError) {
      console.error('❌ Error listing tables:', schemaError);
      throw schemaError;
    }
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    // Check if it's a connection error
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n🔧 Troubleshooting tips:');
      console.error('1. Is the database server running?');
      console.error('2. Check the database credentials in your .env file');
      console.error('3. Verify the database host and port are correct');
      console.error('4. Check if the database user has the correct permissions');
    }
    
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
      console.log('🔌 Database connection closed');
    } catch (closeError) {
      console.error('Error closing database connection:', closeError);
    }
  }
}

testConnection().catch(console.error);
