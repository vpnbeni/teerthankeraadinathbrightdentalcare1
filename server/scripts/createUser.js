import mongoose from "mongoose";
import { config } from "../src/config/environment.js";
import User from "../src/models/User.js";
import Plan from "../src/models/Plan.js";

/**
 * Script to create a user with a subscription plan
 */
async function createUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // User details
    const userData = {
      name: "Vipin Beniwal",
      phone: "8930232597",
      email: "vpnbeniwal123@gmail.com",
      address: "New Delhi, India",
      gender: "male",
      alternativePhone: "9876543210",
      passwordHash: "password123", // This will be hashed by the pre-save middleware
      role: "user",
      isVerified: true,
      phoneVerified: true,
      emailVerified: true,
      medicalInfo: {
        systemicDiseases: [],
        drugAllergies: [],
        isPregnant: false,
        pastTreatments: ["Regular checkup"],
        previousExperiences: ["Good experience with previous dentist"],
      },
    };

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { phone: userData.phone }
      ]
    });

    if (existingUser) {
      console.log("⚠️  User already exists!");
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Phone: ${existingUser.phone}`);
      console.log(`   Name: ${existingUser.name}`);
      
      // Ask if they want to update
      console.log("\n💡 If you want to update this user, delete them first:");
      console.log(`   db.users.deleteOne({ email: "${userData.email}" })`);
      process.exit(0);
    }

    // Find the Smile Saver Plan
    const smileSaverPlan = await Plan.findOne({ name: "Smile Saver Plan" });

    if (!smileSaverPlan) {
      console.error("❌ Smile Saver Plan not found!");
      console.log("   Please run: npm run seed-plans");
      process.exit(1);
    }

    console.log(`\n📋 Found Plan: ${smileSaverPlan.name}`);
    console.log(`   Price: ₹${smileSaverPlan.price}`);
    console.log(`   Duration: ${smileSaverPlan.duration} months`);
    console.log(`   Sessions: ${smileSaverPlan.sessions}`);

    // Create subscription details
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + smileSaverPlan.duration);

    userData.subscription = {
      planId: smileSaverPlan._id,
      startDate: startDate,
      endDate: endDate,
      sessionsRemaining: smileSaverPlan.sessions,
      totalSessions: smileSaverPlan.sessions,
      status: "active",
    };

    // Create user
    const user = new User(userData);
    await user.save();

    console.log("\n✅ User created successfully!");
    console.log("\n👤 User Details:");
    console.log("=".repeat(50));
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Gender: ${user.gender}`);
    console.log(`   Address: ${user.address}`);
    
    console.log("\n💳 Subscription Details:");
    console.log("=".repeat(50));
    console.log(`   Plan: ${smileSaverPlan.name}`);
    console.log(`   Price: ₹${smileSaverPlan.price}/year`);
    console.log(`   Start Date: ${startDate.toLocaleDateString()}`);
    console.log(`   End Date: ${endDate.toLocaleDateString()}`);
    console.log(`   Sessions Remaining: ${user.subscription.sessionsRemaining}`);
    console.log(`   Total Sessions: ${user.subscription.totalSessions}`);
    console.log(`   Status: ${user.subscription.status}`);

    console.log("\n🔐 Login Credentials:");
    console.log("=".repeat(50));
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: password123`);
    console.log("\n⚠️  User should change password after first login!");

    console.log("\n✨ User can now:");
    console.log("   • Login to the client app");
    console.log("   • Book appointments");
    console.log("   • Use their subscription sessions");
    
  } catch (error) {
    console.error("❌ Error creating user:", error);
    if (error.code === 11000) {
      console.log("\n💡 Duplicate key error - User with this email/phone already exists");
    }
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
createUser();

