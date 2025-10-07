const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize Sequelize with database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false
});

// Define the Survey model
const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  surveyId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'survey_id'
  },
  facilityId: {
    type: DataTypes.INTEGER,
    field: 'facility_id',
    allowNull: true
  },
  rawData: {
    type: DataTypes.JSONB,
    field: 'raw_data',
    allowNull: false
  },
  facilityData: {
    type: DataTypes.JSONB,
    field: 'facility_data',
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at'
  }
}, {
  tableName: 'surveys',
  timestamps: true
});

// Function to transform Kobo survey data to our format
function transformSurveyData(koboData) {
  return {
    surveyId: koboData._id.toString(),
    rawData: koboData,
    facilityData: {
      name: koboData['general_information/Name_HF'],
      type: koboData['general_information/type_healthcare_facility'],
      ownership: koboData['general_information/ownership_facility'],
      region: koboData['general_information/Q3_Region'],
      district: koboData['general_information/Q9_District'],
      coordinates: koboData['general_information/location'],
      // Add more fields as needed
    },
    status: 'imported'
  };
}

async function testImport() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Sync models
    await Survey.sync({ force: false });
    console.log('✅ Database models synced');
    
    // Load the test data from the file
    const testDataPath = path.resolve(__dirname, '../kobo-test-result.json');
    if (!fs.existsSync(testDataPath)) {
      throw new Error('Test data file not found. Please run test-kobo-endpoint.js first.');
    }
    
    const testResult = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    const surveyData = testResult.response?.data;
    
    if (!surveyData) {
      throw new Error('No survey data found in test result');
    }
    
    console.log(`\n📊 Processing survey ID: ${surveyData._id}`);
    
    // Transform the data
    const transformedData = transformSurveyData(surveyData);
    
    // Save to database
    console.log('💾 Saving survey to database...');
    const survey = await Survey.create(transformedData);
    
    console.log('✅ Survey imported successfully!');
    console.log(`- ID: ${survey.id}`);
    console.log(`- Survey ID: ${survey.surveyId}`);
    console.log(`- Facility: ${survey.facilityData.name}`);
    console.log(`- Created: ${survey.createdAt}`);
    
  } catch (error) {
    console.error('\n❌ Error during import test:');
    console.error(error.message);
    
    if (error.errors) {
      console.error('\nValidation errors:');
      error.errors.forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testImport();
