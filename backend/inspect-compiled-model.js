// Script to inspect the compiled Survey model's source code
const fs = require('fs');
const path = require('path');

console.log('=== Compiled Survey Model Inspection ===\n');

// Path to the compiled model
const modelPath = path.resolve('./dist/models/survey.js');
console.log(`Inspecting compiled model at: ${modelPath}\n`);

// Check if the file exists
if (!fs.existsSync(modelPath)) {
  console.error('Error: Compiled model not found at the specified path.');
  process.exit(1);
}

// Read the file content
try {
  const content = fs.readFileSync(modelPath, 'utf8');
  
  // Extract relevant parts of the model
  console.log('=== Model Exports ===');
  const exportMatch = content.match(/exports\.(\w+)\s*=/g);
  if (exportMatch) {
    console.log('Exported items:', exportMatch.map(e => e.replace('exports.', '').replace('=', '').trim()));
  } else {
    console.log('No exports found in the expected format');
  }
  
  // Look for the model definition
  console.log('\n=== Model Definition ===');
  const modelDefMatch = content.match(/const Survey = \(sequelize, DataTypes\) => \{[\s\S]*?return Survey;\s*\};/);
  if (modelDefMatch) {
    console.log('Found model definition');
    
    // Look for the facilityData field definition
    const facilityDataMatch = content.match(/facilityData:\s*\{[\s\S]*?type:\s*DataTypes\.(JSONB|JSON)[\s\S]*?\},/);
    if (facilityDataMatch) {
      console.log('\n=== facilityData Field Definition ===');
      console.log(facilityDataMatch[0]);
      
      // Check for validations
      const validationMatch = facilityDataMatch[0].match(/validate:\s*\{[\s\S]*?\}/);
      if (validationMatch) {
        console.log('\nValidations:', validationMatch[0]);
      } else {
        console.log('\nNo validations found for facilityData');
      }
    } else {
      console.log('\nCould not find facilityData field definition');
    }
  } else {
    console.log('Could not find model definition in the expected format');
  }
  
  // Look for the initSurveyModel function
  console.log('\n=== initSurveyModel Function ===');
  const initFuncMatch = content.match(/const initSurveyModel = \(sequelize\) => \{[\s\S]*?\};/);
  if (initFuncMatch) {
    console.log('Found initSurveyModel function');
    
    // Look for associations
    const associationMatch = content.match(/\.(belongsTo|hasMany|hasOne|belongsToMany)\([^)]*\)/g);
    if (associationMatch) {
      console.log('\nAssociations:');
      associationMatch.forEach((assoc, i) => {
        console.log(`  ${i + 1}. ${assoc.trim()}`);
      });
    } else {
      console.log('\nNo associations found');
    }
  } else {
    console.log('Could not find initSurveyModel function');
  }
  
  // Check for any potential issues with ESM/CommonJS interop
  console.log('\n=== Module System ===');
  const hasESM = content.includes('import ') || content.includes('export ');
  const hasRequire = content.includes('require(');
  const hasExports = content.includes('module.exports') || content.includes('exports.');
  
  console.log('Uses ES modules (import/export):', hasESM);
  console.log('Uses CommonJS (require):', hasRequire);
  console.log('Uses CommonJS (exports/module.exports):', hasExports);
  
  if (hasESM && (hasRequire || hasExports)) {
    console.log('\nWARNING: Mixed module systems detected. This could cause issues.');
  }
  
} catch (error) {
  console.error('Error reading or analyzing the compiled model:');
  console.error(error.message);
  process.exit(1);
}

console.log('\n=== Inspection complete ===');
