// Test script to verify database connection and model initialization
import { config } from '../config';
import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting database and model initialization test...');

// Log environment variables
console.log('\n⚙️ Environment Variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log(`- DB_PORT: ${process.env.DB_PORT}`);
console.log(`- DB_NAME: ${process.env.DB_NAME}`);
console.log(`- DB_USER: ${process.env.DB_USER}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);

// Create a new Sequelize instance with detailed logging
const sequelize = new Sequelize(config.database.name, config.database.user, config.database.password, {
  host: config.database.host,
  port: config.database.port,
  dialect: 'postgres',
  logging: (msg) => {
    console.log(`[SEQUELIZE] ${msg}`);
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

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

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testModelInitialization() {
  try {
    console.log('\n📚 Testing model initialization...');
    
    // Import models directory
    const modelsDir = path.join(__dirname, '..', 'models');
    const modelFiles = fs.readdirSync(modelsDir)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'index.js');
    
    console.log(`Found ${modelFiles.length} model files:`);
    
    for (const file of modelFiles) {
      try {
        console.log(`\n📄 Importing ${file}...`);
        const modelPath = path.join(modelsDir, file);
        const modelModule = require(modelPath);
        
        if (modelModule.init) {
          console.log(`- Found init function in ${file}`);
          const model = modelModule.init(sequelize);
          console.log(`✅ Successfully initialized model from ${file}`);
          console.log(`- Model name: ${model.name}`);
          console.log(`- Table name: ${model.tableName}`);
          
          // Test sync for this model
          console.log(`- Testing sync for ${model.name}...`);
          await model.sync({ force: true });
          console.log(`✅ Successfully synced ${model.name}`);
        } else {
          console.log(`- No init function found in ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error initializing model from ${file}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Model initialization test failed:', error);
    return false;
  }
}

async function runTests() {
  try {
    const connectionSuccess = await testConnection();
    if (!connectionSuccess) {
      console.log('\n❌ Database connection test failed. Exiting...');
      process.exit(1);
    }
    
    const modelInitSuccess = await testModelInitialization();
    if (!modelInitSuccess) {
      console.log('\n❌ Model initialization test failed.');
    } else {
      console.log('\n✅ All tests completed successfully!');
    }
  } catch (error) {
    console.error('❌ Unhandled error in test suite:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the tests
runTests();
