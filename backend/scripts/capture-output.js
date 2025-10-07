const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// The script to run (relative to this script)
const scriptToRun = path.resolve(__dirname, 'direct-debug.js');
const outputFile = path.resolve(__dirname, '../captured-output.log');

console.log(`🚀 Running ${scriptToRun} with output capture...`);

// Clear previous output file
if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

// Create a write stream for the output
const outputStream = fs.createWriteStream(outputFile);

// Log function that writes to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  outputStream.write(logMessage);
}

// Start the script
const child = spawn('node', [scriptToRun], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
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
  outputStream.end();
  
  // Show the output file location
  console.log(`\n📝 Output captured in: ${outputFile}`);
  
  // Display the last 20 lines of the output
  try {
    const outputContent = fs.readFileSync(outputFile, 'utf8');
    const lines = outputContent.split('\n');
    console.log('\n=== Last 20 lines of output ===');
    console.log(lines.slice(-20).join('\n'));
    console.log('==============================');
  } catch (err) {
    console.error('Error reading output file:', err);
  }
  
  process.exit(code);
});

// Handle errors
child.on('error', (error) => {
  log(`Error: ${error.message}`);
  outputStream.end();
  process.exit(1);
});
