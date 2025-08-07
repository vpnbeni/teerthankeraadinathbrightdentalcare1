import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../src/config/environment.js";
import User from "../src/models/User.js";

/**
 * Script to create an admin user
 */
async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: "admin@teerthankerdentalcare.com",
      role: "admin",
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      name: "Admin User",
      phone: "9999999999", // Dummy phone number for admin
      email: "admin@teerthankerdentalcare.com",
      passwordHash: "admin123", // This will be hashed by the pre-save middleware
      role: "admin",
      isVerified: true,
      // Admin doesn't need subscription, but schema requires it
      // We'll create a dummy subscription
      subscription: {
        planId: new mongoose.Types.ObjectId(), // Dummy plan ID
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        sessionsRemaining: 999,
        status: "active",
      },
    };

    const admin = new User(adminData);
    await admin.save();

    console.log("Admin user created successfully!");
    console.log("Email: admin@teerthankerdentalcare.com");
    console.log("Password: admin123");
    console.log("Please change the password after first login");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
createAdmin();
