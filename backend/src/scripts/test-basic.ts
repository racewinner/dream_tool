console.log('===== BASIC TEST SCRIPT =====');
console.log('1. Script is running');

// Test basic TypeScript features
const testArray = [1, 2, 3];
console.log('2. Array test:', testArray);

// Test async/await
async function testAsync() {
  return new Promise((resolve) => {
    setTimeout(() => resolve('3. Async test passed'), 100);
  });
}

// Run the test
(async () => {
  try {
    const result = await testAsync();
    console.log(result);
    
    // Test database connection
    console.log('4. Testing database connection...');
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    console.log('5. Database connection successful!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log('6. Database query result:', results);
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    process.exit(1);
  }
})();
