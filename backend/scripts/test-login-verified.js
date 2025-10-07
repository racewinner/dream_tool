const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_EMAIL = 'testuser_9480@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testLogin() {
  try {
    console.log(`Testing login with email: ${TEST_EMAIL}`);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    console.log('✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('User data:', response.data.user);
    console.log('JWT Token:', response.data.token ? 'Received' : 'Missing');
    
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return null;
  }
}

// Run the test
testLogin().then(() => {
  console.log('\nTest completed. Check the output above for results.');
}).catch(console.error);
