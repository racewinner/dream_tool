const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running database schema check...\n');

try {
  // Run the database check script
  const result = execSync('node scripts/quick-db-check.js', {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(result);
} catch (error) {
  console.error('❌ Database check failed:', error.message);
  if (error.stdout) {
    console.log('STDOUT:', error.stdout);
  }
  if (error.stderr) {
    console.log('STDERR:', error.stderr);
  }
}
