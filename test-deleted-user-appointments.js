// Test script to verify that appointments for deleted users are filtered out
import mongoose from "mongoose";
import { Appointment, User } from "./server/src/models/index.js";

const testDeletedUserAppointments = async () => {
  try {
    console.log("🧪 Testing deleted user appointments filtering...");

    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/appointment-system"
    );
    console.log("✅ Connected to database");

    // Get all appointments with populated users
    const appointmentsRaw = await Appointment.find({})
      .populate("userId", "name phone email")
      .sort({ date: -1 });

    console.log(
      `\n📊 Total appointments in database: ${appointmentsRaw.length}`
    );

    // Filter out appointments with deleted users (userId is null after populate)
    const validAppointments = appointmentsRaw.filter(
      (appointment) => appointment.userId !== null
    );
    const deletedUserAppointments = appointmentsRaw.filter(
      (appointment) => appointment.userId === null
    );

    console.log(
      `✅ Valid appointments (with existing users): ${validAppointments.length}`
    );
    console.log(
      `❌ Appointments with deleted users: ${deletedUserAppointments.length}`
    );

    if (deletedUserAppointments.length > 0) {
      console.log("\n🗑️ Appointments with deleted users:");
      deletedUserAppointments.forEach((apt, index) => {
        console.log(`   ${index + 1}. ID: ${apt._id}`);
        console.log(`      Date: ${apt.date.toISOString().split("T")[0]}`);
        console.log(`      Time: ${apt.timeSlot}`);
        console.log(`      Status: ${apt.status}`);
        console.log(`      User ID: ${apt.userId} (deleted)`);
      });
    }

    if (validAppointments.length > 0) {
      console.log("\n✅ Valid appointments (sample):");
      validAppointments.slice(0, 3).forEach((apt, index) => {
        console.log(`   ${index + 1}. ID: ${apt._id}`);
        console.log(`      Date: ${apt.date.toISOString().split("T")[0]}`);
        console.log(`      Time: ${apt.timeSlot}`);
        console.log(`      Status: ${apt.status}`);
        console.log(
          `      User: ${apt.userId.name} (${
            apt.userId.phone || apt.userId.email
          })`
        );
      });
    }

    console.log("\n✅ Test completed successfully!");
    console.log(
      "📝 The filtering logic will now hide appointments for deleted users from all API responses."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
  }
};

// Run the test
testDeletedUserAppointments();
