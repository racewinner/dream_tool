const http = require('http');

// Test all critical backend endpoints
const endpoints = [
  { path: '/', name: 'Root' },
  { path: '/api/surveys', name: 'Surveys API' },
  { path: '/api/mcda/facilities', name: 'MCDA Facilities' },
  { path: '/api/auth/health', name: 'Auth Health' },
  { path: '/api/metrics', name: 'Metrics API' },
  { path: '/api/facilities', name: 'Facilities API' }
];

console.log('🔍 DREAM Tool Backend Health Check\n');

const testEndpoint = (path, name) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      const status = res.statusCode;
      const result = status >= 200 && status < 400 ? 'PASS' : 'FAIL';
      console.log(`${result === 'PASS' ? '✅' : '❌'} ${name}: ${status}`);
      resolve({ name, status, result });
    });

    req.on('error', (err) => {
      console.log(`❌ ${name}: ERROR - ${err.message}`);
      resolve({ name, status: 'ERROR', result: 'FAIL', error: err.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ ${name}: TIMEOUT`);
      req.destroy();
      resolve({ name, status: 'TIMEOUT', result: 'FAIL' });
    });

    req.end();
  });
};

// Run all tests
Promise.all(endpoints.map(ep => testEndpoint(ep.path, ep.name)))
  .then(results => {
    const passed = results.filter(r => r.result === 'PASS').length;
    const total = results.length;
    
    console.log(`\n📊 Results: ${passed}/${total} endpoints working`);
    
    if (passed === total) {
      console.log('🟢 Backend Status: HEALTHY');
    } else if (passed > 0) {
      console.log('🟡 Backend Status: PARTIAL');
    } else {
      console.log('🔴 Backend Status: DOWN');
    }
  })
  .catch(console.error);
