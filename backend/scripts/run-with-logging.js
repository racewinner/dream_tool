const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// The script to run (relative to this script)
const scriptToRun = process.argv[2] || 'debug-survey-request.js';
const logFile = path.resolve(__dirname, 'debug-output.log');

console.log(`🚀 Running ${scriptToRun} with full logging...`);
console.log(`📝 Logging output to: ${logFile}`);

// Clear previous log file
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

// Create write stream for logging
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log function that writes to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  logStream.write(logMessage);
}

// Start the script
const child = spawn('node', [scriptToRun], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  env: { ...process.env, FORCE_COLOR: 'true' }
});

// Handle stdout
child.stdout.on('data', (data) => {
  const output = data.toString();
  log(`[STDOUT] ${output}`);
});

// Handle stderr
child.stderr.on('data', (data) => {
  const output = data.toString();
  log(`[STDERR] ${output}`);
});

// Handle process exit
child.on('close', (code) => {
  log(`\nProcess exited with code ${code}`);
  logStream.end();
  
  if (code === 0) {
    log('✅ Script completed successfully');
  } else {
    log('❌ Script failed');
  }
  
  // Show the last 20 lines of the log
  const logContent = fs.readFileSync(logFile, 'utf8').split('\n');
  console.log('\n=== Last 20 lines of log ===');
  logContent.slice(-20).forEach(line => console.log(line));
  console.log('============================');
  console.log(`\n📝 Full log available at: ${logFile}`);
  
  process.exit(code);
});

// Handle errors
child.on('error', (error) => {
  log(`Error: ${error.message}`);
  logStream.end();
  process.exit(1);
});
