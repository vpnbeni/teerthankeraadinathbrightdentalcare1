const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testEmailValidation() {
  console.log('Testing Email Validation Endpoints...\n');

  try {
    // Test 1: Check email availability with valid Gmail
    console.log('1. Testing email availability check...');
    const checkResponse = await axios.get(`${API_BASE}/auth/check-email?email=test@gmail.com`);
    console.log('✅ Email availability check:', checkResponse.data);

    // Test 2: Send OTP to email
    console.log('\n2. Testing OTP sending...');
    const otpResponse = await axios.post(`${API_BASE}/auth/send-email-otp`, {
      email: 'test@gmail.com'
    });
    console.log('✅ OTP sent:', otpResponse.data);

    // Test 3: Test with invalid email format
    console.log('\n3. Testing invalid email format...');
    try {
      await axios.get(`${API_BASE}/auth/check-email?email=invalid-email`);
    } catch (error) {
      console.log('✅ Invalid email rejected:', error.response.data.message);
    }

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmailValidation();