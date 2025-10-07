const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Configure output file
const logFile = path.resolve(__dirname, '../import-test.log');

// Clear previous log file
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

// Simple logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
}

// Load environment variables
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch (error) {
  log(`❌ Error loading .env file: ${error.message}`);
  process.exit(1);
}

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: (msg) => log(`  ${msg}`),
});

// Define models based on existing schema
const Facility = sequelize.define('Facility', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('healthcare', 'education', 'community'),
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true, // NULL is allowed per schema
    defaultValue: 'survey', // Default status from sample data
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // NULL is allowed per schema
    field: 'userId', // Explicitly set the field name to match the database column
  },
  // Timestamps are automatically added by Sequelize
}, {
  tableName: 'facilities',
  timestamps: true, // This will use createdAt and updatedAt
  // Removed underscored: true since we're using camelCase in the database
  // and explicitly defining field names where they differ from property names
});

const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  facilityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'facilityId', // Explicitly set the field name to match the database column
    references: {
      model: 'facilities',
      key: 'id',
    },
  },
  // Add other fields as per your schema
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'data', // Explicitly set the field name
  },
  // Add other fields as per your schema
  rawData: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'rawData', // Explicitly set the field name
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'status',
  },
  // Timestamps are automatically added by Sequelize
}, {
  tableName: 'surveys',
  timestamps: true, // This will use createdAt and updatedAt
  // No need for underscored: true since we're using camelCase
});

// Test data
const testFacility = {
  name: 'Test Health Center',
  type: 'healthcare',
  latitude: -1.2921,  // Default coordinates for Kenya
  longitude: 36.8219,
  status: 'active',
  userId: 1,  // Assuming user with ID 1 exists
};

const testSurvey = {
  data: {
    // Sample survey data structure - adjust based on your actual schema
    surveyId: 'test-001',
    timestamp: new Date().toISOString(),
    // Add other survey fields as needed
  },
};

async function testImport() {
  log('🚀 Starting import test...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    log('✅ Database connection successful');
    
    // Sync models (won't modify existing tables)
    await sequelize.sync();
    log('✅ Models synced');
    
    // Create a test facility
    log('\n🔧 Creating test facility...');
    const facility = await Facility.create(testFacility);
    log(`✅ Created facility: ${facility.id} - ${facility.name}`);
    
    // Create a test survey
    log('\n📝 Creating test survey...');
    const survey = await Survey.create({
      ...testSurvey,
      facilityId: facility.id,
    });
    log(`✅ Created survey: ${survey.id}`);
    
    // Verify the survey was created
    const foundSurvey = await Survey.findByPk(survey.id, {
      include: [{
        model: Facility,
        as: 'facility',
      }],
    });
    
    if (foundSurvey) {
      log('\n📊 Survey details:');
      log(`- ID: ${foundSurvey.id}`);
      log(`- Facility: ${foundSurvey.facility?.name || 'N/A'}`);
      log(`- Created At: ${foundSurvey.createdAt}`);
      log('✅ Survey import test completed successfully!');
    } else {
      throw new Error('Failed to retrieve the created survey');
    }
    
  } catch (error) {
    log(`\n❌ Error during import test: ${error.message}`);
    if (error.errors) {
      log('Validation errors:');
      error.errors.forEach((err) => {
        log(`- ${err.path}: ${err.message}`);
      });
    }
    throw error;
  } finally {
    await sequelize.close();
    log('\n🔌 Database connection closed');
    log('\n🏁 Import test completed');
    log(`📝 Full log saved to: ${logFile}`);
  }
}

// Run the test
testImport().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
  if (error.stack) {
    log(`Stack trace: ${error.stack}`);
  }
  process.exit(1);
});
