/**
 * Test script to verify session synchronization
 * Run with: node test-session-sync.js
 */

import { connectDB } from "./src/config/database.js";
import {
  syncAllUsersSessionCounts,
  calculateSessionInfo,
} from "./src/utils/sessionCalculator.js";
import { User } from "./src/models/index.js";

async function testSessionSync() {
  try {
    console.log("🔄 Connecting to database...");
    await connectDB();

    console.log("📊 Testing session synchronization...");

    // Get a sample user with active subscription
    const sampleUser = await User.findOne({
      "subscription.status": "active",
      "subscription.planId": { $exists: true },
    }).populate("subscription.planId");

    if (!sampleUser) {
      console.log("❌ No users with active subscriptions found");
      process.exit(1);
    }

    console.log(
      `👤 Testing with user: ${sampleUser.name} (${sampleUser.phone})`
    );
    console.log(
      `📋 Plan: ${sampleUser.subscription.planId.name} (${sampleUser.subscription.planId.sessions} sessions)`
    );
    console.log(
      `💾 Current sessionsRemaining in DB: ${sampleUser.subscription.sessionsRemaining}`
    );

    // Calculate accurate session info
    const sessionInfo = await calculateSessionInfo(sampleUser);

    console.log("\n📈 Calculated Session Information:");
    console.log(`   Total Sessions: ${sessionInfo.totalSessions}`);
    console.log(`   Sessions Used: ${sessionInfo.sessionsUsed}`);
    console.log(`   Sessions Remaining: ${sessionInfo.sessionsRemaining}`);
    console.log(
      `   Confirmed Appointments: ${sessionInfo.confirmedAppointments}`
    );
    console.log(
      `   Completed Appointments: ${sessionInfo.completedAppointments}`
    );
    console.log(`   Available Bookings: ${sessionInfo.availableBookings}`);
    console.log(`   Is Active: ${sessionInfo.isActive}`);

    // Check if sync is needed
    if (
      sampleUser.subscription.sessionsRemaining !==
      sessionInfo.sessionsRemaining
    ) {
      console.log(
        `\n⚠️  Sync needed! DB shows ${sampleUser.subscription.sessionsRemaining}, calculated ${sessionInfo.sessionsRemaining}`
      );
    } else {
      console.log("\n✅ Session count is already in sync!");
    }

    // Run full sync
    console.log("\n🔄 Running full session sync...");
    const syncResult = await syncAllUsersSessionCounts();

    console.log("\n📊 Sync Results:");
    console.log(`   Total Users: ${syncResult.totalUsers}`);
    console.log(`   Synced Count: ${syncResult.syncedCount}`);
    console.log(`   Error Count: ${syncResult.errorCount}`);

    if (syncResult.errors.length > 0) {
      console.log("\n❌ Errors:");
      syncResult.errors.forEach((error) => {
        console.log(`   User ${error.userId}: ${error.error}`);
      });
    }

    console.log("\n✅ Session sync test completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testSessionSync();
