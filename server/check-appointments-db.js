const mongoose = require('mongoose');

// Connect to MongoDB (adjust the connection string as needed)
const MONGODB_URI = 'mongodb://localhost:27017/dental_care';

async function checkAppointments() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the Appointment model
    const Appointment = mongoose.model('Appointment', new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: Date, required: true },
      timeSlot: { type: String, required: true },
      status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
      notes: String,
      sessionNumber: Number,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }));

    // Get all appointments
    const appointments = await Appointment.find({})
      .populate('userId', 'name phone email')
      .sort({ date: 1 });

    console.log(`\n📅 Found ${appointments.length} appointments in database:`);
    
    if (appointments.length === 0) {
      console.log('❌ No appointments found in database');
      console.log('\nTo test the calendar view, you need to:');
      console.log('1. Create some test appointments through the client interface');
      console.log('2. Or add appointments directly to the database');
    } else {
      appointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. Appointment ID: ${apt._id}`);
        console.log(`   Date: ${apt.date.toISOString().split('T')[0]}`);
        console.log(`   Time: ${apt.timeSlot}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   User: ${apt.userId?.name || 'Unknown'}`);
        console.log(`   Notes: ${apt.notes || 'None'}`);
      });
    }

    // Check appointments for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const currentMonthAppointments = await Appointment.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).populate('userId', 'name phone email');

    console.log(`\n📊 Current month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}) appointments: ${currentMonthAppointments.length}`);
    
    if (currentMonthAppointments.length > 0) {
      currentMonthAppointments.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.date.toISOString().split('T')[0]} ${apt.timeSlot} - ${apt.userId?.name || 'Unknown'} (${apt.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking appointments:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAppointments(); 