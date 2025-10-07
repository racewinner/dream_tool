const fs = require('fs');
const path = require('path');

/**
 * Verify all required dependencies for DREAM TOOL production deployment
 */

const REQUIRED_DEPENDENCIES = {
  // Core dependencies
  'express': '^4.18.0',
  'express-validator': '^7.0.0',
  'multer': '^1.4.0',
  'cors': '^2.8.0',
  'dotenv': '^16.0.0',
  
  // Database
  'sequelize': '^6.32.0',
  'pg': '^8.11.0',
  'pg-hstore': '^2.3.0',
  
  // Authentication & Security
  'jsonwebtoken': '^9.0.0',
  'bcryptjs': '^2.4.0',
  'helmet': '^7.0.0',
  
  // External integrations
  'axios': '^1.4.0',
  'csv-parser': '^3.0.0',
  
  // Utilities
  'uuid': '^9.0.0',
  'moment': '^2.29.0'
};

const DEV_DEPENDENCIES = {
  '@types/express': '^4.17.0',
  '@types/multer': '^1.4.0',
  '@types/node': '^20.0.0',
  'typescript': '^5.0.0',
  'ts-node': '^10.9.0',
  'nodemon': '^3.0.0'
};

async function verifyDependencies() {
  console.log('🔍 Verifying DREAM TOOL dependencies...\n');
  
  try {
    // Read package.json
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log(`📦 Project: ${packageJson.name} v${packageJson.version}\n`);
    
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    let missingDeps = [];
    let missingDevDeps = [];
    
    // Check production dependencies
    console.log('🔍 Checking production dependencies:');
    for (const [dep, version] of Object.entries(REQUIRED_DEPENDENCIES)) {
      if (dependencies[dep]) {
        console.log(`  ✅ ${dep}: ${dependencies[dep]}`);
      } else {
        console.log(`  ❌ ${dep}: MISSING (required: ${version})`);
        missingDeps.push(`${dep}@${version}`);
      }
    }
    
    // Check development dependencies
    console.log('\n🔍 Checking development dependencies:');
    for (const [dep, version] of Object.entries(DEV_DEPENDENCIES)) {
      if (devDependencies[dep]) {
        console.log(`  ✅ ${dep}: ${devDependencies[dep]}`);
      } else {
        console.log(`  ❌ ${dep}: MISSING (required: ${version})`);
        missingDevDeps.push(`${dep}@${version}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    if (missingDeps.length === 0 && missingDevDeps.length === 0) {
      console.log('🎉 All required dependencies are installed!');
      console.log('✅ DREAM TOOL is ready for production deployment.');
    } else {
      console.log('❌ Missing dependencies found:');
      
      if (missingDeps.length > 0) {
        console.log('\n📦 Install missing production dependencies:');
        console.log(`npm install ${missingDeps.join(' ')}`);
      }
      
      if (missingDevDeps.length > 0) {
        console.log('\n🛠️ Install missing development dependencies:');
        console.log(`npm install --save-dev ${missingDevDeps.join(' ')}`);
      }
      
      console.log('\n⚠️ CRITICAL: Install missing dependencies before deployment!');
    }
    console.log('='.repeat(50));
    
    // Check for potential issues
    console.log('\n🔍 Checking for potential issues:');
    
    // Check if express-validator is compatible with our validation middleware
    if (dependencies['express-validator']) {
      console.log('  ✅ express-validator found - validation middleware will work');
    } else {
      console.log('  ❌ express-validator missing - validation middleware will fail');
    }
    
    // Check if multer is available for file uploads
    if (dependencies['multer']) {
      console.log('  ✅ multer found - file upload functionality will work');
    } else {
      console.log('  ❌ multer missing - CSV upload will fail');
    }
    
    // Check TypeScript setup
    if (devDependencies['typescript'] && devDependencies['@types/express']) {
      console.log('  ✅ TypeScript setup complete');
    } else {
      console.log('  ⚠️ TypeScript setup incomplete - may cause compilation issues');
    }
    
    return missingDeps.length === 0 && missingDevDeps.length === 0;
    
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    return false;
  }
}

// Run verification
verifyDependencies()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
