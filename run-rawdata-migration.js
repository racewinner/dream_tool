const { execSync } = require('child_process');

// Run migration from backend directory where sequelize is installed
try {
  console.log('🔄 Running rawData migration from backend directory...\n');
  
  const result = execSync('node -e "' +
    'const { Sequelize } = require(\'sequelize\'); ' +
    'const sequelize = new Sequelize(\'dream_tool\', \'postgres\', \'password123\', { host: \'postgres\', port: 5432, dialect: \'postgres\', logging: console.log }); ' +
    '(async () => { ' +
      'try { ' +
        'const [results] = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = \'surveys\' AND column_name = \'rawData\'`); ' +
        'if (results.length > 0) { console.log(\'✅ rawData column already exists\'); return; } ' +
        'await sequelize.query(`ALTER TABLE surveys ADD COLUMN \\\"rawData\\\" JSONB`); ' +
        'console.log(\'✅ Successfully added rawData column\'); ' +
        'const [verify] = await sequelize.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'surveys\' AND column_name = \'rawData\'`); ' +
        'console.log(\'✅ Verification:\', verify[0]); ' +
      '} catch (e) { console.error(\'❌ Migration failed:\', e.message); } ' +
      'finally { await sequelize.close(); } ' +
    '})();' +
  '"', { cwd: './backend', encoding: 'utf8' });
  
  console.log(result);
} catch (error) {
  console.error('❌ Migration script failed:', error.message);
}
