// Enhanced test script to verify model initialization with detailed logging
import { sequelize } from '../models';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Add detailed error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n🚨 UNHANDLED REJECTION!');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n🚨 UNCAUGHT EXCEPTION!');
  console.error('Error:', error);
  process.exit(1);
});

async function testEnhancedModels() {
  try {
    console.log('🚀 Starting enhanced model test...');

    // Log environment variables
    console.log('\n⚙️ Environment Variables:');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`- DB_HOST: ${process.env.DB_HOST}`);
    console.log(`- DB_PORT: ${process.env.DB_PORT}`);
    console.log(`- DB_NAME: ${process.env.DB_NAME}`);
    console.log(`- DB_USER: ${process.env.DB_USER}`);
    console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);

    // Log Sequelize configuration
    console.log('\n⚙️ Sequelize Configuration:');
    console.log(`- Dialect: ${sequelize.options.dialect}`);
    console.log(`- Host: ${sequelize.options.host}`);
    console.log(`- Database: ${sequelize.options.database}`);
    console.log(`- Port: ${sequelize.options.port}`);

    // Log model directory contents
    console.log('\n📂 Model Directory Contents:');
    const modelsDir = path.join(__dirname, '..', 'models');
    const files = fs.readdirSync(modelsDir);
    files.forEach(file => console.log(`- ${file}`));

    // Test importing each model individually
    console.log('\n📚 Importing models individually...');
    const modelFiles = files.filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'index.js');

    for (const file of modelFiles) {
      try {
        console.log(`\n📄 Importing ${file}...`);
        const modelPath = path.join(modelsDir, file);
        const model = require(modelPath);
        console.log(`✅ Successfully imported ${file}`);
        
        // Log model exports
        console.log(`- Exports:`, Object.keys(model).join(', '));
        
        // Check for model initialization
        if (model.init) {
          console.log(`- Found init function`);
          console.log(`- Parameters:`, model.init.length);
        } else {
          console.log(`- No init function found`);
        }
      } catch (error) {
        console.error(`❌ Error importing ${file}:`, error);
        if (error.stack) {
          console.error(`Stack trace: ${error.stack}`);
        }
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

      // Log associations
      console.log(`- Associations:`);
      if (model.associations) {
        Object.keys(model.associations).forEach(assoc => {
          console.log(`  - ${assoc}:`, model.associations[assoc].type);
        });
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

    // Test creating a test record in one of the models
    console.log('\n🧪 Testing record creation...');
    const User = sequelize.models.User;
    if (User) {
      try {
        const testUser = await User.create({
          email: 'test@example.com',
          password: 'testpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          isVerified: true
        });
        console.log('✅ Test user created:', testUser.toJSON());
      } catch (error) {
        console.error('❌ Error creating test user:', error);
        if (error.stack) {
          console.error(`Stack trace: ${error.stack}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error during model test:', error);
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
console.log('Starting enhanced model test...');
testEnhancedModels()
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
