const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Install missing dependencies for DREAM TOOL consolidated import system
 */

console.log('🚀 Installing missing dependencies for DREAM TOOL consolidated import system...\n');

// Read current package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentDeps = packageJson.dependencies || {};
const currentDevDeps = packageJson.devDependencies || {};

// Required dependencies for consolidated import system
const MISSING_PRODUCTION_DEPS = [
  'express-validator@^7.0.0',  // For validation middleware
  'multer@^1.4.0',            // For file uploads (CSV)
  'csv-parser@^3.0.0',        // For CSV processing
  'uuid@^9.0.0',              // For generating unique IDs
  'pg-hstore@^2.3.0'          // For PostgreSQL JSON handling
];

const MISSING_DEV_DEPS = [
  '@types/multer@^1.4.0',     // TypeScript types for multer
  '@types/uuid@^10.0.0'       // TypeScript types for uuid
];

// Filter out already installed dependencies
const depsToInstall = MISSING_PRODUCTION_DEPS.filter(dep => {
  const depName = dep.split('@')[0];
  return !currentDeps[depName];
});

const devDepsToInstall = MISSING_DEV_DEPS.filter(dep => {
  const depName = dep.split('@')[0];
  return !currentDevDeps[depName];
});

console.log('📦 Checking current dependencies...');
console.log(`Current production deps: ${Object.keys(currentDeps).length}`);
console.log(`Current dev deps: ${Object.keys(currentDevDeps).length}\n`);

// Install production dependencies
if (depsToInstall.length > 0) {
  console.log('🔧 Installing missing production dependencies:');
  depsToInstall.forEach(dep => console.log(`  - ${dep}`));
  
  try {
    const installCmd = `npm install ${depsToInstall.join(' ')}`;
    console.log(`\n⚡ Running: ${installCmd}`);
    execSync(installCmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Production dependencies installed successfully!\n');
  } catch (error) {
    console.error('❌ Error installing production dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ All required production dependencies are already installed!\n');
}

// Install development dependencies
if (devDepsToInstall.length > 0) {
  console.log('🛠️ Installing missing development dependencies:');
  devDepsToInstall.forEach(dep => console.log(`  - ${dep}`));
  
  try {
    const installCmd = `npm install --save-dev ${devDepsToInstall.join(' ')}`;
    console.log(`\n⚡ Running: ${installCmd}`);
    execSync(installCmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Development dependencies installed successfully!\n');
  } catch (error) {
    console.error('❌ Error installing development dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ All required development dependencies are already installed!\n');
}

// Verify installation
console.log('🔍 Verifying installation...');
try {
  // Re-read package.json to verify
  const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const updatedDeps = updatedPackageJson.dependencies || {};
  const updatedDevDeps = updatedPackageJson.devDependencies || {};
  
  console.log('\n📊 Installation Summary:');
  console.log('='.repeat(50));
  
  // Check each required dependency
  const requiredChecks = [
    { name: 'express-validator', type: 'production' },
    { name: 'multer', type: 'production' },
    { name: 'csv-parser', type: 'production' },
    { name: 'uuid', type: 'production' },
    { name: 'pg-hstore', type: 'production' },
    { name: '@types/multer', type: 'development' },
    { name: '@types/uuid', type: 'development' }
  ];
  
  let allInstalled = true;
  
  requiredChecks.forEach(check => {
    const deps = check.type === 'production' ? updatedDeps : updatedDevDeps;
    if (deps[check.name]) {
      console.log(`✅ ${check.name}: ${deps[check.name]} (${check.type})`);
    } else {
      console.log(`❌ ${check.name}: MISSING (${check.type})`);
      allInstalled = false;
    }
  });
  
  console.log('='.repeat(50));
  
  if (allInstalled) {
    console.log('🎉 ALL DEPENDENCIES SUCCESSFULLY INSTALLED!');
    console.log('✅ DREAM TOOL consolidated import system is ready!');
    console.log('\n🚀 Next steps:');
    console.log('1. Restart the backend server');
    console.log('2. Test the consolidated import routes');
    console.log('3. Verify KoboToolbox import functionality');
  } else {
    console.log('❌ Some dependencies are still missing. Please check the installation.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error verifying installation:', error.message);
  process.exit(1);
}

console.log('\n🏁 Dependency installation complete!');
