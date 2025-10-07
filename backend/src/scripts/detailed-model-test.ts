// Detailed test script to verify Sequelize model initialization and sync
import { sequelize } from '../models';
import dotenv from 'dotenv';

dotenv.config();

// Add detailed logging to Sequelize
sequelize.options.logging = (msg) => {
  console.log('Sequelize:', msg);
};

async function testModels() {
  try {
    console.log('🚀 Starting detailed model test...');

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

    // Log registered models
    console.log('\n📋 Registered Models:');
    const modelNames = Object.keys(sequelize.models);
    console.log(`Found ${modelNames.length} models:`);
    
    for (const name of modelNames) {
      const model = sequelize.models[name];
      console.log(`\n🔍 Model: ${name}`);
      console.log(`- Table name: ${model.tableName}`);
      console.log(`- Attributes:`, Object.keys(model.rawAttributes).join(', '));
      console.log(`- Options:`, JSON.stringify(model.options, null, 2));
      
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
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error during model test:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
console.log('Starting detailed model test...');
testModels()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
