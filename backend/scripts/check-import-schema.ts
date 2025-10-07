import { sequelize } from '../src/models';

async function checkSchema() {
  console.log('🔍 Checking database schema for import functionality...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if raw_imports table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'raw_imports';
    `);
    
    const tableExists = results.length > 0;
    console.log(`📋 raw_imports table: ${tableExists ? '✅ Found' : '❌ Missing'}`);
    
    if (tableExists) {
      // Check table structure
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'raw_imports'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 raw_imports table structure:');
      console.table(columns);
    }
    
    // Check if we can create a test record
    if (tableExists) {
      console.log('\n🧪 Testing raw_imports table with a test record...');
      try {
        const [result] = await sequelize.query(`
          INSERT INTO raw_imports (id, source, data, status, "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            'test',
            '{"test": true}'::jsonb,
            'pending',
            NOW(),
            NOW()
          )
          RETURNING id, status;
        `);
        
        console.log('✅ Successfully inserted test record:', result);
        
        // Clean up
        await sequelize.query(`DELETE FROM raw_imports WHERE source = 'test';`);
        console.log('🧹 Cleaned up test record');
        
      } catch (error) {
        console.error('❌ Error testing raw_imports table:', error);
      }
    }
    
    // Check for required indexes
    if (tableExists) {
      const [indexes] = await sequelize.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'raw_imports';
      `);
      
      console.log('\n🔍 Indexes on raw_imports table:');
      if (indexes.length > 0) {
        console.table(indexes);
      } else {
        console.log('❌ No indexes found - this may impact performance');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the check
checkSchema().catch(console.error);
