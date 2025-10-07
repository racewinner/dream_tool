import { sequelize } from '../src/config/database';
import { initRawImportModel } from '../src/models/rawImport';

async function ensureRawImportsTable() {
  try {
    console.log('Initializing RawImport model...');
    const RawImport = initRawImportModel(sequelize);
    
    console.log('Synchronizing RawImport table...');
    await RawImport.sync({ force: false, alter: true });
    
    console.log('✅ RawImports table is ready');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ensuring RawImports table:', error);
    process.exit(1);
  }
}

ensureRawImportsTable();
