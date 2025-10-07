const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Generate a random email for testing
const randomEmail = `testuser_${Math.floor(Math.random() * 10000)}@example.com`;
const testPassword = 'TestPassword123!';

async function registerUser(email, password) {
  try {
    console.log(`Registering new user with email: ${email}`);
    
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });

    console.log('Registration successful!');
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Registration failed with status:', error.response.status);
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return null;
  }
}

async function loginUser(email, password) {
  try {
    console.log(`\nAttempting to login with email: ${email}`);
    
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

async function testAuthFlow() {
  console.log('Starting authentication flow test...');
  
  // Step 1: Register a new user
  const registration = await registerUser(randomEmail, testPassword);
  if (!registration) {
    console.error('Stopping test: User registration failed');
    return;
  }
  
  // Step 2: Try to login with the new user
  // This should fail because the email is not verified yet
  console.log('\n--- Testing login before email verification ---');
  const loginBeforeVerification = await loginUser(randomEmail, testPassword);
  
  if (loginBeforeVerification) {
    console.error('ERROR: Login succeeded before email verification! This should not happen.');
    return;
  }
  
  console.log('\nTest completed successfully!');
  console.log('The login was blocked because the email is not verified, which is the expected behavior.');
  console.log(`\nTo complete the test, please verify the email for: ${randomEmail}`);
  console.log('After verification, you can run the login test again to verify that login works after verification.');
}

// Run the test
testAuthFlow().catch(console.error);
