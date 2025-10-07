// Enable debug logging for all modules
process.env.DEBUG = '*';



import * as fs from 'fs';
import * as path from 'path';
const logFilePath = path.join(process.cwd(), 'test-db-connection.log');








import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';



// Create a simple logging function that writes to both console and a file
const logMessages: string[] = [];

const log = (message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logMessages.push(logMessage);
  try {
    fs.appendFileSync(logFilePath, logMessage + '\n');
  } catch (e) {
    // Fallback: print to console if file write fails
    console.error('Failed to write to log file:', e);
  }
};

// At process exit, write all messages to the log file
process.on('exit', () => {
  try {
    fs.appendFileSync(logFilePath, '\n--- Script finished ---\n');
  } catch (e) {
    // Ignore
  }
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`UNHANDLED REJECTION: ${reason}`);
  if (reason instanceof Error) {
    log(`Stack: ${reason.stack}`);
  }
});

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`UNCAUGHT EXCEPTION: ${error.message}`);
  log(`Stack: ${error.stack}`);
  try {
    fs.appendFileSync(logFilePath, `\n[UNCAUGHT EXCEPTION]\n${error.stack}\n`);
  } catch (e) {}
  process.exit(1);
});

log('🔍 Starting database connection test...');
log(`📂 Current working directory: ${process.cwd()}`);
log(`📦 Node.js version: ${process.version}`);
log(`📦 Platform: ${process.platform} ${process.arch}`);

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
log(`📄 Loading environment variables from: ${envPath}`);

try {
  if (fs.existsSync(envPath)) {
    log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    log(`📝 .env content (first 500 chars): ${envContent.substring(0, 500)}`);
  } else {
    log('❌ .env file does not exist');
  }

  dotenv.config({ path: envPath });
  log('✅ Environment variables loaded successfully');
  log('🔧 Environment variables:');
  log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  log(`  - DB_HOST: ${process.env.DB_HOST}`);
  log(`  - DB_PORT: ${process.env.DB_PORT}`);
  log(`  - DB_NAME: ${process.env.DB_NAME}`);
  log(`  - DB_USER: ${process.env.DB_USER}`);
  log(`  - DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);
} catch (error) {
  log(`❌ Failed to load environment variables: ${error.message}`);
  if (error.stack) {
    log(`Stack: ${error.stack}`);
    try {
      fs.appendFileSync(logFilePath, `\n[ENV ERROR]\n${error.stack}\n`);
    } catch (e) {}
  }
  process.exit(1);
}

async function testConnection() {
  
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'dream_tool',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'password123',
    {
            host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: console.log,
    }
  );

  try {
    log('STEP: About to test database connection...');
    log('🔌 Testing database connection...');
    await sequelize.authenticate();
    log('STEP: Database authenticate() succeeded');
    log('✅ Database connection established successfully');
    
    log('STEP: About to query database version...');
    const [results] = await sequelize.query('SELECT version();');
    log('STEP: Database version query succeeded');
    log('📊 Database version: ' + JSON.stringify(results));
    
    log('STEP: About to list tables...');
    try {
      const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
      log('STEP: Table list query succeeded');
      log('📋 Available tables: ' + JSON.stringify(tables));
    } catch (e) {
      log('STEP: Table list query failed');
      log('⚠️ Could not list tables (this might be expected if the database is empty): ' + (e instanceof Error ? e.message : JSON.stringify(e)));
    }
    log('STEP: Finished all DB operations in try block');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    // Try with host.docker.internal as fallback
    if (error.original && error.original.address === 'localhost') {
      console.log('🔄 Retrying with host.docker.internal...');
      const sequelizeDocker = new Sequelize(
        process.env.DB_NAME || 'dream_tool',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || 'password123',
        {
          host: 'host.docker.internal',
          port: parseInt(process.env.DB_PORT || '5432'),
          dialect: 'postgres',
          logging: console.log,
        }
      );
      
      try {
        await sequelizeDocker.authenticate();
        log('✅ Database connection established successfully with host.docker.internal');
      } catch (error) {
        log('❌ Unable to connect to the database:');
        if (error instanceof Error) {
          log(error.message);
          log(error.stack || '');
        } else {
          log(JSON.stringify(error));
        }
      } finally {
        await sequelize.close();
        log('🔌 Database connection closed');
      }
    }
  } finally {
    await sequelize.close();
    log('🔌 Database connection closed');
  }
}

testConnection().catch((error) => log('UNHANDLED ERROR: ' + (error instanceof Error ? error.stack : JSON.stringify(error))));
