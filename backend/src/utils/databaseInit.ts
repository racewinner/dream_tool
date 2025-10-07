/**
 * Database initialization utility
 * 
 * Handles database connection, model synchronization,
 * and table creation for the application.
 */

import { sequelize } from '../models';

/**
 * Initialize the database with all models
 * 
 * This function:
 * 1. Tests the database connection
 * 2. Logs information about registered models
 * 3. Synchronizes model definitions with database tables
 * 4. Verifies table creation
 * 
 * @param options Configuration options for initialization
 * @returns Promise resolving to true if successful
 */
export async function initializeDatabase(options: {
  force?: boolean;  // Drop tables before creation
  alter?: boolean;  // Alter existing tables
  logLevel?: 'minimal' | 'normal' | 'verbose';
} = {}): Promise<boolean> {
  const {
    force = false,
    alter = true,
    logLevel = 'normal'
  } = options;
  
  const log = (message: string, level: 'minimal' | 'normal' | 'verbose' = 'normal') => {
    const logLevels = { minimal: 1, normal: 2, verbose: 3 };
    if (logLevels[level] <= logLevels[logLevel]) {
      console.log(message);
    }
  };
  
  try {
    // 1. Test database connection
    log('🔌 Testing database connection...', 'minimal');
    await sequelize.authenticate();
    log('✅ Database connection established successfully', 'minimal');
    
    // 2. Log model information
    log('🔍 Checking model registration status...', 'normal');
    const registeredModels = Object.keys(sequelize.models);
    log(`📊 Found ${registeredModels.length} registered models: ${registeredModels.join(', ')}`, 'normal');
    
    if (registeredModels.length === 0) {
      throw new Error('No models are registered with Sequelize');
    }
    
    // Log model definitions for verbose output
    if (logLevel === 'verbose') {
      log('📋 Model details:', 'verbose');
      for (const modelName of registeredModels) {
        const model = sequelize.models[modelName];
        const attributes = Object.keys(model.getAttributes());
        log(`  - Model ${modelName}:`, 'verbose');
        log(`    Table: ${model.tableName}`, 'verbose');
        log(`    Attributes: ${attributes.join(', ')}`, 'verbose');
        log(`    HasTimestamps: ${model.options.timestamps}`, 'verbose');
      }
    }
    
    // 3. Sync models with database
    log('\n🔄 Synchronizing database models...', 'minimal');
    log(`📋 Sync options: force=${force}, alter=${alter}`, 'normal');
    
    await sequelize.sync({ force, alter });
    log('✅ Database synchronized successfully!', 'minimal');
    
    // 4. Verify table creation
    log('🔍 Verifying table creation...', 'normal');
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    ) as [any[], any];
    
    log(`📊 Found ${tables.length} tables in database:`, 'normal');
    tables.forEach((table: any) => log(`  - ${table.table_name}`, 'normal'));
    
    // Check if expected tables exist
    const expectedTableNames = registeredModels.map(
      model => sequelize.models[model].tableName.toLowerCase()
    );
    
    const actualTableNames = tables.map((t: any) => t.table_name.toLowerCase());
    
    const missingTables = expectedTableNames.filter(
      name => !actualTableNames.includes(name)
    );
    
    if (missingTables.length > 0) {
      log(`⚠️ Warning: Some expected tables are missing: ${missingTables.join(', ')}`, 'minimal');
    } else {
      log('✅ All expected tables exist in the database', 'normal');
    }
    
    return true;
  } catch (error) {
    log('\n❌ Database initialization failed:', 'minimal');
    
    if (error instanceof Error) {
      log(`- Error name: ${error.name}`, 'minimal');
      log(`- Error message: ${error.message}`, 'minimal');
      log(`- Error stack: ${error.stack}`, 'verbose');
    } else {
      log(`- Unknown error: ${String(error)}`, 'minimal');
    }
    
    return false;
  }
}
