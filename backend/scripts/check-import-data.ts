import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug logging
const debug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

const error = (message: string, err?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${message}`, err || '');
};

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dream_tool',
  password: process.env.DB_PASSWORD || 'password123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkImportData() {
  debug('🔍 Starting import data verification...');
  
  const client = await pool.connect();
  try {
    // Check raw_imports table
    debug('📊 Checking raw_imports table...');
    const rawImportsResult = await client.query(`
      SELECT id, source, status, metadata, created_at, updated_at 
      FROM raw_imports 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (rawImportsResult.rows.length > 0) {
      debug(`✅ Found ${rawImportsResult.rows.length} records in raw_imports table:`, rawImportsResult.rows);
    } else {
      debug('❌ No records found in raw_imports table');
    }
    
    // Check facilities table
    debug('📊 Checking facilities table...');
    const facilitiesResult = await client.query(`
      SELECT id, name, type, latitude, longitude, status, created_at, updated_at 
      FROM facilities 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (facilitiesResult.rows.length > 0) {
      debug(`✅ Found ${facilitiesResult.rows.length} records in facilities table:`, facilitiesResult.rows);
    } else {
      debug('❌ No records found in facilities table');
    }
    
    // Check surveys table
    debug('📊 Checking surveys table...');
    const surveysResult = await client.query(`
      SELECT id, title, status, facility_id, created_at, updated_at 
      FROM surveys 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (surveysResult.rows.length > 0) {
      debug(`✅ Found ${surveysResult.rows.length} records in surveys table:`, surveysResult.rows);
    } else {
      debug('❌ No records found in surveys table');
    }
    
    // Check for relationships (join)
    if (surveysResult.rows.length > 0 && facilitiesResult.rows.length > 0) {
      debug('📊 Checking relationships between surveys and facilities...');
      const joinResult = await client.query(`
        SELECT s.id as survey_id, s.title, f.id as facility_id, f.name 
        FROM surveys s
        JOIN facilities f ON s.facility_id = f.id
        ORDER BY s.created_at DESC
        LIMIT 5
      `);
      
      if (joinResult.rows.length > 0) {
        debug(`✅ Found ${joinResult.rows.length} linked survey-facility records:`, joinResult.rows);
      } else {
        debug('❌ No linked survey-facility records found');
      }
    }
    
    return {
      rawImportsCount: rawImportsResult.rows.length,
      facilitiesCount: facilitiesResult.rows.length,
      surveysCount: surveysResult.rows.length
    };
  } catch (err) {
    error('Error checking import data', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
    debug('🔌 Database connection closed');
  }
}

// Run the check
checkImportData()
  .then((counts) => {
    debug('✅ Data verification completed', counts);
    console.log('\n📊 SUMMARY:');
    console.log(`Raw Imports: ${counts.rawImportsCount}`);
    console.log(`Facilities: ${counts.facilitiesCount}`);
    console.log(`Surveys: ${counts.surveysCount}`);
    process.exit(0);
  })
  .catch(err => {
    error('❌ Data verification failed', err);
    process.exit(1);
  });
