#!/usr/bin/env node

/**
 * Test script for KoboToolbox import functionality
 * This script demonstrates how to:
 * 1. Register a user
 * 2. Login to get JWT token
 * 3. Test KoboToolbox import endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test user credentials
const testUser = {
    email: 'kobo.test@example.com',
    password: 'TestPassword123!',
    name: 'Kobo Test User'
};

// Sample KoboToolbox import data
const sampleKoboData = {
    koboUrl: 'https://kf.kobotoolbox.org',
    apiToken: 'YOUR_KOBO_API_TOKEN_HERE',
    surveyId: 'YOUR_SURVEY_ID_HERE',
    // Optional: specific form ID if needed
    formId: 'YOUR_FORM_ID_HERE'
};

async function testKoboImport() {
    try {
        console.log('🚀 Starting KoboToolbox Import Test...\n');

        // Step 1: Register user (if not exists)
        console.log('📝 Step 1: Registering test user...');
        try {
            const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
            console.log('✅ User registered successfully:', registerResponse.data);
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️  User already exists, proceeding to login...');
            } else {
                console.log('❌ Registration error:', error.response?.data || error.message);
                return;
            }
        }

        // Step 2: Login to get JWT token
        console.log('\n🔐 Step 2: Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');

        // Step 3: Test KoboToolbox import endpoint
        console.log('\n📊 Step 3: Testing KoboToolbox import...');
        
        const importResponse = await axios.post(
            `${BASE_URL}/api/import/kobo/surveys`,
            sampleKoboData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ KoboToolbox import test successful!');
        console.log('📋 Response:', JSON.stringify(importResponse.data, null, 2));

    } catch (error) {
        console.log('❌ Error during import test:');
        console.log('Status:', error.response?.status);
        console.log('Message:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 This is expected if you haven\'t provided valid KoboToolbox credentials');
        }
    }
}

async function testEndpointStructure() {
    console.log('\n🔍 Testing endpoint structure (without auth)...');
    
    try {
        await axios.post(`${BASE_URL}/api/import/kobo/surveys`, {});
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Endpoint exists and requires authentication (as expected)');
        } else {
            console.log('📋 Endpoint response:', error.response?.data);
        }
    }
}

// Main execution
async function main() {
    console.log('🎯 DREAM Tool - KoboToolbox Import Test\n');
    console.log('This script will test the KoboToolbox import functionality');
    console.log('Make sure your Docker containers are running!\n');
    
    // Test basic endpoint structure
    await testEndpointStructure();
    
    // Full import test
    await testKoboImport();
    
    console.log('\n📝 Next Steps:');
    console.log('1. Update the sampleKoboData with your actual KoboToolbox credentials');
    console.log('2. Use the frontend interface for a better user experience');
    console.log('3. Check the backend logs for detailed import process information');
}

// Handle command line execution
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testKoboImport, testUser, sampleKoboData };
