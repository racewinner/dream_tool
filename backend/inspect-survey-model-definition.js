// Script to inspect the Survey model definition
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

console.log('=== Survey Model Definition Inspection ===\n');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false,
  retry: { max: 5, timeout: 60000 }
});

// Load the compiled Survey model
try {
  console.log('Loading Survey model...');
  const { initSurveyModel } = require('./dist/models/survey');
  
  // Initialize the Survey model
  const Survey = initSurveyModel(sequelize);
  
  // Function to print model attributes
  function printModelAttributes(model) {
    console.log(`\n=== ${model.name} Model Attributes ===`);
    console.log(`Table name: ${model.tableName}`);
    console.log('Attributes:');
    
    for (const [attrName, attrDef] of Object.entries(model.rawAttributes)) {
      console.log(`\n- ${attrName}:`);
      console.log(`  Type: ${attrDef.type.key}`);
      console.log(`  Allow null: ${attrDef.allowNull !== false}`);
      console.log(`  Primary key: ${!!attrDef.primaryKey}`);
      console.log(`  Auto increment: ${!!attrDef.autoIncrement}`);
      
      // Special handling for JSON/JSONB types
      if (attrDef.type instanceof DataTypes.JSONB || attrDef.type instanceof DataTypes.JSON) {
        console.log('  Field type: JSON/JSONB');
        
        // Check for validation
        if (attrDef.validate) {
          console.log('  Validations:', JSON.stringify(attrDef.validate, null, 2));
        }
      }
      
      // Show default value if present
      if (attrDef.defaultValue !== undefined) {
        console.log(`  Default value: ${JSON.stringify(attrDef.defaultValue)}`);
      }
    }
  }
  
  // Print the model definition
  printModelAttributes(Survey);
  
  // Check the table structure in the database
  async function checkTableStructure() {
    try {
      console.log('\n=== Checking Database Table Structure ===');
      
      // Sync the model to create the table
      await Survey.sync({ force: true });
      
      // Get table info
      const [results] = await sequelize.query(`PRAGMA table_info(${Survey.tableName});`);
      
      console.log('\nTable columns:');
      console.table(results.map(col => ({
        name: col.name,
        type: col.type,
        notnull: col.notnull,
        dflt_value: col.dflt_value,
        pk: col.pk
      })));
      
      // Check specific column type for facilityData
      const facilityDataCol = results.find(col => col.name === 'facilityData');
      if (facilityDataCol) {
        console.log('\nfacilityData column type:', facilityDataCol.type);
        
        // Test inserting a simple JSON value
        try {
          console.log('\nTesting JSON insertion...');
          const testData = {
            externalId: 'inspect-test-1',
            facilityId: 1,
            facilityData: JSON.stringify({ test: 'value' }),
            collectionDate: new Date(),
            respondentId: 'test-1'
          };
          
          const result = await Survey.create(testData);
          console.log('Successfully inserted test data with ID:', result.id);
          
          // Try to retrieve it
          const found = await Survey.findByPk(result.id);
          console.log('Retrieved facilityData type:', typeof found.facilityData);
          
        } catch (insertError) {
          console.error('\nError testing JSON insertion:');
          console.error('Message:', insertError.message);
          
          if (insertError.original) {
            console.error('Original error:', insertError.original.message);
            if (insertError.original.sql) {
              console.error('SQL:', insertError.original.sql);
            }
          }
          
          console.error('Stack:', insertError.stack);
        }
      } else {
        console.error('facilityData column not found in table');
      }
      
    } catch (error) {
      console.error('Error checking table structure:', error);
      if (error.original) {
        console.error('Original error:', error.original.message);
      }
    }
  }
  
  // Run the table structure check
  await checkTableStructure();
  
} catch (error) {
  console.error('\n=== ERROR ===');
  console.error('Failed to inspect Survey model:', error.message);
  
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('\nModule not found. Check the path to the Survey model.');
  }
  
  console.error('\nStack:', error.stack);
  process.exit(1);
} finally {
  // Close the connection
  await sequelize.close();  
  console.log('\nInspection complete');
}
