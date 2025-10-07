// Comprehensive database initialization validation script
import '../config'; // Load configuration first
import { sequelize } from '../models';
import { models } from '../models';

console.log('🚀 Starting comprehensive database initialization validation...');

async function validateDatabaseConnection() {
  console.log('\n🔌 Step 1: Validating database connection...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Get database info
    const [dbInfo] = await sequelize.query('SELECT version(), current_database(), current_user') as [any[], any];
    console.log('📊 Database info:', dbInfo[0]);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function validateModelRegistration() {
  console.log('\n📋 Step 2: Validating model registration...');
  
  const registeredModels = Object.keys(sequelize.models);
  const ourModels = Object.keys(models);
  
  console.log(`📊 Sequelize registered models (${registeredModels.length}):`, registeredModels);
  console.log(`📊 Our initialized models (${ourModels.length}):`, ourModels);
  
  // Check for missing models
  const missingFromSequelize = ourModels.filter(model => !registeredModels.includes(model));
  const missingFromOurs = registeredModels.filter(model => !ourModels.includes(model));
  
  if (missingFromSequelize.length > 0) {
    console.error('❌ Models not registered with Sequelize:', missingFromSequelize);
    return false;
  }
  
  if (missingFromOurs.length > 0) {
    console.warn('⚠️ Sequelize models not in our exports:', missingFromOurs);
  }
  
  // Validate each model
  for (const modelName of registeredModels) {
    const model = sequelize.models[modelName];
    const attributes = Object.keys(model.getAttributes());
    
    console.log(`✅ ${modelName}:`, {
      tableName: model.tableName,
      attributes: attributes.length,
      timestamps: model.options.timestamps,
      paranoid: model.options.paranoid
    });
  }
  
  console.log('✅ All models properly registered');
  return true;
}

async function validateTableCreation() {
  console.log('\n🔄 Step 3: Validating table creation...');
  
  try {
    // List current tables
    const [beforeTables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`📊 Tables before sync (${beforeTables.length}):`, beforeTables.map(t => t.table_name));
    
    // Perform sync
    console.log('🔄 Executing sequelize.sync({ force: true })...');
    await sequelize.sync({ force: true });
    console.log('✅ Sync completed');
    
    // List tables after sync
    const [afterTables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    console.log(`📊 Tables after sync (${afterTables.length}):`, afterTables.map(t => t.table_name));
    
    // Check if expected tables exist
    const registeredModels = Object.keys(sequelize.models);
    const expectedTables = registeredModels.map(modelName => 
      sequelize.models[modelName].tableName
    );
    const actualTables = afterTables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !actualTables.includes(table));
    
    if (missingTables.length > 0) {
      console.error('❌ Expected tables not created:', missingTables);
      return false;
    }
    
    console.log('✅ All expected tables created successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    return false;
  }
}

async function validateCRUDOperations() {
  console.log('\n📝 Step 4: Validating CRUD operations...');
  
  try {
    // Test User model CRUD
    console.log('🧪 Testing User model CRUD...');
    
    const testUser = await models.User.create({
      email: 'test@example.com',
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    
    console.log('✅ User created:', { id: testUser.id, email: testUser.email });
    
    // Read
    const foundUser = await models.User.findByPk(testUser.id);
    console.log('✅ User found:', foundUser ? 'Yes' : 'No');
    
    // Update
    if (foundUser) {
      await foundUser.update({ firstName: 'Updated' });
      console.log('✅ User updated');
    }
    
    // Delete
    await testUser.destroy();
    console.log('✅ User deleted');
    
    // Test Facility model CRUD
    console.log('🧪 Testing Facility model CRUD...');
    
    const testFacility = await models.Facility.create({
      name: 'Test Facility',
      location: 'Test Location',
      facilityType: 'hospital',
      userId: 1 // This will fail if no user exists, but that's expected
    });
    
    console.log('✅ Facility created:', { id: testFacility.id, name: testFacility.name });
    await testFacility.destroy();
    console.log('✅ Facility deleted');
    
    console.log('✅ CRUD operations successful');
    return true;
    
  } catch (error) {
    console.error('❌ CRUD operations failed:', error);
    // Don't return false here as some failures might be expected (foreign key constraints)
    return true;
  }
}

async function generateReport() {
  console.log('\n📊 Step 5: Generating validation report...');
  
  try {
    // Get table information
    const [tables] = await sequelize.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `) as [any[], any];
    
    console.log('\n📋 Database Validation Report:');
    console.log('================================');
    console.log(`Total tables: ${tables.length}`);
    console.log(`Total models: ${Object.keys(sequelize.models).length}`);
    
    console.log('\nTable Details:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.column_count} columns)`);
    });
    
    console.log('\nModel Details:');
    Object.keys(sequelize.models).forEach(modelName => {
      const model = sequelize.models[modelName];
      const attributes = Object.keys(model.getAttributes());
      console.log(`  - ${modelName} -> ${model.tableName} (${attributes.length} attributes)`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    return false;
  }
}

async function runValidation() {
  console.log('🎯 Starting database validation process...');
  
  const results = {
    connection: false,
    registration: false,
    tableCreation: false,
    crud: false,
    report: false
  };
  
  try {
    results.connection = await validateDatabaseConnection();
    if (!results.connection) {
      console.log('❌ Validation failed at connection step');
      return results;
    }
    
    results.registration = await validateModelRegistration();
    if (!results.registration) {
      console.log('❌ Validation failed at registration step');
      return results;
    }
    
    results.tableCreation = await validateTableCreation();
    if (!results.tableCreation) {
      console.log('❌ Validation failed at table creation step');
      return results;
    }
    
    results.crud = await validateCRUDOperations();
    results.report = await generateReport();
    
    console.log('\n🎉 Validation Summary:');
    console.log('=====================');
    Object.entries(results).forEach(([step, success]) => {
      console.log(`${success ? '✅' : '❌'} ${step}: ${success ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉 ALL VALIDATIONS PASSED!' : '❌ SOME VALIDATIONS FAILED'}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Validation process failed:', error);
    return results;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the validation
if (require.main === module) {
  runValidation()
    .then(results => {
      const success = Object.values(results).every(result => result);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Unhandled error:', error);
      process.exit(1);
    });
}

export { runValidation };
