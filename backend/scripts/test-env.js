console.log('🔍 Testing environment variables in plain Node.js...');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Log environment variables
console.log('🔧 Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- DATA_COLLECTION_API_URL:', process.env.DATA_COLLECTION_API_URL || 'not set');
console.log('- DATA_COLLECTION_API_KEY:', process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set');
console.log('- DB_HOST:', process.env.DB_HOST || 'not set');
console.log('- DB_PORT:', process.env.DB_PORT || 'not set');
console.log('- DB_NAME:', process.env.DB_NAME || 'not set');
console.log('- DB_USER:', process.env.DB_USER || 'not set');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? '****' + process.env.DB_PASSWORD.slice(-4) : 'not set');

// Check required variables
const requiredVars = [
  'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'DATA_COLLECTION_API_URL', 'DATA_COLLECTION_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');
