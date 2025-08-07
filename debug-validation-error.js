#!/usr/bin/env node

/**
 * Debug script to identify validation errors in the payment flow
 * Run this to diagnose the "Please fix the errors and try again" validation error
 */

import mongoose from "mongoose";
import { config } from "./server/src/config/environment.js";
import { Plan, User } from "./server/src/models/index.js";

console.log("🔍 Starting validation error diagnosis...\n");

async function diagnoseValidationError() {
  try {
    // 1. Check database connection
    console.log("1. Checking database connection...");
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Database connected successfully\n");

    // 2. Check Razorpay configuration
    console.log("2. Checking Razorpay configuration...");
    if (!config.RAZORPAY?.KEY_ID || !config.RAZORPAY?.KEY_SECRET) {
      console.log("❌ Razorpay configuration missing");
      console.log(
        "   - RAZORPAY_KEY_ID:",
        config.RAZORPAY?.KEY_ID ? "Present" : "Missing"
      );
      console.log(
        "   - RAZORPAY_KEY_SECRET:",
        config.RAZORPAY?.KEY_SECRET ? "Present" : "Missing"
      );
    } else {
      console.log("✅ Razorpay configuration present");
      console.log(
        "   - Key ID format:",
        config.RAZORPAY.KEY_ID.startsWith("rzp_") ? "Valid" : "Invalid"
      );
      console.log("   - Key ID length:", config.RAZORPAY.KEY_ID.length);
      console.log("   - Key Secret length:", config.RAZORPAY.KEY_SECRET.length);
    }
    console.log("");

    // 3. Check plans in database
    console.log("3. Checking available plans...");
    const plans = await Plan.find({});
    const activePlans = await Plan.find({ isActive: true });

    console.log(`   - Total plans: ${plans.length}`);
    console.log(`   - Active plans: ${activePlans.length}`);

    if (activePlans.length === 0) {
      console.log(
        "❌ No active plans found - this could cause validation errors"
      );
    } else {
      console.log("✅ Active plans available:");
      activePlans.forEach((plan) => {
        console.log(
          `     - ${plan.name} (${plan._id}): ₹${plan.price} for ${plan.sessions} sessions`
        );
      });
    }
    console.log("");

    // 4. Check users in database
    console.log("4. Checking user accounts...");
    const userCount = await User.countDocuments({});
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    console.log(`   - Total users: ${userCount}`);
    console.log(`   - Verified users: ${verifiedUsers}`);

    if (userCount === 0) {
      console.log("❌ No users found - authentication will fail");
    } else {
      console.log("✅ Users exist in database");
    }
    console.log("");

    // 5. Test ObjectId validation
    console.log("5. Testing ObjectId validation...");
    const testIds = [
      "507f1f77bcf86cd799439011", // Valid ObjectId
      "invalid-id", // Invalid ObjectId
      "", // Empty string
      null, // Null value
    ];

    testIds.forEach((id) => {
      const isValid = /^[0-9a-fA-F]{24}$/.test(id);
      console.log(`   - "${id}": ${isValid ? "✅ Valid" : "❌ Invalid"}`);
    });
    console.log("");

    // 6. Check environment variables
    console.log("6. Checking critical environment variables...");
    const criticalVars = [
      "NODE_ENV",
      "MONGODB_URI",
      "JWT_SECRET",
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
    ];

    criticalVars.forEach((varName) => {
      const value = process.env[varName];
      console.log(`   - ${varName}: ${value ? "✅ Present" : "❌ Missing"}`);
    });
    console.log("");

    // 7. Common validation scenarios
    console.log("7. Testing common validation scenarios...");

    // Test plan validation
    if (activePlans.length > 0) {
      const testPlan = activePlans[0];
      console.log(
        `   - Valid plan ID (${testPlan._id}): ✅ Should pass validation`
      );

      // Test with invalid plan ID
      console.log(
        `   - Invalid plan ID (invalid-id): ❌ Should fail validation`
      );

      // Test with non-existent but valid ObjectId
      const fakeId = new mongoose.Types.ObjectId();
      console.log(
        `   - Non-existent plan ID (${fakeId}): ❌ Should fail validation`
      );
    }

    console.log("\n🎯 Diagnosis complete!");
    console.log("\n📋 Common causes of validation errors:");
    console.log("   1. Invalid or missing plan ID in request");
    console.log("   2. User not authenticated (missing JWT token)");
    console.log("   3. Selected plan is inactive or doesn't exist");
    console.log("   4. Malformed request data (non-ObjectId format)");
    console.log("   5. Missing required environment variables");

    console.log("\n🔧 Recommended fixes:");
    console.log("   1. Ensure plan selection is working correctly in frontend");
    console.log("   2. Check user authentication status");
    console.log("   3. Verify plan IDs are valid ObjectIds");
    console.log("   4. Check browser network tab for actual request data");
    console.log("   5. Review server logs for specific validation failures");
  } catch (error) {
    console.error("❌ Diagnosis failed:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database disconnected");
  }
}

// Run diagnosis
diagnoseValidationError().catch(console.error);
