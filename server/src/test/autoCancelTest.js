import mongoose from "mongoose";
import { config } from "../config/environment.js";
import { Appointment, User } from "../models/index.js";
import appointmentAutoCancelService from "../services/appointmentAutoCancelService.js";

/**
 * Simple test script for auto-cancellation functionality
 * This script creates test appointments and verifies the auto-cancellation logic
 */

// Mock data for testing
const createTestData = async () => {
  try {
    console.log("🧪 Creating test data...");
    
    // Create a test user
    const testUser = await User.create({
      name: "Test Patient",
      phone: "+919999999999",
      email: "test@example.com",
      subscription: {
        plan: "basic",
        sessionsRemaining: 5,
        isActive: true,
      },
    });

    // Create appointments for testing
    const now = new Date();
    
    // 1. Expired appointment (should be auto-cancelled)
    const expiredDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const expiredAppointment = await Appointment.create({
      userId: testUser._id,
      date: expiredDate,
      timeSlot: "09:00-10:00",
      status: "scheduled",
      notes: "Test expired appointment",
    });

    // 2. Current appointment (should NOT be auto-cancelled)
    const currentAppointment = await Appointment.create({
      userId: testUser._id,
      date: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
      timeSlot: "11:00-12:00",
      status: "scheduled",
      notes: "Test current appointment",
    });

    // 3. Confirmed appointment from the past (should NOT be auto-cancelled)
    const confirmedAppointment = await Appointment.create({
      userId: testUser._id,
      date: expiredDate,
      timeSlot: "14:00-15:00",
      status: "confirmed",
      notes: "Test confirmed appointment",
    });

    console.log("✅ Test data created:");
    console.log(`   - Test User: ${testUser._id}`);
    console.log(`   - Expired Appointment (should cancel): ${expiredAppointment._id}`);
    console.log(`   - Current Appointment (should NOT cancel): ${currentAppointment._id}`);
    console.log(`   - Confirmed Appointment (should NOT cancel): ${confirmedAppointment._id}`);

    return {
      testUser,
      expiredAppointment,
      currentAppointment,
      confirmedAppointment,
    };
  } catch (error) {
    console.error("❌ Error creating test data:", error);
    throw error;
  }
};

// Test the auto-cancellation logic
const testAutoCancellation = async () => {
  try {
    console.log("\n🔍 Testing auto-cancellation logic...");

    // Get expired appointments that should be cancelled
    const expiredAppointments = await appointmentAutoCancelService.findExpiredAppointments();
    console.log(`Found ${expiredAppointments.length} expired appointments`);

    if (expiredAppointments.length > 0) {
      console.log("Expired appointments:");
      expiredAppointments.forEach(apt => {
        console.log(`  - ${apt._id}: ${apt.userId.name} on ${apt.date.toLocaleDateString()} at ${apt.timeSlot} (status: ${apt.status})`);
      });
    }

    // Get service stats before processing
    const statsBefore = appointmentAutoCancelService.getStats();
    console.log("\n📊 Stats before processing:", statsBefore);

    // Manually trigger the auto-cancellation process
    console.log("\n🚀 Triggering auto-cancellation process...");
    await appointmentAutoCancelService.manualTrigger();

    // Get service stats after processing
    const statsAfter = appointmentAutoCancelService.getStats();
    console.log("\n📊 Stats after processing:", statsAfter);

    const processed = statsAfter.totalProcessed - statsBefore.totalProcessed;
    const cancelled = statsAfter.totalCancelled - statsBefore.totalCancelled;

    console.log(`\n✅ Process completed: ${processed} processed, ${cancelled} cancelled`);

    return { processed, cancelled };
  } catch (error) {
    console.error("❌ Error testing auto-cancellation:", error);
    throw error;
  }
};

// Verify results
const verifyResults = async (testData) => {
  try {
    console.log("\n🔍 Verifying results...");

    // Check the status of our test appointments
    const expiredAppointment = await Appointment.findById(testData.expiredAppointment._id);
    const currentAppointment = await Appointment.findById(testData.currentAppointment._id);
    const confirmedAppointment = await Appointment.findById(testData.confirmedAppointment._id);

    console.log("\nAppointment status after auto-cancellation:");
    console.log(`  - Expired Appointment: ${expiredAppointment.status} (expected: cancelled)`);
    console.log(`  - Current Appointment: ${currentAppointment.status} (expected: scheduled)`);
    console.log(`  - Confirmed Appointment: ${confirmedAppointment.status} (expected: confirmed)`);

    // Verify expectations
    const results = {
      expiredCancelled: expiredAppointment.status === "cancelled",
      currentUntouched: currentAppointment.status === "scheduled",
      confirmedUntouched: confirmedAppointment.status === "confirmed",
    };

    const allTestsPassed = Object.values(results).every(result => result === true);
    
    if (allTestsPassed) {
      console.log("\n✅ All tests passed! Auto-cancellation is working correctly.");
    } else {
      console.log("\n❌ Some tests failed:");
      Object.entries(results).forEach(([test, passed]) => {
        console.log(`  - ${test}: ${passed ? "✅ PASS" : "❌ FAIL"}`);
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Error verifying results:", error);
    throw error;
  }
};

// Cleanup test data
const cleanup = async (testData) => {
  try {
    console.log("\n🧹 Cleaning up test data...");
    
    if (testData) {
      await Appointment.deleteMany({
        userId: testData.testUser._id,
      });
      
      await User.findByIdAndDelete(testData.testUser._id);
      
      console.log("✅ Test data cleaned up");
    }
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
  }
};

// Main test function
const runAutoCancelTest = async () => {
  let testData = null;
  
  try {
    console.log("🚀 Starting Auto-Cancellation Test");
    console.log("====================================");

    // Connect to database
    console.log("📡 Connecting to database...");
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Database connected");

    // Create test data
    testData = await createTestData();

    // Test auto-cancellation
    const testResults = await testAutoCancellation();

    // Verify results
    const verificationResults = await verifyResults(testData);

    console.log("\n📊 Final Results:");
    console.log("=================");
    console.log(`Appointments processed: ${testResults.processed}`);
    console.log(`Appointments cancelled: ${testResults.cancelled}`);
    console.log(`Tests passed: ${Object.values(verificationResults).filter(Boolean).length}/${Object.keys(verificationResults).length}`);

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
  } finally {
    // Cleanup
    await cleanup(testData);
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log("📡 Database disconnected");
    
    console.log("\n🏁 Test completed");
  }
};

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutoCancelTest().catch(console.error);
}

export { runAutoCancelTest };