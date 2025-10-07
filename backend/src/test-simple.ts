// Simple TypeScript test script with basic functionality
console.log('🔍 Starting simple TypeScript test...');

// Test TypeScript features
const message: string = 'Hello from TypeScript!';
console.log(`📝 ${message}`);

// Test async/await
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testAsync() {
  console.log('⏳ Testing async/await...');
  await delay(1000);
  console.log('✅ Async/await works!');
}

testAsync().catch(console.error);

console.log('✅ Simple TypeScript test completed');
