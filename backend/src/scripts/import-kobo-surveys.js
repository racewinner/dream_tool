/**
 * Script to import real survey data from KoboToolbox v2 API
 * This is a standalone script to test the full data import process
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const axios = require('axios');
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

console.log('========================================');
console.log('KoboToolbox Survey Data Import');
console.log('========================================');

// Get API credentials from environment variables
const apiUrl = process.env.DATA_COLLECTION_API_URL;
const apiKey = process.env.DATA_COLLECTION_API_KEY;

// Database connection from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dream_tool',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// Log configuration
console.log('API URL:', apiUrl);
console.log('API Key:', apiKey ? '***' + apiKey.substring(apiKey.length - 4) : 'Not configured');
console.log('Database:', `${dbConfig.username}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log('----------------------------------------');

// Initialize database connection
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: false
  }
);

// Define models directly in this script based on actual database schema
async function loadModels() {
  console.log('Defining models based on actual database schema...');
  
  try {
    // Define Survey model based on actual 'surveys' table
    const Survey = sequelize.define('Survey', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      external_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      collection_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      respondent_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      facility_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'facilities',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }, {
      tableName: 'surveys',  // Lowercase table name
      timestamps: true,
      underscored: true  // Use snake_case for column names
    });
    
    // Define Facility model based on actual 'facilities' table
    const Facility = sequelize.define('Facility', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,  // Not JSONB based on schema check
        allowNull: true
      },
      contact_person: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    }, {
      tableName: 'facilities',  // Lowercase table name
      timestamps: true,
      underscored: true  // Use snake_case for column names
    });
    
    // Define relationships
    Survey.belongsTo(Facility, { foreignKey: 'facility_id' });
    Facility.hasMany(Survey, { foreignKey: 'facility_id' });
    
    console.log('Models defined successfully based on actual schema');
    return { Survey, Facility };
  } catch (error) {
    console.error('Failed to define models:', error);
    throw error;
  }
}

// Fetch data from KoboToolbox v2 API
async function fetchKoboData() {
  console.log('Fetching data from KoboToolbox v2 API...');
  
  // Ensure URL has trailing slash
  const cleanUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
  
  try {
    const response = await axios({
      method: 'GET',
      url: cleanUrl,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`Retrieved ${response.data?.count || 0} total records`);
    
    // Save sample response for analysis
    fs.writeFileSync(
      path.resolve(__dirname, 'kobo-response-sample.json'),
      JSON.stringify(response.data, null, 2)
    );
    console.log('Sample response saved to kobo-response-sample.json');
    
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching data from KoboToolbox API:');
    
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      
      if (error.response?.data) {
        console.error('Error details:',
          typeof error.response.data === 'string'
            ? error.response.data.substring(0, 500)
            : JSON.stringify(error.response.data, null, 2).substring(0, 500)
        );
      }
    } else {
      console.error(error);
    }
    
    throw new Error('Failed to fetch data from KoboToolbox API');
  }
}

// Transform KoboToolbox data to our model format based on actual database schema
function transformSurveyData(koboData) {
  console.log(`Transforming ${koboData.length} records...`);
  
  return koboData.map(item => {
    try {
      // Extract common fields from KoboToolbox response
      const external_id = item._id || item.id || '';
      const timestamp = item._submission_time || item.timestamp || new Date().toISOString();
      
      // Extract facility data based on actual KoboToolbox form structure
      // Note: These field names are examples - adjust based on actual form fields
      const facilityData = {
        name: extractValue(item, 'facility_name') || extractValue(item, 'general_information/facility_name') || 'Unknown Facility',
        type: extractValue(item, 'facility_type') || extractValue(item, 'general_information/facility_type'),
        // For actual DB schema, location is a string not a JSON object
        location: extractLocationString(item),
        contact_person: extractValue(item, 'contact_person') || extractValue(item, 'general_information/contact_person'),
        contact_email: extractValue(item, 'contact_email') || extractValue(item, 'general_information/contact_email'),
        contact_phone: extractValue(item, 'contact_phone') || extractValue(item, 'general_information/contact_phone')
      };
      
      // Transform to match our actual database schema
      return {
        external_id,
        collection_date: new Date(timestamp),
        respondent_id: extractValue(item, 'respondent/id') || extractValue(item, 'respondent_id') || '',
        raw_data: item,
        facilityData
      };
    } catch (error) {
      console.error(`Error transforming record ${item._id || 'unknown'}:`, error);
      return null;
    }
  }).filter(item => item !== null);
}

// Helper function to convert location object to string format
function extractLocationString(obj) {
  const latitude = extractValue(obj, 'location/latitude') || extractValue(obj, 'gps_coordinates/latitude');
  const longitude = extractValue(obj, 'location/longitude') || extractValue(obj, 'gps_coordinates/longitude');
  const region = extractValue(obj, 'region') || extractValue(obj, 'general_information/region');
  const district = extractValue(obj, 'district') || extractValue(obj, 'general_information/district');
  
  let locationParts = [];
  
  if (latitude && longitude) {
    locationParts.push(`${latitude},${longitude}`);
  }
  
  if (region) {
    locationParts.push(region);
  }
  
  if (district) {
    locationParts.push(district);
  }
  
  return locationParts.length > 0 ? locationParts.join(' - ') : null;
}

// Helper functions for extracting values from nested objects
function extractValue(obj, path) {
  if (!path) return undefined;
  
  const parts = path.split('/');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
}

function extractNumber(obj, path) {
  const value = extractValue(obj, path);
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

function extractBoolean(obj, path) {
  const value = extractValue(obj, path);
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', 'yes', '1'].includes(value.toLowerCase());
  }
  return Boolean(value);
}

function extractArray(obj, path) {
  const value = extractValue(obj, path);
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return value.split(',').map(item => item.trim());
    }
  }
  return [];
}

// Import transformed data into the database using correct schema and column names
async function importSurveyData(transformedData, models) {
  console.log(`Importing ${transformedData.length} records to database...`);
  
  const results = {
    total: transformedData.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    facilities: {
      created: 0,
      updated: 0,
      failed: 0
    }
  };
  
  for (const surveyData of transformedData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if survey already exists using snake_case field names
      const existingSurvey = await models.Survey.findOne({
        where: { external_id: surveyData.external_id },
        transaction
      });
      
      if (existingSurvey) {
        console.log(`Survey ${surveyData.external_id} already exists. Skipping.`);
        results.skipped++;
        await transaction.commit();
        continue;
      }
      
      // Create or update facility
      let facility;
      const facilityName = surveyData.facilityData.name;
      
      try {
        // Use findOrCreate with the correct schema fields
        const [facilityRecord, created] = await models.Facility.findOrCreate({
          where: { name: facilityName },
          defaults: {
            type: surveyData.facilityData.type,
            location: surveyData.facilityData.location,
            contact_person: surveyData.facilityData.contact_person,
            contact_email: surveyData.facilityData.contact_email,
            contact_phone: surveyData.facilityData.contact_phone
          },
          transaction
        });
        
        facility = facilityRecord;
        
        if (created) {
          console.log(`Created new facility: ${facilityName}`);
          results.facilities.created++;
        } else {
          console.log(`Using existing facility: ${facilityName}`);
          results.facilities.updated++;
        }
      } catch (error) {
        console.error(`Failed to create/update facility ${facilityName}:`, error);
        results.facilities.failed++;
        throw error; // Re-throw to trigger transaction rollback
      }
      
      // Create survey record linked to facility using snake_case column names
      try {
        // Set timestamps explicitly
        const now = new Date();
        
        const survey = await models.Survey.create({
          external_id: surveyData.external_id,
          collection_date: surveyData.collection_date,
          respondent_id: surveyData.respondent_id,
          raw_data: surveyData.raw_data,
          facility_id: facility.id,
          created_at: now,
          updated_at: now
        }, { 
          transaction,
          // Skip automatic timestamp handling since we're setting them manually
          silent: true
        });
        
        console.log(`Created survey: ${survey.external_id}`);
        results.imported++;
      } catch (error) {
        console.error(`Failed to create survey ${surveyData.external_id}:`, error);
        console.error('Error details:', error.message);
        if (error.errors) {
          error.errors.forEach(e => console.error(`- ${e.message} (${e.path})`));
        }
        throw error; // Re-throw to trigger transaction rollback
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error(`Transaction failed for survey ${surveyData.external_id}:`, error);
      results.failed++;
    }
  }
  
  return results;
}

// Main function
async function main() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Load models
    const models = await loadModels();
    console.log('Models loaded successfully');
    
    // Fetch data from KoboToolbox
    const koboData = await fetchKoboData();
    console.log(`Fetched ${koboData.length} records from KoboToolbox`);
    
    if (koboData.length === 0) {
      console.log('No data to import. Exiting.');
      return;
    }
    
    // Transform data
    const transformedData = transformSurveyData(koboData);
    console.log(`Transformed ${transformedData.length} records successfully`);
    
    // Import data
    const results = await importSurveyData(transformedData, models);
    
    // Log results
    console.log('\n========================================');
    console.log('Import Results:');
    console.log('----------------------------------------');
    console.log(`Total records: ${results.total}`);
    console.log(`Successfully imported: ${results.imported}`);
    console.log(`Skipped (already exist): ${results.skipped}`);
    console.log(`Failed imports: ${results.failed}`);
    console.log('\nFacility Results:');
    console.log(`Created: ${results.facilities.created}`);
    console.log(`Updated: ${results.facilities.updated}`);
    console.log(`Failed: ${results.facilities.failed}`);
    console.log('========================================');
    
    console.log('Data import complete!');
    
  } catch (error) {
    console.error('Error in main process:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
