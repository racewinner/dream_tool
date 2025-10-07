import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate that essential variables are loaded
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Create a structured config object
const config = {
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  nrelApiKey: process.env.NREL_API_KEY || '',
  // Data collection API configuration
  dataCollectionApiUrl: process.env.DATA_COLLECTION_API_URL,
  dataCollectionApiKey: process.env.DATA_COLLECTION_API_KEY,
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: String(process.env.DB_PASSWORD || ''),
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    environment: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
};

export { config };
