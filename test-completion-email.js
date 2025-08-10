/**
 * Test script for appointment completion email functionality
 */

import emailService from './server/src/services/emailService.js';

async function testCompletionEmail() {
  try {
    console.log('Testing appointment completion email...');
    
    // Test data
    const testData = {
      email: 'test@example.com',
      name: 'John Doe',
      date: new Date(),
      timeSlot: '10:00 AM - 11:00 AM'
    };
    
    // Send test email
    await emailService.sendAppointmentCompletionEmail(
      testData.email,
      testData.name,
      testData.date,
      testData.timeSlot
    );
    
    console.log('✅ Appointment completion email sent successfully!');
    console.log('Email details:');
    console.log(`- To: ${testData.email}`);
    console.log(`- Patient: ${testData.name}`);
    console.log(`- Date: ${testData.date.toLocaleDateString('en-IN')}`);
    console.log(`- Time: ${testData.timeSlot}`);
    
  } catch (error) {
    console.error('❌ Failed to send appointment completion email:', error.message);
  }
}

// Run the test
testCompletionEmail();