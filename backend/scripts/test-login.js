const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testLogin(email, password) {
  try {
    console.log(`Testing login with email: ${email}`);
    
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });

    console.log('Login successful!');
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Login failed with status:', error.response.status);
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return null;
  }
}

// Example usage
// testLogin('test@example.com', 'password');
