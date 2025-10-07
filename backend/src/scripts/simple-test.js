// Simple test script to verify basic functionality
console.log('1. Script started');

// Test basic JavaScript
const test = [1, 2, 3];
console.log('2. Array test:', test);

// Test async/await
(async () => {
  try {
    console.log('3. Inside async function');
    
    // Test a simple timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('4. After timeout');
    
    // Test writing to a file
    const fs = require('fs');
    fs.writeFileSync('test-output.txt', 'Test output from script');
    console.log('5. Wrote to test file');
    
    // Test process exit
    console.log('6. Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
})();

// Keep process alive
setInterval(() => {}, 1000);
