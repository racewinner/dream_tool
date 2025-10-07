const { sequelize } = require('./dist/models');

console.log('🔍 Analyzing Sequelize naming strategy and model configuration...');

async function analyzeSequelizeNaming() {
  try {
    console.log('\n📊 Sequelize Configuration Analysis:');
    
    // Check Sequelize instance configuration
    console.log('1. Sequelize Instance Options:');
    console.log('   - Dialect:', sequelize.getDialect());
    console.log('   - Database:', sequelize.config.database);
    console.log('   - Define options:', JSON.stringify(sequelize.options.define, null, 4));
    
    // Check Survey model specifically
    console.log('\n2. Survey Model Analysis:');
    const Survey = sequelize.models.Survey;
    
    if (!Survey) {
      console.log('❌ Survey model not found!');
      return;
    }
    
    console.log('   - Table name:', Survey.tableName);
    console.log('   - Model name:', Survey.name);
    
    // Check model attributes and their field mappings
    console.log('\n3. Survey Model Attributes:');
    const attributes = Survey.getAttributes();
    Object.keys(attributes).forEach(attrName => {
      const attr = attributes[attrName];
      console.log(`   - ${attrName}:`);
      console.log(`     * Type: ${attr.type.constructor.name}`);
      console.log(`     * Field: ${attr.field || 'default'}`);
      console.log(`     * Column: ${attr.columnName || 'not set'}`);
    });
    
    // Test a simple query to see what SQL is generated
    console.log('\n4. Testing Query Generation:');
    console.log('   Attempting to generate SQL for Survey.findAll()...');
    
    try {
      // This will show us the exact SQL being generated
      const queryInterface = sequelize.getQueryInterface();
      console.log('   - Query Interface dialect:', queryInterface.dialect.name);
      
      // Try to build a simple query and see the SQL
      const sql = Survey.build().constructor.QueryGenerator || sequelize.dialect.QueryGenerator;
      console.log('   - QueryGenerator available:', !!sql);
      
    } catch (queryError) {
      console.log('   - Query generation test failed:', queryError.message);
    }
    
    // Check if there are any other models with similar issues
    console.log('\n5. Other Model Field Mappings:');
    ['User', 'Facility'].forEach(modelName => {
      const model = sequelize.models[modelName];
      if (model) {
        console.log(`   ${modelName} model:`);
        const attrs = model.getAttributes();
        Object.keys(attrs).slice(0, 3).forEach(attrName => {
          const attr = attrs[attrName];
          console.log(`     - ${attrName}: field="${attr.field || 'default'}", column="${attr.columnName || 'not set'}"`);
        });
      }
    });
    
    // Check database connection and actual table structure
    console.log('\n6. Database Reality Check:');
    try {
      const [columns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'surveys' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('   Actual database columns:', columns.map(c => c.column_name));
    } catch (dbError) {
      console.log('   Database check failed:', dbError.message);
    }
    
    // Try a direct model query to see the exact error
    console.log('\n7. Direct Model Query Test:');
    try {
      console.log('   Attempting Survey.findOne()...');
      const result = await Survey.findOne({ limit: 1 });
      console.log('   ✅ Query succeeded, result:', !!result);
    } catch (modelError) {
      console.log('   ❌ Model query failed:');
      console.log('   Error name:', modelError.name);
      console.log('   Error message:', modelError.message);
      if (modelError.sql) {
        console.log('   Generated SQL:', modelError.sql);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Analysis failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

analyzeSequelizeNaming().then(() => {
  console.log('\n✅ Sequelize naming analysis completed');
}).catch(error => {
  console.error('\n💥 Analysis error:', error.message);
});
