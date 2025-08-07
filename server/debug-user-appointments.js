// Debug script to check user appointments
import mongoose from "mongoose";
import { config } from "./src/config/environment.js";

// Simple schemas for querying
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    role: String,
  },
  { timestamps: true }
);

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

const User = mongoose.model("User", userSchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);

const debugUserAppointments = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all users
    const users = await User.find({});
    console.log(`\nFound ${users.length} users in database:`);

    for (const user of users) {
      console.log(`\nUser: ${user.name} (${user.email})`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Role: ${user.role}`);

      // Get appointments for this user
      const userAppointments = await Appointment.find({ userId: user._id });
      console.log(`  Appointments: ${userAppointments.length}`);

      userAppointments.forEach((apt, index) => {
        const isUpcoming =
          new Date(apt.date) >= new Date() && apt.status !== "cancelled";
        console.log(
          `    ${index + 1}. ${apt.date} at ${apt.timeSlot} (${apt.status}) ${
            isUpcoming ? "- UPCOMING" : "- PAST/CANCELLED"
          }`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
};

debugUserAppointments();
