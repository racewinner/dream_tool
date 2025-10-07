/**
 * Debug test script to identify why scripts aren't producing output
 */

// 1. Test basic console output
console.log('1. Basic console.log test');
process.stdout.write('2. process.stdout.write test\n');
console.error('3. console.error test');

// 2. Test uncaught exception handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

// 3. Test unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 4. Test async/await
(async () => {
  try {
    console.log('4. Starting async test');
    
    // 5. Test database connection
    console.log('5. Loading models...');
    const { sequelize } = require('../models');
    console.log('5.1 Models loaded, testing connection...');
    
    // Log connection config (without sensitive data)
    const config = sequelize.config;
    console.log('5.2 Database config:', {
      database: config.database,
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging ? 'enabled' : 'disabled'
    });
    
    // Test connection with timeout
    console.log('5.3 Attempting to authenticate...');
    
    // 6. Test basic query
    console.log('6. Running test query...');
    const [results] = await sequelize.query('SELECT 1+1 as result');
    console.log('7. Query result:', results);
    
    // 7. Test model loading
    console.log('8. Testing model loading...');
    const Survey = sequelize.models.Survey;
    console.log('9. Survey model loaded:', !!Survey);
    
    // 8. Test process exit
    console.log('10. Test completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error in debug test:', error);
    process.exit(1);
  }
})();

// 9. Keep process alive
setInterval(() => {
  // Keep process alive
}, 1000);
