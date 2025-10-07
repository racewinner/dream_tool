import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dream_tool',
  password: process.env.DB_PASSWORD || 'password123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkTables() {
  console.log('🔍 Checking database tables...');
  const client = await pool.connect();
  
  try {
    // List all tables
    const tablesRes = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`
    );
    
    const tables = tablesRes.rows.map(row => row.table_name);
    console.log('\n📋 All tables in database:');
    console.table(tables);
    
    // Check for raw_imports table specifically
    const hasRawImports = tables.includes('raw_imports');
    console.log('\n🔎 raw_imports table exists:', hasRawImports ? '✅ Yes' : '❌ No');
    
    if (hasRawImports) {
      // Show raw_imports table structure
      const structureRes = await client.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'raw_imports'
         ORDER BY ordinal_position`
      );
      
      console.log('\n📊 raw_imports table structure:');
      console.table(structureRes.rows);
    }
    
    return tables;
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkTables()
  .then(() => console.log('\n✅ Table check completed'))
  .catch(err => console.error('\n❌ Table check failed:', err));
