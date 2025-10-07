// Simple TypeScript test script
console.log('🔍 Starting TypeScript test script...');

// Test TypeScript features
const message: string = 'Hello, TypeScript!';
console.log(`📝 Message: ${message}`);

// Test async/await
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testAsync() {
  console.log('⏳ Testing async/await...');
  await delay(1000);
  console.log('✅ Async/await works!');
}

testAsync().catch(console.error);

console.log('✅ TypeScript test script completed');
