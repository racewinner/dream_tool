const net = require('net');

console.log('🔍 Testing Backend Connection...\n');

// Test raw TCP connection first
const client = new net.Socket();
client.setTimeout(3000);

client.connect(3001, 'localhost', () => {
    console.log('✅ TCP connection to localhost:3001 successful');
    
    // Send a simple HTTP request
    const request = 'GET / HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n';
    client.write(request);
});

client.on('data', (data) => {
    const response = data.toString();
    console.log('✅ HTTP response received:');
    console.log(response.substring(0, 200) + '...');
    client.destroy();
});

client.on('timeout', () => {
    console.log('❌ Connection timeout');
    client.destroy();
});

client.on('error', (err) => {
    console.log('❌ Connection error:', err.message);
});

client.on('close', () => {
    console.log('\n🔚 Connection closed');
    process.exit(0);
});

// Auto-exit after 5 seconds
setTimeout(() => {
    console.log('⏰ Test timeout - exiting');
    process.exit(1);
}, 5000);
