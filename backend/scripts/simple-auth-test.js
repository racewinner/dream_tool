const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testAuth() {
  console.log('🔍 Testing Authentication System...\n');

  // Step 1: Register a new user
  console.log('📝 Step 1: Registering new user...');
  const testEmail = `testuser_${Date.now()}@example.com`;
  
  try {
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
      email: testEmail,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('✅ Registration successful!');
    console.log(`   - Email: ${testEmail}`);
    console.log(`   - User ID: ${registerResponse.data.user.id}`);
    console.log(`   - Verified: ${registerResponse.data.user.isVerified}`);
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    return;
  }

  // Step 2: Login with the new user
  console.log('\n🔐 Step 2: Testing login...');
  try {
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log(`   - Token: ${loginResponse.data.token ? 'Received' : 'Missing'}`);
    console.log(`   - User: ${loginResponse.data.user.email}`);
    
    // Step 3: Test protected endpoint
    console.log('\n🛡️ Step 3: Testing protected endpoint...');
    const headers = {
      'Authorization': `Bearer ${loginResponse.data.token}`,
      'Content-Type': 'application/json'
    };
    
    const profileResponse = await axios.get(`${API_URL}/api/auth/profile`, { headers });
    console.log('✅ Protected endpoint access successful!');
    console.log(`   - Profile: ${profileResponse.data.email}`);
    
    console.log('\n🎉 Authentication system is working perfectly!');
    console.log(`📧 Use this email for data import test: ${testEmail}`);
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testAuth();
