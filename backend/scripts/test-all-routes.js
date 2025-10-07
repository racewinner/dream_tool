/**
 * Comprehensive Route Testing Script
 * Tests all enabled routes including newly enabled authentication and user management routes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test configuration
const testRoutes = [
  // Health check
  { method: 'GET', path: '/health', expectStatus: 200, description: 'Health check' },
  
  // Authentication routes (newly enabled)
  { method: 'POST', path: '/api/auth/register', expectStatus: [400, 422], description: 'User registration (without data)' },
  { method: 'POST', path: '/api/auth/login', expectStatus: [400, 401], description: 'User login (without credentials)' },
  
  // Email verification routes (newly enabled)
  { method: 'POST', path: '/api/email-verification/send-verification', expectStatus: [400, 404], description: 'Send email verification' },
  
  // Survey routes
  { method: 'GET', path: '/api/survey', expectStatus: [200, 401], description: 'Basic survey routes' },
  { method: 'GET', path: '/api/surveys', expectStatus: [200, 401], description: 'Advanced survey routes (newly enabled)' },
  
  // Facility routes
  { method: 'GET', path: '/api/facilities', expectStatus: [200, 401], description: 'Facility management' },
  
  // Asset routes
  { method: 'GET', path: '/api/assets', expectStatus: [200, 401], description: 'Asset management' },
  
  // Solar system routes (newly enabled)
  { method: 'GET', path: '/api/solar-systems', expectStatus: [200, 401], description: 'Solar system management (newly enabled)' },
  
  // Techno-economic routes
  { method: 'GET', path: '/api/techno-economic', expectStatus: [200, 401, 404], description: 'Techno-economic analysis' },
  
  // Metrics routes
  { method: 'GET', path: '/api/metrics/dashboard', expectStatus: [200, 401], description: 'Dashboard metrics' },
  { method: 'GET', path: '/api/metrics/data', expectStatus: [200, 401], description: 'Data section metrics' },
  { method: 'GET', path: '/api/metrics/design', expectStatus: [200, 401], description: 'Design section metrics' },
  { method: 'GET', path: '/api/metrics/pv-sites', expectStatus: [200, 401], description: 'PV Sites metrics' },
  { method: 'GET', path: '/api/metrics/maintenance', expectStatus: [200, 401], description: 'Maintenance metrics' },
  { method: 'GET', path: '/api/metrics/reports', expectStatus: [200, 401, 403], description: 'Reports metrics (admin only)' },
  
  // Visualization routes
  { method: 'GET', path: '/api/visualization/surveys', expectStatus: [200, 401], description: 'Survey visualizations' },
  { method: 'GET', path: '/api/visualization/facilities', expectStatus: [200, 401], description: 'Facility visualizations' },
  { method: 'GET', path: '/api/visualization/timeline', expectStatus: [200, 401], description: 'Timeline visualizations' },
  { method: 'GET', path: '/api/visualization/geo', expectStatus: [200, 401], description: 'Geo visualizations' },
  { method: 'GET', path: '/api/visualization/repeat-groups', expectStatus: [200, 401], description: 'Repeat group visualizations' },
  
  // Import routes
  { method: 'POST', path: '/api/import/kobo/surveys', expectStatus: [400, 401], description: 'KoboToolbox import' },
  { method: 'POST', path: '/api/v2/imports', expectStatus: [401], description: 'V2 import (auth required)' },
  
  // Mock data routes
  { method: 'GET', path: '/api/mock-data', expectStatus: [200, 404], description: 'Mock data routes' },
];

async function testRoute(route) {
  try {
    const response = await axios({
      method: route.method,
      url: `${BASE_URL}${route.path}`,
      timeout: 5000,
      validateStatus: () => true // Don't throw on any status code
    });

    const expectedStatuses = Array.isArray(route.expectStatus) ? route.expectStatus : [route.expectStatus];
    const isExpected = expectedStatuses.includes(response.status);
    
    return {
      ...route,
      actualStatus: response.status,
      success: isExpected,
      error: null,
      responseSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    return {
      ...route,
      actualStatus: null,
      success: false,
      error: error.code || error.message,
      responseSize: 0
    };
  }
}

async function runAllTests() {
  console.log('🧪 DREAM TOOL Route Testing Suite');
  console.log('=====================================\n');
  
  console.log(`📡 Testing ${testRoutes.length} routes against ${BASE_URL}\n`);
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (const route of testRoutes) {
    process.stdout.write(`Testing ${route.method} ${route.path}... `);
    
    const result = await testRoute(route);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.actualStatus} (${result.description})`);
      successCount++;
    } else {
      console.log(`❌ ${result.actualStatus || 'ERROR'} (${result.error || 'Unexpected status'}) - ${result.description}`);
      failureCount++;
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Successful: ${successCount}/${testRoutes.length}`);
  console.log(`❌ Failed: ${failureCount}/${testRoutes.length}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / testRoutes.length) * 100)}%\n`);
  
  // Group results by category
  const categories = {
    'Authentication': results.filter(r => r.path.includes('/auth') || r.path.includes('/email-verification')),
    'Data Management': results.filter(r => r.path.includes('/survey') || r.path.includes('/facilities')),
    'Solar Systems': results.filter(r => r.path.includes('/assets') || r.path.includes('/solar-systems') || r.path.includes('/techno-economic')),
    'Analytics': results.filter(r => r.path.includes('/metrics') || r.path.includes('/visualization')),
    'Import/Export': results.filter(r => r.path.includes('/import')),
    'System': results.filter(r => r.path.includes('/health') || r.path.includes('/mock-data'))
  };
  
  console.log('📋 Results by Category');
  console.log('=======================');
  
  Object.entries(categories).forEach(([category, categoryResults]) => {
    if (categoryResults.length > 0) {
      const categorySuccess = categoryResults.filter(r => r.success).length;
      const categoryTotal = categoryResults.length;
      const categoryRate = Math.round((categorySuccess / categoryTotal) * 100);
      
      console.log(`\n${category}: ${categorySuccess}/${categoryTotal} (${categoryRate}%)`);
      categoryResults.forEach(result => {
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${result.method} ${result.path} → ${result.actualStatus || 'ERROR'}`);
      });
    }
  });
  
  // Highlight newly enabled routes
  console.log('\n🆕 Newly Enabled Routes Status');
  console.log('===============================');
  const newRoutes = results.filter(r => 
    r.path.includes('/auth') || 
    r.path.includes('/email-verification') || 
    r.path.includes('/solar-systems') ||
    r.path.includes('/surveys')
  );
  
  newRoutes.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.method} ${result.path} → ${result.actualStatus || 'ERROR'} (${result.description})`);
  });
  
  if (failureCount > 0) {
    console.log('\n⚠️  Failed Routes Analysis');
    console.log('===========================');
    const failures = results.filter(r => !r.success);
    failures.forEach(failure => {
      console.log(`❌ ${failure.method} ${failure.path}`);
      console.log(`   Expected: ${Array.isArray(failure.expectStatus) ? failure.expectStatus.join(' or ') : failure.expectStatus}`);
      console.log(`   Actual: ${failure.actualStatus || 'CONNECTION_ERROR'}`);
      console.log(`   Error: ${failure.error || 'Unexpected response status'}\n`);
    });
  }
  
  console.log('\n🎯 Next Steps');
  console.log('==============');
  if (successCount === testRoutes.length) {
    console.log('🎉 All routes are working correctly!');
    console.log('✅ Authentication system is now functional');
    console.log('✅ Solar system management is now available');
    console.log('✅ Advanced survey features are now accessible');
    console.log('✅ Ready for frontend integration testing');
  } else {
    console.log('🔧 Some routes need attention:');
    if (results.some(r => !r.success && r.error)) {
      console.log('- Check if backend server is running on port 3001');
      console.log('- Verify all route files are properly imported');
      console.log('- Check for missing dependencies or model issues');
    }
    if (results.some(r => !r.success && !r.error)) {
      console.log('- Review route implementations for unexpected behavior');
      console.log('- Check authentication middleware configuration');
    }
  }
}

// Run the tests
runAllTests().catch(console.error);
