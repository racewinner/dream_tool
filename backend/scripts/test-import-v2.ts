import { ImportService } from '../src/services/importService';
import { sequelize } from '../src/models';
import { initializeDatabase } from '../src/models';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Enable detailed logging
const debug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
};

const error = (message: string, err?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${message}`, err || '');
};

// Sample KoboToolbox form submission data
const sampleKoboData = {
  _id: 'kobo-test-123',
  _submission_time: new Date().toISOString(),
  _version_: 'v1',
  facility_name: 'Test Health Center',
  facility_type: 'health_center',
  gps: '-1.2921 36.8219',
  start: new Date().toISOString(),
  end: new Date().toISOString(),
  respondent_name: 'Test User',
  respondent_phone: '+254700000000',
  facility_has_electricity: 'yes',
  facility_has_solar: 'no',
  facility_has_generator: 'yes',
  facility_has_grid: 'yes',
  facility_has_other: 'no',
  facility_equipment_count: '5',
  facility_equipment_types: 'fridge,incubator,microscope',
  facility_equipment_working: 'fridge,incubator',
  facility_equipment_not_working: 'microscope'
};

async function testImport() {
  debug('🚀 Starting import test...');
  
  try {
    // Ensure the database is initialized and tables are created before running the test
    debug('🔌 Initializing database...');
    await initializeDatabase();
    debug('✅ Database initialized');

    debug('🔄 Testing database connection...');
    await sequelize.authenticate();
    debug('✅ Database connected successfully');
    
    debug('🔄 Initializing ImportService...');
    const importService = new ImportService();
    debug('✅ ImportService initialized');
    
    // Queue the import
    debug('📥 Queuing import...');
    let importRecord;
    try {
      importRecord = await importService.queueImport('kobo', sampleKoboData, 1);
      debug(`✅ Import queued with ID: ${importRecord.id}`);
      debug('📋 Raw import record:', JSON.stringify(importRecord.toJSON(), null, 2));
    } catch (queueError) {
      error('❌ Failed to queue import', queueError);
      throw queueError;
    }
    
    // Process pending imports (this will pick up our queued import)
    debug('🔄 Processing pending imports...');
    try {
      const result = await importService.processPendingImports(1);
      console.log('📊 Process results:', JSON.stringify(result, null, 2));
      
      if (result.processed === 0) {
        throw new Error('❌ No imports were processed');
      }
    } catch (error) {
      console.error('❌ Error processing imports:', error);
      throw error;
    }
    
    const importResult = await importService.getImportStatus(importRecord.id);
    console.log('📋 Import status:', importResult.status);
    console.log('📄 Import details:', JSON.stringify(importResult.toJSON(), null, 2));
    
    if (importResult.status === 'failed') {
      console.error('❌ Import failed with error:', importResult.error);
      console.error('🔍 Error details:', importResult.metadata?.errorDetails);
      throw new Error('❌ Import failed');
    }
    
    // Verify the data was saved in the database
    console.log('🔍 Verifying data in database...');
    const [surveys] = await sequelize.query('SELECT * FROM "Surveys" ORDER BY "createdAt" DESC LIMIT 1');
    const [facilities] = await sequelize.query('SELECT * FROM "Facilities" ORDER BY "createdAt" DESC LIMIT 1');
    
    console.log('📊 Latest survey:', JSON.stringify(surveys[0], null, 2));
    console.log('🏥 Latest facility:', JSON.stringify(facilities[0], null, 2));
    
  } catch (error) {
    console.error('❌ Import test failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    try {
      await sequelize.close();
      console.log('🔌 Database connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the test
debug('Starting test execution...');
testImport()
  .then(() => {
    debug('✅ Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    error('❌ Test failed', err);
    process.exit(1);
  });
