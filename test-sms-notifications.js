/**
 * Test Script for SMS Notification System
 * 
 * This script tests the SMS notification functionality for:
 * 1. Appointment booking notifications (to user and admin)
 * 2. Follow-up appointment notifications (to user)
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const API_URL = process.env.API_URL || 'http://localhost:5001/api';

// Test configuration
const TEST_CONFIG = {
  // Replace with actual test credentials
  userPhone: process.env.TEST_USER_PHONE || '9999999999',
  userEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
  adminToken: process.env.TEST_ADMIN_TOKEN, // Get from login
  userToken: process.env.TEST_USER_TOKEN,   // Get from login
};

console.log('🧪 SMS Notification Test Suite');
console.log('================================\n');

/**
 * Test 1: Verify SMS service configuration
 */
async function testSMSConfiguration() {
  console.log('📋 Test 1: Checking SMS Configuration');
  console.log('--------------------------------------');
  
  const config = {
    SMS_PROVIDER: process.env.SMS_PROVIDER || 'msg91',
    ADMIN_PHONE: process.env.ADMIN_PHONE || 'Not configured',
    MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY ? '✓ Configured' : '✗ Missing',
    MSG91_SENDER_ID: process.env.MSG91_SENDER_ID || 'TABDCL',
  };
  
  console.log('SMS Provider:', config.SMS_PROVIDER);
  console.log('Admin Phone:', config.ADMIN_PHONE);
  console.log('MSG91 Auth Key:', config.MSG91_AUTH_KEY);
  console.log('Sender ID:', config.MSG91_SENDER_ID);
  
  if (!process.env.ADMIN_PHONE) {
    console.log('⚠️  Warning: ADMIN_PHONE not configured in .env');
    console.log('   Add: ADMIN_PHONE=+917351114255');
  }
  
  console.log('\n');
}

/**
 * Test 2: Create appointment and verify SMS notifications
 */
async function testAppointmentBookingSMS() {
  console.log('📋 Test 2: Appointment Booking SMS Notifications');
  console.log('------------------------------------------------');
  
  if (!TEST_CONFIG.userToken) {
    console.log('⚠️  Skipping: USER_TOKEN not configured');
    console.log('   Login as a user and set TEST_USER_TOKEN in .env');
    console.log('\n');
    return;
  }
  
  try {
    // Create a test appointment
    const appointmentData = {
      date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      timeSlot: '10:00-11:00',
      notes: 'Test appointment for SMS notification',
      personalDetails: {
        email: TEST_CONFIG.userEmail,
      },
    };
    
    console.log('Creating test appointment...');
    const response = await axios.post(
      `${API_URL}/appointments`,
      appointmentData,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.userToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.success) {
      console.log('✅ Appointment created successfully');
      console.log('   Appointment ID:', response.data.data.appointment._id);
      console.log('   Date:', new Date(response.data.data.appointment.date).toLocaleDateString());
      console.log('   Time Slot:', response.data.data.appointment.timeSlot);
      console.log('\n📱 Expected SMS Notifications:');
      console.log('   1. SMS to user with appointment confirmation');
      console.log('   2. SMS to admin with booking details');
      console.log('\n✓ Check server console for SMS logs');
    } else {
      console.log('❌ Failed to create appointment');
      console.log('   Error:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Error creating appointment');
    console.log('   Error:', error.response?.data?.message || error.message);
  }
  
  console.log('\n');
}

/**
 * Test 3: Create follow-up and verify SMS notification
 */
async function testFollowUpSMS() {
  console.log('📋 Test 3: Follow-up SMS Notifications');
  console.log('--------------------------------------');
  
  if (!TEST_CONFIG.adminToken) {
    console.log('⚠️  Skipping: ADMIN_TOKEN not configured');
    console.log('   Login as admin and set TEST_ADMIN_TOKEN in .env');
    console.log('\n');
    return;
  }
  
  try {
    // First, get a completed appointment
    console.log('Fetching completed appointments...');
    const appointmentsResponse = await axios.get(
      `${API_URL}/appointments/all?status=completed&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.adminToken}`,
        },
      }
    );
    
    if (!appointmentsResponse.data.data?.appointments?.length) {
      console.log('⚠️  No completed appointments found to test follow-up');
      console.log('   Create and complete an appointment first');
      console.log('\n');
      return;
    }
    
    const completedAppointment = appointmentsResponse.data.data.appointments[0];
    console.log('Found completed appointment:', completedAppointment._id);
    
    // Create follow-up
    const followUpData = {
      date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      timeSlot: '14:00-15:00',
      notes: 'Follow-up check - SMS test',
    };
    
    console.log('Creating follow-up appointment...');
    const response = await axios.post(
      `${API_URL}/appointments/${completedAppointment._id}/followup`,
      followUpData,
      {
        headers: {
          'Authorization': `Bearer ${TEST_CONFIG.adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.data.success) {
      console.log('✅ Follow-up created successfully');
      console.log('   Date:', new Date(followUpData.date).toLocaleDateString());
      console.log('   Time Slot:', followUpData.timeSlot);
      console.log('\n📱 Expected SMS Notification:');
      console.log('   SMS to user with follow-up details');
      console.log('\n✓ Check server console for SMS logs');
    } else {
      console.log('❌ Failed to create follow-up');
      console.log('   Error:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Error creating follow-up');
    console.log('   Error:', error.response?.data?.message || error.message);
  }
  
  console.log('\n');
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting SMS notification tests...\n');
  
  await testSMSConfiguration();
  await testAppointmentBookingSMS();
  await testFollowUpSMS();
  
  console.log('================================');
  console.log('✅ Test suite completed');
  console.log('\n📝 Notes:');
  console.log('   - In development mode, SMS will be logged to console');
  console.log('   - Actual SMS will only be sent if MSG91/Twilio is properly configured');
  console.log('   - Check server logs for SMS notification details');
  console.log('\n');
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

