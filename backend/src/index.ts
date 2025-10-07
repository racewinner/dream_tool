import 'dotenv/config';

// Configuration is now loaded automatically by the config module

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth';

// Import route files
import surveyRoutes from './routes/survey.routes';
import assetRoutes from './routes/asset.routes'; // Fixed: Model and associations resolved
import whatsappRoutes from './routes/whatsapp.routes';
import metricsRoutes from './routes/metrics.routes';
import facilitiesRoutes from './routes/facilities';
// import portfolioRoutes from './routes/portfolio'; // Missing authMiddleware and types
import technoEconomicRoutes from './routes/techno-economic';
import visualizationRoutes from './routes/visualizationRoutes';
// Critical user management routes
import authRoutes from './routes/auth';
import emailVerificationRoutes from './routes/emailVerification';
import solarSystemRoutes from './routes/solarSystem';
import surveyAdvancedRoutes from './routes/survey'; // Advanced survey features
// MCDA routes for multi-criteria decision analysis
import mcdaRoutes from './routes/mcda';
// Enhanced survey analytics routes
import surveyAnalyticsRoutes from './routes/surveyAnalytics';
// Energy modeling routes for centralized energy calculations
import energyRoutes from './routes/energy.routes';
// Import routes - using full import routes for complete functionality
import importRoutes from './routes/import.routes';
import importV2Routes from './routes/importV2.routes';
import mockDataRoutes from './routes/mock-data.routes';
import surveysAnalyticsRoutes from './routes/surveys.routes';
// Role-based access control routes
import settingsRoutes from './routes/settings';
import managementRoutes from './routes/management';
console.log('ℹ️ Using FULL import routes for complete functionality');
import { sequelize } from './models';

// Global error handlers - must be at the top level
process.on('uncaughtException', (error) => {
  console.error('\n🚨 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', error);
  // Attempt a graceful shutdown
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n🚨 UNHANDLED REJECTION! Shutting down...');
  console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
  // Close server & exit process
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

let server: any; // Will hold the server instance

// Define custom error interface
interface ErrorWithStatus extends Error {
  status?: number;
}

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Database config: ${JSON.stringify({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'dream_tool',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD ? '***' : 'not set'
    }, null, 2)}`);

    // Log Node.js and OS information
    console.log('\n📊 System Information:');
    console.log(`- Node.js version: ${process.version}`);
    console.log(`- Platform: ${process.platform} ${process.arch}`);
    console.log(`- Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);

    // Log loaded environment variables (safely)
    console.log('\n🔧 Environment Variables:');
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      JWT_SECRET: process.env.JWT_SECRET ? '***' : 'not set',
    };
    console.table(envVars);

    // Test database connection first
    console.log('\n🔌 Testing database connection...');
    // Test database connection with timeout
    const dbTimeout = setTimeout(() => {
      console.error('❌ Database connection timed out after 10 seconds');
      process.exit(1);
    }, 10000);

    try {
      console.log('🔌 Attempting to authenticate with database...');
      await sequelize.authenticate();
      clearTimeout(dbTimeout);
      console.log('✅ Database connection established successfully');
      
      // Log database version (SQLite compatible)
      try {
        const [dbVersion] = await sequelize.query('SELECT sqlite_version() as version;') as [any[], any];
        const version = dbVersion && dbVersion[0] ? dbVersion[0].version : 'unknown';
        console.log(`📊 SQLite version: ${version}`);
      } catch (versionError) {
        console.log('📊 Database version: SQLite (version query failed)');
      }
      
    } catch (dbError) {
      clearTimeout(dbTimeout);
      console.error('❌ Database connection failed:');
      console.error(dbError);
      console.error('\n💡 Troubleshooting tips:');
      console.error('- Verify PostgreSQL is running and accessible');
      console.error('- Check database credentials in .env file');
      console.error('- Ensure the database exists and user has permissions');
      console.error('- Check if the port is not blocked by a firewall');
      process.exit(1);
    }

    // Enhanced model sync with comprehensive logging and error handling
    console.log('\n🔄 Starting database model synchronization...');
    
    // Check if models are loaded
    console.log('🔍 Checking model registration status...');
    const registeredModels = Object.keys(sequelize.models);
    console.log(`📊 Found ${registeredModels.length} registered models:`, registeredModels);
    
    if (registeredModels.length === 0) {
      console.error('❌ No models are registered with Sequelize!');
      console.error('💡 This indicates a problem with model initialization in models/index.ts');
      process.exit(1);
    }

    // Validate model definitions
    console.log('🔍 Validating model definitions...');
    for (const modelName of registeredModels) {
      const model = sequelize.models[modelName];
      const attributes = Object.keys(model.getAttributes());
      console.log(`✅ Model ${modelName}:`, {
        tableName: model.tableName,
        attributeCount: attributes.length,
        hasTimestamps: model.options.timestamps
      });
    }

    // Perform database sync with detailed logging
    console.log('\n🔄 Synchronizing database models...');
    const syncOptions = { 
      force: false, // Temporarily disabled to avoid Equipment table issues
      alter: false  // Temporarily disabled to avoid Equipment table issues
    };
    
    console.log('📋 Sync options:', syncOptions);
    
    try {
      // Set a timeout for sync operation
      const syncTimeout = setTimeout(() => {
        console.error('❌ Database sync timed out after 30 seconds');
        process.exit(1);
      }, 30000);

      console.log('🔄 Executing sequelize.sync()...');
      await sequelize.sync(syncOptions);
      clearTimeout(syncTimeout);
      
      console.log('✅ Database synchronized successfully!');
      
      // Verify tables were created
      console.log('🔍 Verifying table creation...');
      const [tables] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
      ) as [any[], any];
      
      console.log(`📊 Found ${tables.length} tables in database:`);
      // Debug: Log the actual structure of the first table object
      if (tables.length > 0) {
        console.log('🔍 Debug - First table object structure:', JSON.stringify(tables[0], null, 2));
      }
      
      // Fix: Access the correct property name (could be table_name or tablename)
      tables.forEach((table: any) => {
        const tableName = table.table_name || table.tablename || table.TABLE_NAME || Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });
      
      // Check if expected tables exist
      const expectedTables = registeredModels.map(modelName => 
        sequelize.models[modelName].tableName
      );
      const actualTables = tables.map((t: any) => 
        t.table_name || t.tablename || t.TABLE_NAME || Object.values(t)[0]
      );
      const missingTables = expectedTables.filter(table => !actualTables.includes(table));
      
      if (missingTables.length > 0) {
        console.error('❌ Expected tables not found:', missingTables);
        console.error('💡 This indicates sync completed but tables were not created');
        
        // Try individual model sync as fallback
        console.log('🔄 Attempting individual model sync as fallback...');
        for (const modelName of registeredModels) {
          try {
            console.log(`🔄 Syncing ${modelName}...`);
            await sequelize.models[modelName].sync({ force: true });
            console.log(`✅ ${modelName} synced successfully`);
          } catch (modelSyncError) {
            console.error(`❌ Failed to sync ${modelName}:`, modelSyncError);
          }
        }
      } else {
        console.log('✅ All expected tables created successfully');
      }
      
    } catch (syncError) {
      console.error('❌ Database synchronization failed:');
      console.error(syncError);
      console.error('\n💡 Troubleshooting tips:');
      console.error('- Check model definitions for syntax errors');
      console.error('- Verify database user has CREATE TABLE permissions');
      console.error('- Check for conflicting table names or constraints');
      console.error('- Review model associations for circular dependencies');
      process.exit(1);
    }
    
    // Start HTTP server
    console.log('\n🚀 Starting HTTP server...');
    const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;
    
    // Create HTTP server
    const server = app.listen(portNumber, '0.0.0.0', () => {
      console.log(`✅ Server is running on http://localhost:${port}`);
      console.log('🛣️  Available routes:');
      console.log(`  - GET  /health`);
      console.log(`  - GET  /api/survey`);
      console.log(`  - GET  /api/surveys (advanced)`);
      console.log(`  - GET  /api/facilities`);
      console.log(`  - GET  /api/assets`);
      console.log(`  - GET  /api/solar-systems`);
      console.log(`  - GET  /api/techno-economic`);
      console.log(`  - GET  /api/metrics`);
      console.log(`  - GET  /api/visualization`);
      console.log(`  - POST /api/auth/register`);
      console.log(`  - POST /api/auth/login`);
      console.log(`  - POST /api/email-verification/send`);
      console.log(`  - GET  /api/sites/mcda/criteria`);
      console.log(`  - GET  /api/sites/mcda/comparison-pairs`);
      console.log(`  - GET  /api/sites/mcda/facilities`);
      console.log(`  - POST /api/sites/mcda`);
      console.log(`  - POST /api/import/kobo/surveys`);
      console.log(`  - POST /api/v2/imports`);
      console.log(`  - GET  /api/settings/profile`);
      console.log(`  - POST /api/settings/password`);
      console.log(`  - GET  /api/settings/preferences`);
      console.log(`  - POST /api/settings/preferences`);
      console.log(`  - GET  /api/management/overview`);
      console.log(`  - GET  /api/management/users`);
      console.log(`  - GET  /api/management/system/config`);
    });

    // Enhanced server error handling
    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('❌ Server error:', error);
      
      if (error.syscall !== 'listen') {
        console.error('Non-listen error:', error);
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${port} is already in use`);
          console.log('Try running: netstat -ano | findstr :3001');
          console.log('Then: taskkill /PID <PID> /F');
          process.exit(1);
          break;
        default:
          console.error('Unknown server error:', error);
          throw error;
      }
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Consider restarting the server or performing cleanup
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // Consider restarting the server or performing cleanup
      process.exit(1);
    });
    
    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
    return server;
  } catch (error) {
    console.error('❌ Server startup failed with error:');
    console.error(error);
    process.exit(1);
  }
};

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];
    
    // Allow browser preview URLs (they use dynamic ports)
    if (origin && origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || origin.endsWith('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 600 // Cache preflight request for 10 minutes
}));
app.use(express.json());

// Routes - only use routes that have corresponding files
app.use('/api/survey', surveyRoutes);
app.use('/api/assets', assetRoutes); // Fixed: Model and associations resolved
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/facilities', facilitiesRoutes);
// app.use('/api/portfolio', portfolioRoutes); // Missing authMiddleware and types
app.use('/api/techno-economic', technoEconomicRoutes);
app.use('/api/visualization', authenticate, visualizationRoutes);
// Critical user management routes - enabling orphaned backend functionality
app.use('/api/auth', authRoutes);
app.use('/api/email-verification', emailVerificationRoutes);
app.use('/api/solar-systems', solarSystemRoutes);
app.use('/api/surveys', authenticate, surveysAnalyticsRoutes); // Survey analytics with auth
app.use('/api/surveys-analytics', authenticate, surveyAnalyticsRoutes); // Enhanced analytics with auth
app.use('/api/mock-data', authenticate, mockDataRoutes); // Mock data with auth
// MCDA routes for multi-criteria decision analysis
app.use('/api/sites/mcda', mcdaRoutes);
// Energy modeling routes for centralized energy calculations
app.use('/api/energy', energyRoutes);
// Enhanced role-based access control routes
app.use('/api/settings', authenticate, settingsRoutes);
app.use('/api/management', authenticate, managementRoutes);

// Register v2 import routes
app.use('/api/v2/imports', importV2Routes);

// CRITICAL FIX: Replace conflicting import routes with consolidated production-ready routes
try {
  console.log('🔌 Registering consolidated import routes with validation and authentication...');
  const consolidatedImportRoutes = require('./routes/import.routes.consolidated').default;
  app.use('/api/import', consolidatedImportRoutes);
  console.log('✅ Consolidated import routes registered successfully');
} catch (error) {
  console.error('❌ Error registering consolidated import routes:', error);
  console.error('⚠️ Falling back to basic import routes...');
  app.use('/api/import', importRoutes);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    importRoutesLoaded: true,
    services: {
      database: 'connected',
      import: 'consolidated',
      importV2: 'active'
    },
    routes: {
      importConsolidated: '/api/import',
      importV2: '/api/v2/imports'
    }
  });
});

// Error handling middleware
app.use((err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  console.error('Error middleware:', err.stack);
  const status = err.status || 500;
  res.status(status).json({ 
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Authentication middleware
// const authenticate = (req: Request, res: Response, next: NextFunction) => {
//   // Implement authentication logic here
//   // For now, just allow all requests
//   next();
// };

startServer();
