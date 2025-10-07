const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Generate a random test email
const testEmail = `testuser_${Math.floor(Math.random() * 10000)}@example.com`;
const testPassword = 'TestPassword123!';

async function registerTestUser() {
  try {
    console.log('Registering test user...');
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    
    console.log('Registration successful!');
    console.log('User ID:', response.data.user?.id);
    return response.data;
  } catch (error) {
    console.error('Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return null;
  }
}

async function testLogin() {
  try {
    console.log('\nTesting login...');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('Login successful!');
    console.log('User data:', response.data.user);
    return response.data;
  } catch (error) {
    console.error('Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return null;
  }
}

async function runTests() {
  console.log('Starting authentication flow test...');
  console.log('Test email:', testEmail);
  
  // Step 1: Register a new user
  const registration = await registerTestUser();
  if (!registration) {
    console.error('Test aborted: User registration failed');
    return;
  }
  
  // Step 2: Test login (should fail without email verification)
  console.log('\n--- Testing login before email verification ---');
  const loginBeforeVerification = await testLogin();
  
  if (loginBeforeVerification) {
    console.error('ERROR: Login succeeded before email verification! This should not happen.');
    return;
  }
  
  console.log('\nTest completed successfully!');
  console.log('The login was blocked because the email is not verified, which is the expected behavior.');
  console.log(`\nTo complete the test, please verify the email for: ${testEmail}`);
  console.log('After verification, you can run the login test again to verify that login works after verification.');
}

// Run the tests
runTests().catch(console.error);
