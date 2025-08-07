const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data for appointments
const sampleAppointments = [
  {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    timeSlot: '09:00-10:00',
    notes: 'Test appointment 1',
    status: 'scheduled'
  },
  {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    timeSlot: '10:00-11:00',
    notes: 'Test appointment 2',
    status: 'confirmed'
  },
  {
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
    timeSlot: '14:00-15:00',
    notes: 'Test appointment 3',
    status: 'scheduled'
  },
  {
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    timeSlot: '16:00-17:00',
    notes: 'Test appointment 4',
    status: 'confirmed'
  }
];

async function createTestAppointments() {
  console.log('🧪 Creating test appointments for calendar view...\n');

  for (let i = 0; i < sampleAppointments.length; i++) {
    const appointment = sampleAppointments[i];
    console.log(`Creating appointment ${i + 1}:`, appointment);
    
    try {
      // Note: This would require authentication in a real scenario
      // For testing purposes, we'll just log what would be sent
      console.log(`POST ${BASE_URL}/appointments`);
      console.log('Body:', JSON.stringify(appointment, null, 2));
      console.log('---');
    } catch (error) {
      console.error(`Failed to create appointment ${i + 1}:`, error.message);
    }
  }

  console.log('✅ Test appointments data prepared!');
  console.log('\nTo actually create these appointments, you need to:');
  console.log('1. Start the server: npm run dev (in server directory)');
  console.log('2. Login as a user to get authentication token');
  console.log('3. Use the token in Authorization header');
  console.log('4. Send POST requests to /api/appointments with the appointment data');
}

// Test the calendar API endpoint
async function testCalendarAPI() {
  console.log('\n🧪 Testing calendar API endpoints...\n');

  try {
    // Test getting all appointments (admin endpoint)
    console.log('Testing GET /appointments/admin/all...');
    const response = await axios.get(`${BASE_URL}/appointments/admin/all`, {
      params: {
        limit: 1000, // Get more appointments for calendar view
        page: 1
      }
    });
    
    console.log('Response:', response.data);
    console.log(`Found ${response.data.data.appointments.length} appointments`);
    
    if (response.data.data.appointments.length > 0) {
      console.log('Sample appointment:', response.data.data.appointments[0]);
    }
    
  } catch (error) {
    console.error('API test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await createTestAppointments();
  await testCalendarAPI();
}

if (typeof window === 'undefined') {
  runTests();
} 