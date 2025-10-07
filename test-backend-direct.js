const http = require('http');

console.log('🔍 Direct Backend Test\n');

function testEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Backend-Test/1.0'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`✅ ${path}: ${res.statusCode}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.length > 0) {
                    console.log(`📄 Response preview: ${data.substring(0, 100)}...`);
                }
                resolve({ path, status: res.statusCode, success: true });
            });
        });

        req.on('error', (err) => {
            console.log(`❌ ${path}: ${err.message}`);
            resolve({ path, error: err.message, success: false });
        });

        req.setTimeout(3000, () => {
            console.log(`⏰ ${path}: Timeout`);
            req.destroy();
            resolve({ path, error: 'Timeout', success: false });
        });

        req.end();
    });
}

async function runTests() {
    const endpoints = ['/', '/api/surveys', '/api/facilities'];
    
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }
    
    console.log('\n🏁 Test completed');
}

runTests().catch(console.error);
