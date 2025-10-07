import { config } from 'dotenv';
import path from 'path';

console.log('🔍 Testing environment variable loading...');

// Try loading .env from different possible locations
const envPaths = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  console.log(`\nTrying to load .env from: ${envPath}`);
  const result = config({ path: envPath });
  
  if (result.error) {
    console.log(`❌ Error loading .env from ${envPath}:`, result.error.message);
  } else {
    console.log(`✅ Successfully loaded .env from ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('\n❌ Failed to load .env from any location');
  process.exit(1);
}

// Log environment variables (safely)
console.log('\n🔧 Current environment variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- DATA_COLLECTION_API_URL: ${process.env.DATA_COLLECTION_API_URL || 'not set'}`);
console.log(`- DATA_COLLECTION_API_KEY: ${process.env.DATA_COLLECTION_API_KEY ? '****' + process.env.DATA_COLLECTION_API_KEY.slice(-4) : 'not set'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`- DB_NAME: ${process.env.DB_NAME || 'not set'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`- DB_PASSWORD: ${process.env.DB_PASSWORD ? '****' + process.env.DB_PASSWORD.slice(-4) : 'not set'}`);

// Check if required variables are set
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
