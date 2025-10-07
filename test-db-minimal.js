const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

console.log('🚀 Starting minimal database test...');
console.log('Environment Variables:');
console.log(`- DB_HOST: ${process.env.DB_HOST}`);
console.log(`- DB_PORT: ${process.env.DB_PORT}`);
console.log(`- DB_NAME: ${process.env.DB_NAME}`);
console.log(`- DB_USER: ${process.env.DB_USER}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);

// Create a new Sequelize instance with detailed logging
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: (msg) => console.log(`[SEQUELIZE] ${msg}`),
  }
);

// Define a simple model
const TestModel = sequelize.define('TestModel', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'test_models',
  timestamps: true,
});

async function runTest() {
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
      tables.forEach((table) => console.log(`- ${table.table_name}`));
    } else {
      console.log('No tables found in the database.');
    }

    // Sync the model
    console.log('\n🔄 Syncing TestModel...');
    await TestModel.sync({ force: true });
    console.log('✅ TestModel synced successfully!');

    // Create a test record
    console.log('\n➕ Creating test record...');
    const testRecord = await TestModel.create({
      name: 'Test Record',
      description: 'This is a test record',
    });
    console.log('✅ Test record created:', testRecord.toJSON());

    // List tables again
    const [newTables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    
    console.log('\n📋 Tables after sync:');
    if (Array.isArray(newTables) && newTables.length > 0) {
      newTables.forEach((table) => console.log(`- ${table.table_name}`));
    } else {
      console.log('No tables found after sync.');
    }

    // Query the test record
    const records = await TestModel.findAll();
    console.log('\n📝 Test records in database:', JSON.stringify(records, null, 2));

    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the test
runTest()
  .then(success => {
    console.log(success ? '\n✅ Test completed successfully!' : '\n❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
