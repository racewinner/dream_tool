const { Client } = require('pg');
require('dotenv').config();

async function quickDatabaseCheck() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'dream_tool',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
  });

  try {
    console.log('🔍 Testing basic database connection...');
    await client.connect();
    console.log('✅ Database connection successful');

    // Check if key tables exist and their column naming convention
    const tables = ['surveys', 'facilities'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        
        if (result.rows.length > 0) {
          console.log(`\n📋 ${table} table columns:`);
          const columns = result.rows.map(r => r.column_name);
          columns.forEach(col => console.log(`  - ${col}`));
          
          // Analyze naming convention
          const hasSnakeCase = columns.some(col => col.includes('_'));
          const hasCamelCase = columns.some(col => /[a-z][A-Z]/.test(col));
          console.log(`  Naming: ${hasSnakeCase ? 'snake_case' : ''}${hasSnakeCase && hasCamelCase ? ' + ' : ''}${hasCamelCase ? 'camelCase' : ''}`);
        } else {
          console.log(`❌ Table '${table}' does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${table}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   This confirms the backend startup issue');
  } finally {
    await client.end();
  }
}

quickDatabaseCheck().catch(console.error);
