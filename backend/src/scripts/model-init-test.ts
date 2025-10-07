// Test script to verify model initialization
import { sequelize } from '../models';
import dotenv from 'dotenv';

dotenv.config();

async function testModelInitialization() {
  try {
    console.log('🚀 Starting model initialization test...');

    // Test importing each model individually
    console.log('\n📚 Importing models individually...');
    const modelsDir = path.join(__dirname, '..', 'models');
    const modelFiles = fs.readdirSync(modelsDir).filter(file => 
      file.endsWith('.ts') && file !== 'index.ts' && file !== 'index.js'
    );

    for (const file of modelFiles) {
      try {
        console.log(`\n📄 Importing ${file}...`);
        const modelPath = path.join(modelsDir, file);
        const model = require(modelPath);
        console.log(`✅ Successfully imported ${file}`);
        
        // Log model exports
        console.log(`- Exports:`, Object.keys(model).join(', '));
        
        // If it's an init function, log its parameters
        if (model.init) {
          console.log(`- Init function parameters:`, model.init.length);
        }
      } catch (error) {
        console.error(`❌ Error importing ${file}:`, error);
      }
    }

    // Test model registration
    console.log('\n📋 Testing model registration...');
    const modelNames = Object.keys(sequelize.models);
    console.log(`Found ${modelNames.length} models:`);
    
    for (const name of modelNames) {
      const model = sequelize.models[name];
      console.log(`\n🔍 Model: ${name}`);
      console.log(`- Table name: ${model.tableName}`);
      console.log(`- Attributes:`, Object.keys(model.rawAttributes).join(', '));
      
      // Log model initialization function
      if (model.init) {
        console.log(`- Init function exists: true`);
        console.log(`- Init function parameters:`, model.init.length);
      } else {
        console.log(`- Init function exists: false`);
      }
    }

    // Test database connection
    console.log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');

    // Test sync with detailed logging
    console.log('\n🔄 Syncing models...');
    await sequelize.sync({
      force: true,
      logging: (msg) => {
        console.log('Sequelize:', msg);
      }
    });
    console.log('✅ Models synced successfully!');

    return true;
  } catch (error) {
    console.error('❌ Error during model initialization test:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
console.log('Starting model initialization test...');
testModelInitialization()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
