import mongoose from 'mongoose';
import Appointment from './src/models/Appointment.js';

async function debugFollowUps() {
  try {
    // Connect to MongoDB (assuming default connection)
    await mongoose.connect('mongodb://localhost:27017/dental-care');
    console.log('Connected to MongoDB');

    // Check for any appointments with follow-ups
    const appointmentsWithFollowUps = await Appointment.find({
      followUps: { $exists: true, $ne: [] }
    }).select('_id userId followUps');

    console.log(`\nFound ${appointmentsWithFollowUps.length} appointments with follow-ups:`);
    
    appointmentsWithFollowUps.forEach((appointment, index) => {
      console.log(`\n--- Appointment ${index + 1} ---`);
      console.log(`ID: ${appointment._id}`);
      console.log(`User ID: ${appointment.userId}`);
      console.log(`Follow-ups count: ${appointment.followUps.length}`);
      
      appointment.followUps.forEach((followUp, fuIndex) => {
        console.log(`  Follow-up ${fuIndex + 1}:`);
        console.log(`    Date: ${followUp.date}`);
        console.log(`    Time Slot: ${followUp.timeSlot}`);
        console.log(`    Status: ${followUp.status}`);
        console.log(`    Scheduled By: ${followUp.scheduledBy}`);
        console.log(`    Scheduled At: ${followUp.scheduledAt}`);
      });
    });

    // Now test the specific query that the availability service uses
    const targetDate = new Date('2025-08-28T00:00:00.000Z');
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    console.log(`\n--- Testing availability service query ---`);
    console.log(`Searching for follow-ups between ${dateStart.toISOString()} and ${dateEnd.toISOString()}`);

    const followUpAppointments = await Appointment.find({
      "followUps": {
        $elemMatch: {
          "date": {
            $gte: dateStart,
            $lt: dateEnd,
          },
          "status": { $nin: ["cancelled"] }
        }
      }
    }).select("followUps");

    console.log(`Found ${followUpAppointments.length} appointments with follow-ups in date range`);

    followUpAppointments.forEach((appointment, index) => {
      console.log(`\nAppointment ${index + 1} (${appointment._id}):`);
      appointment.followUps.forEach((followUp, fuIndex) => {
        const followUpDate = new Date(followUp.date);
        const inRange = followUpDate >= dateStart && followUpDate < dateEnd;
        const statusOk = !["cancelled"].includes(followUp.status);
        
        console.log(`  Follow-up ${fuIndex + 1}:`);
        console.log(`    Date: ${followUpDate.toISOString()}`);
        console.log(`    Time Slot: ${followUp.timeSlot}`);
        console.log(`    Status: ${followUp.status}`);
        console.log(`    In Date Range: ${inRange}`);
        console.log(`    Status OK: ${statusOk}`);
        console.log(`    Should be included: ${inRange && statusOk}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugFollowUps();
