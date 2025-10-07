console.log('🚀 Starting simple test...');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Check required variables
const requiredVars = ['DATA_COLLECTION_API_URL', 'DATA_COLLECTION_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log(`- API URL: ${process.env.DATA_COLLECTION_API_URL}`);
console.log(`- API Key: ${process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set'}`);

// Simple test
console.log('\n✅ Test completed successfully!');
process.exit(0);
