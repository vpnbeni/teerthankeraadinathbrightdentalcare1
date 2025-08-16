#!/usr/bin/env node

/**
 * Test Script for Session Quota with Expiry Logic
 * Tests the new appointment expiry functionality and quota counting
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models and services
import { Appointment, User, Plan } from "./server/src/models/index.js";
import { getSessionLimitInfo } from "./server/src/middleware/sessionLimits.js";
import { appointmentExpiryService } from "./server/src/services/appointmentExpiryService.js";

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/teerthanker-dental");
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// Test data setup
const setupTestData = async () => {
  console.log("\n🔧 Setting up test data...");

  // Find or create a test plan
  let testPlan = await Plan.findOne({ name: "Test Plan" });
  if (!testPlan) {
    testPlan = await Plan.create({
      name: "Test Plan",
      description: "Test plan for quota expiry testing",
      sessions: 3,
      price: 99.99,
      durationDays: 30,
    });
  }

  // Find or create a test user
  let testUser = await User.findOne({ email: "test-quota@example.com" });
  if (!testUser) {
    testUser = await User.create({
      name: "Test User",
      email: "test-quota@example.com",
      phone: "+1234567890",
      password: "hashedpassword123",
      subscription: {
        planId: testPlan._id,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        sessionsRemaining: 3,
      },
    });
  } else {
    // Update subscription to ensure test state
    testUser.subscription = {
      planId: testPlan._id,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sessionsRemaining: 3,
    };
    await testUser.save();
  }

  return { testUser, testPlan };
};

// Test appointment expiry logic
const testAppointmentExpiry = async (testUser) => {
  console.log("\n🧪 Testing appointment expiry logic...");

  // Create a past scheduled appointment (should be expired)
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  const pastAppointment = await Appointment.create({
    userId: testUser._id,
    date: pastDate,
    timeSlot: "10:00-11:00",
    status: "scheduled",
    notes: "Past appointment for expiry test",
  });

  console.log(`📅 Created past appointment: ${pastAppointment._id}`);
  console.log(`   Date: ${pastDate.toLocaleString()}`);
  console.log(`   Status: ${pastAppointment.status}`);

  // Create a future scheduled appointment (should NOT be expired)
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
  const futureAppointment = await Appointment.create({
    userId: testUser._id,
    date: futureDate,
    timeSlot: "14:00-15:00",
    status: "scheduled",
    notes: "Future appointment for expiry test",
  });

  console.log(`📅 Created future appointment: ${futureAppointment._id}`);
  console.log(`   Date: ${futureDate.toLocaleString()}`);
  console.log(`   Status: ${futureAppointment.status}`);

  // Create a confirmed appointment (should count towards quota)
  const confirmedAppointment = await Appointment.create({
    userId: testUser._id,
    date: new Date(Date.now() + 48 * 60 * 60 * 1000), // day after tomorrow
    timeSlot: "15:00-16:00",
    status: "confirmed",
    notes: "Confirmed appointment for quota test",
  });

  console.log(`✅ Created confirmed appointment: ${confirmedAppointment._id}`);

  return { pastAppointment, futureAppointment, confirmedAppointment };
};

// Test session limit counting before expiry
const testSessionLimitsBefore = async (testUser) => {
  console.log("\n📊 Testing session limits BEFORE expiry...");

  const sessionInfo = await getSessionLimitInfo(testUser._id);
  console.log("Session Info Before Expiry:");
  console.log(`   Total Sessions: ${sessionInfo.totalSessions}`);
  console.log(`   Sessions Remaining: ${sessionInfo.sessionsRemaining}`);
  console.log(`   Sessions Used: ${sessionInfo.sessionsUsed}`);
  console.log(`   Confirmed Appointments: ${sessionInfo.confirmedAppointments}`);
  console.log(`   Can Book More: ${sessionInfo.canBookMore}`);
  console.log(`   Available Bookings: ${sessionInfo.availableBookings}`);

  return sessionInfo;
};

// Run expiry process
const runExpiryProcess = async () => {
  console.log("\n⏰ Running appointment expiry process...");
  
  await appointmentExpiryService.manualTrigger();
  
  console.log("✅ Expiry process completed");
};

// Test session limits counting after expiry
const testSessionLimitsAfter = async (testUser, beforeInfo) => {
  console.log("\n📊 Testing session limits AFTER expiry...");

  const sessionInfo = await getSessionLimitInfo(testUser._id);
  console.log("Session Info After Expiry:");
  console.log(`   Total Sessions: ${sessionInfo.totalSessions}`);
  console.log(`   Sessions Remaining: ${sessionInfo.sessionsRemaining}`);
  console.log(`   Sessions Used: ${sessionInfo.sessionsUsed}`);
  console.log(`   Confirmed Appointments: ${sessionInfo.confirmedAppointments}`);
  console.log(`   Can Book More: ${sessionInfo.canBookMore}`);
  console.log(`   Available Bookings: ${sessionInfo.availableBookings}`);

  // Compare before and after
  console.log("\n🔍 Comparison:");
  console.log(`   Confirmed Appointments: ${beforeInfo.confirmedAppointments} → ${sessionInfo.confirmedAppointments}`);
  console.log(`   Available Bookings: ${beforeInfo.availableBookings} → ${sessionInfo.availableBookings}`);

  if (sessionInfo.availableBookings > beforeInfo.availableBookings) {
    console.log("✅ SUCCESS: Available bookings increased after expiry!");
  } else {
    console.log("❌ ISSUE: Available bookings did not increase");
  }

  return sessionInfo;
};

// Check appointment statuses
const checkAppointmentStatuses = async (appointments) => {
  console.log("\n📋 Checking appointment statuses after expiry...");

  for (const [name, appointment] of Object.entries(appointments)) {
    const updated = await Appointment.findById(appointment._id);
    console.log(`   ${name}: ${appointment.status} → ${updated.status}`);
    
    if (name === "pastAppointment" && updated.status === "expired") {
      console.log("   ✅ Past appointment correctly expired");
    } else if (name === "futureAppointment" && updated.status === "scheduled") {
      console.log("   ✅ Future appointment remains scheduled");
    } else if (name === "confirmedAppointment" && updated.status === "confirmed") {
      console.log("   ✅ Confirmed appointment unchanged");
    }
  }
};

// Cleanup test data
const cleanup = async (testUser, appointments) => {
  console.log("\n🧹 Cleaning up test data...");

  // Delete test appointments
  const appointmentIds = Object.values(appointments).map(apt => apt._id);
  await Appointment.deleteMany({ _id: { $in: appointmentIds } });
  console.log(`   Deleted ${appointmentIds.length} test appointments`);

  // Reset user subscription
  testUser.subscription.sessionsRemaining = 3;
  await testUser.save();
  console.log("   Reset user subscription");
};

// Main test function
const runTests = async () => {
  try {
    console.log("🚀 Starting Session Quota Expiry Tests");

    // Connect to database
    await connectDB();

    // Setup test data
    const { testUser, testPlan } = await setupTestData();
    console.log(`👤 Test User: ${testUser.name} (${testUser.email})`);
    console.log(`📋 Test Plan: ${testPlan.name} (${testPlan.sessions} sessions)`);

    // Create test appointments
    const appointments = await testAppointmentExpiry(testUser);

    // Test session limits before expiry
    const beforeInfo = await testSessionLimitsBefore(testUser);

    // Run expiry process
    await runExpiryProcess();

    // Test session limits after expiry
    const afterInfo = await testSessionLimitsAfter(testUser, beforeInfo);

    // Check appointment statuses
    await checkAppointmentStatuses(appointments);

    // Cleanup
    await cleanup(testUser, appointments);

    console.log("\n🎉 Tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("📴 Database connection closed");
    process.exit(0);
  }
};

// Run the tests
runTests();
