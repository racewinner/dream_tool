// Simple script to run the survey test and capture errors
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting survey model test runner...');

try {
  // Execute the Jest test with full error output
  const result = execSync(
    'npx jest src/__tests__/survey.model.test.ts --verbose', 
    { 
      stdio: 'pipe',  // Capture output
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '../..')
    }
  );
  
  console.log('TEST SUCCEEDED:');
  console.log(result);
} catch (error) {
  console.log('TEST FAILED:');
  console.log('Exit code:', error.status);
  console.log('Error output:');
  console.log(error.stdout || 'No stdout output');
  console.log(error.stderr || 'No stderr output');
  console.log('Stack trace:');
  console.log(error.stack);
}
