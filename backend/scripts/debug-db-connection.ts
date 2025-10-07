import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

console.log('🚀 Starting database connection debug script...');

// 1. Load environment variables
try {
    dotenv.config();
    console.log('✅ .env file loaded.');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.log('DB_PASSWORD is set:', !!process.env.DB_PASSWORD);
} catch (error) {
    console.error('❌ Failed to load .env file.', error);
    process.exit(1);
}


// 2. Define configuration object, mimicking src/config/index.ts
const dbConfig = {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: String(process.env.DB_PASSWORD || ''),
};

console.log('🔧 Constructed DB config:');
console.log({
    ...dbConfig,
    password: dbConfig.password ? '***' : 'not set'
});


// 3. Initialize Sequelize
let sequelize;
try {
    console.log('🔄 Initializing Sequelize...');
    sequelize = new Sequelize(
        dbConfig.name,
        dbConfig.user,
        dbConfig.password,
        {
            host: dbConfig.host,
            port: dbConfig.port,
            dialect: 'postgres',
            logging: console.log, // Enable full logging
        }
    );
    console.log('✅ Sequelize initialized.');
} catch (error) {
    console.error('❌ Failed to initialize Sequelize.', error);
    process.exit(1);
}


// 4. Authenticate
async function testAuthentication() {
    if (!sequelize) {
        console.error('Sequelize not initialized!');
        return;
    }
    try {
        console.log('🔐 Authenticating with the database...');
        await sequelize.authenticate();
        console.log('🎉 Database connection successful!');
    } catch (error) {
        console.error('🔥 Authentication failed!', error);
    } finally {
        console.log('🔌 Closing connection...');
        await sequelize.close();
        console.log('🚪 Connection closed.');
    }
}

testAuthentication();
