// Script to inspect the compiled Survey model
const path = require('path');
const fs = require('fs');

console.log('=== Survey Model Inspection ===\n');

// Check if the compiled model exists
const modelPath = path.resolve('./dist/models/survey.js');
console.log(`Looking for compiled model at: ${modelPath}`);

if (!fs.existsSync(modelPath)) {
  console.error('Error: Compiled model not found at the expected location.');
  
  // List the dist directory to help with debugging
  const distPath = path.resolve('./dist');
  console.log('\nContents of dist directory:');
  
  try {
    const distContents = fs.readdirSync(distPath);
    console.log(distContents);
    
    // Check if models directory exists
    const modelsPath = path.join(distPath, 'models');
    if (fs.existsSync(modelsPath)) {
      console.log('\nContents of dist/models directory:');
      console.log(fs.readdirSync(modelsPath));
    } else {
      console.log('\nNo models directory found in dist');
    }
  } catch (err) {
    console.error('Error reading dist directory:', err.message);
  }
  
  process.exit(1);
}

console.log('\nFound compiled model. Loading...');

// Try to load the model
try {
  // Use dynamic import for ESM modules
  const { initSurveyModel } = require(modelPath);
  
  console.log('\nSuccessfully loaded initSurveyModel function');
  console.log('Type of initSurveyModel:', typeof initSurveyModel);
  
  // Create a minimal Sequelize instance
  const { Sequelize, DataTypes } = require('sequelize');
  const sequelize = new Sequelize('sqlite::memory:', {
    logging: false
  });
  
  // Try to initialize the model
  try {
    console.log('\nInitializing Survey model...');
    const Survey = initSurveyModel(sequelize);
    
    console.log('\nSurvey model initialized successfully!');
    console.log('Model name:', Survey.name);
    console.log('Table name:', Survey.tableName);
    
    // Log model attributes
    console.log('\nModel attributes:');
    Object.entries(Survey.rawAttributes).forEach(([name, attr]) => {
      console.log(`\n- ${name}:`);
      console.log(`  Type: ${attr.type.key}`);
      console.log(`  Allow null: ${attr.allowNull !== false}`);
      console.log(`  Primary key: ${!!attr.primaryKey}`);
      
      // Special handling for JSON/JSONB types
      if (attr.type instanceof DataTypes.JSONB || attr.type instanceof DataTypes.JSON) {
        console.log('  Field type: JSON/JSONB');
      }
      
      // Show validations if present
      if (attr.validate) {
        console.log('  Validations:', JSON.stringify(attr.validate, null, 2));
      }
    });
    
  } catch (initError) {
    console.error('\nError initializing Survey model:');
    console.error(initError.message);
    
    if (initError.original) {
      console.error('Original error:', initError.original.message);
    }
    
    console.error('\nStack:', initError.stack);
  }
  
} catch (loadError) {
  console.error('\nError loading the model:');
  console.error(loadError.message);
  
  // If it's a module not found error, show more details
  if (loadError.code === 'MODULE_NOT_FOUND') {
    console.error('\nModule not found. This could be due to:');
    console.error('1. The file not being found at the expected location');
    console.error('2. The file using ES modules (import/export) but being required with CommonJS (require)');
    console.error('3. Missing dependencies in the compiled code');
    
    // Try to read the file to check for ES modules syntax
    try {
      const fileContent = fs.readFileSync(modelPath, 'utf8');
      const isESM = fileContent.includes('export ') || fileContent.includes('import ');
      
      console.log('\nFile analysis:');
      console.log('- Uses ES modules:', isESM);
      
      // Check for require statements
      const hasRequire = fileContent.includes('require(');
      console.log('- Uses require():', hasRequire);
      
      // Check for dynamic imports
      const hasDynamicImport = fileContent.includes('import(');
      console.log('- Uses dynamic imports:', hasDynamicImport);
      
    } catch (readError) {
      console.error('\nCould not read the model file:', readError.message);
    }
  }
  
  console.error('\nStack:', loadError.stack);
  process.exit(1);
}
