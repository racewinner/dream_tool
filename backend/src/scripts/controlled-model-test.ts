// Controlled test script to verify model initialization
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Create a new Sequelize instance
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dream_tool',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  logging: console.log
});

// Import models directly
const modelsDir = path.join(__dirname, '..', 'models');

// Import model files
const modelFiles = fs.readdirSync(modelsDir).filter(file => 
  file.endsWith('.ts') && file !== 'index.ts' && file !== 'index.js'
);

// Initialize models
const models = {};
for (const file of modelFiles) {
  try {
    console.log(`\n📄 Initializing model from ${file}...`);
    const modelPath = path.join(modelsDir, file);
    const model = require(modelPath);
    
    // Get model name from file name (remove .ts)
    const modelName = file.replace('.ts', '');
    
    // Initialize model
    if (model.init) {
      console.log(`- Initializing ${modelName}...`);
      models[modelName] = model.init(sequelize);
      console.log(`✅ ${modelName} initialized`);
    } else {
      console.log(`❌ No init function found in ${modelName}`);
    }
  } catch (error) {
    console.error(`❌ Error initializing ${file}:`, error);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
  }
}

// Test database connection
async function testConnection() {
  try {
    console.log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    // List current tables
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📋 Current tables in database:');
    if (Array.isArray(tables) && tables.length > 0) {
      tables.forEach((table: any) => console.log(`- ${table.table_name}`));
    } else {
      console.log('No tables found in the database.');
    }

    // Sync models
    console.log('\n🔄 Syncing models...');
    await sequelize.sync({
      force: true,
      logging: console.log
    });
    console.log('✅ Models synced successfully!');

    // List tables after sync
    const [newTables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📋 Tables after sync:');
    if (Array.isArray(newTables) && newTables.length > 0) {
      newTables.forEach((table: any) => console.log(`- ${table.table_name}`));
    } else {
      console.log('No tables found after sync.');
    }

    return true;
  } catch (error) {
    console.error('❌ Error during connection test:', error);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    return false;
  } finally {
    try {
      await sequelize.close();
      console.log('\n🔌 Database connection closed.');
    } catch (error) {
      console.error('❌ Error closing connection:', error);
    }
  }
}

// Run the test
console.log('🚀 Starting controlled model test...');
testConnection()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    process.exit(1);
  });
