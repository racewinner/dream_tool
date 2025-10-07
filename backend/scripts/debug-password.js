const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Test with the most recent user
const testEmail = 'testuser_3554@example.com';
const testPassword = 'TestPassword123!';

async function debugPasswordIssue() {
  console.log('🔍 Debugging password issue...');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  
  try {
    // Try login with the user we know exists
    console.log('\n1. Testing login with known user...');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    console.log('✅ Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Login failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      // If it's a password issue, let's try registering a new user
      if (error.response.status === 401) {
        console.log('\n2. Trying to register a new user to test password hashing...');
        
        const newEmail = `debug_${Date.now()}@example.com`;
        const newPassword = 'DebugPassword123!';
        
        try {
          const regResponse = await axios.post(`${API_URL}/api/auth/register`, {
            email: newEmail,
            password: newPassword,
            firstName: 'Debug',
            lastName: 'User',
            role: 'user'
          });
          
          console.log('✅ Registration successful!');
          console.log('User verified:', regResponse.data.user?.isVerified);
          
          // Now try to login immediately
          console.log('\n3. Testing immediate login after registration...');
          
          const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: newEmail,
            password: newPassword
          });
          
          console.log('✅ Login after registration successful!');
          console.log('This means password hashing is working correctly.');
          
        } catch (regError) {
          console.log('❌ Registration or login after registration failed');
          if (regError.response) {
            console.log('Status:', regError.response.status);
            console.log('Error:', regError.response.data);
          }
        }
      }
    } else {
      console.log('Network error:', error.message);
    }
  }
}

debugPasswordIssue().catch(console.error);
