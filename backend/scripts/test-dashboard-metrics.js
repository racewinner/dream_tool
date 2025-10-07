const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testDashboardMetrics() {
  try {
    console.log('🧪 Testing Dashboard Metrics Endpoint');
    
    // Create a test JWT token
    const token = jwt.sign(
      { userId: 1, email: 'test@example.com' },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    console.log('🔑 Generated test token');
    
    // Test the dashboard metrics endpoint
    const response = await axios.get('http://localhost:3001/api/metrics/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Dashboard metrics endpoint working!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Dashboard metrics endpoint failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testDashboardMetrics();
