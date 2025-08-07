import mongoose from "mongoose";
import { config } from "../config/environment.js";
import Plan from "../models/Plan.js";

const plans = [
  {
    name: "Basic Plan",
    description: "Perfect for basic dental care needs",
    price: 4999,
    duration: 3,
    sessions: 3,
    isActive: true,
  },
  {
    name: "Standard Plan",
    description: "Comprehensive dental care package",
    price: 7999,
    duration: 6,
    sessions: 6,
    isActive: true,
  },
  {
    name: "Premium Plan",
    description: "Complete dental care with priority access",
    price: 14999,
    duration: 12,
    sessions: 12,
    isActive: true,
  },
];

const seedPlans = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing plans
    await Plan.deleteMany({});
    console.log("Cleared existing plans");

    // Insert new plans
    await Plan.insertMany(plans);
    console.log("Added new plans");

    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedPlans();
