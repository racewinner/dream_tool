const { sequelize } = require('./dist/models');

console.log('🔍 Checking actual database table structure...');

async function checkTableStructure() {
  try {
    // Test database connection
    console.log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if surveys table exists
    console.log('\n📊 Checking surveys table structure...');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveys'"
    );
    
    if (tables.length === 0) {
      console.log('❌ Surveys table does not exist');
      return;
    }
    
    console.log('✅ Surveys table exists');

    // Get column information for surveys table
    console.log('\n📋 Getting column information for surveys table...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'surveys'
      ORDER BY ordinal_position
    `);

    console.log(`\n📊 Found ${columns.length} columns in surveys table:`);
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });

    // Check specifically for external ID columns
    const externalIdColumns = columns.filter(col => 
      col.column_name.toLowerCase().includes('external')
    );
    
    if (externalIdColumns.length > 0) {
      console.log('\n🔍 External ID related columns:');
      externalIdColumns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('\n❌ No external ID columns found in surveys table');
    }

    // Check table indexes
    console.log('\n📋 Checking table indexes...');
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'surveys'
    `);

    if (indexes.length > 0) {
      console.log(`\n📊 Found ${indexes.length} indexes on surveys table:`);
      indexes.forEach((idx, index) => {
        console.log(`  ${index + 1}. ${idx.indexname}`);
        console.log(`     ${idx.indexdef}`);
      });
    } else {
      console.log('\n❌ No indexes found on surveys table');
    }

  } catch (error) {
    console.error('\n💥 Error checking table structure:', error.message);
    if (error.sql) {
      console.error('SQL Query:', error.sql);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkTableStructure().then(() => {
  console.log('\n✅ Table structure check completed');
}).catch(error => {
  console.error('\n💥 Check failed:', error.message);
});
