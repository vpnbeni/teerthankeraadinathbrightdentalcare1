// Debug script to check appointments in database
import mongoose from "mongoose";
import { config } from "./src/config/environment.js";

// Simple appointment schema for querying
const appointmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: Date,
    timeSlot: String,
    status: String,
    notes: String,
    sessionNumber: Number,
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

const debugAppointments = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    const appointments = await Appointment.find({});
    console.log(`\nFound ${appointments.length} appointments in database:`);

    appointments.forEach((apt, index) => {
      console.log(`\nAppointment ${index + 1}:`);
      console.log(`  ID: ${apt._id}`);
      console.log(`  User ID: ${apt.userId}`);
      console.log(`  Date: ${apt.date}`);
      console.log(`  Time Slot: ${apt.timeSlot}`);
      console.log(`  Status: ${apt.status}`);
      console.log(`  Session Number: ${apt.sessionNumber}`);
      console.log(`  Created: ${apt.createdAt}`);
    });

    // Check upcoming appointments
    const now = new Date();
    const upcomingAppointments = appointments.filter(
      (apt) => new Date(apt.date) >= now && apt.status !== "cancelled"
    );

    console.log(`\nUpcoming appointments: ${upcomingAppointments.length}`);
    upcomingAppointments.forEach((apt, index) => {
      console.log(
        `  ${index + 1}. User ${apt.userId} - ${apt.date} at ${apt.timeSlot} (${
          apt.status
        })`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
};

debugAppointments();
