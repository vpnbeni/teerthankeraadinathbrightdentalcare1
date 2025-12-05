import mongoose from "mongoose";
import { config } from "../config/environment.js";
import Plan from "../models/Plan.js";

const plans = [
  // Adult Plans
  {
    name: "Tooth Protector Plan",
    description: "Perfect for basic dental care needs with essential treatments",
    price: 6999,
    duration: 12,
    sessions: 2,
    category: "adult",
    features: [
      "Scaling & Polishing – 1 session",
      "OPG – 2 times",
      "RVG – as required",
      "Fillings – 2 teeth",
      "RCT – 2 single-rooted teeth",
      "1 PFM Crown",
      "Simple extractions",
      "2 routine check-ups",
      "Up to 10% Discounts available on dentures/bridges/fillings/RPD",
      "Senior citizen discount: 10-15%"
    ],
    isActive: true,
  },
  {
    name: "Dental Shield Plan",
    description: "Comprehensive dental care package with extended coverage",
    price: 12999,
    duration: 12,
    sessions: 4,
    category: "adult",
    features: [
      "Scaling & Polishing – 2 sessions",
      "Simple + Complicated extractions",
      "Composite/GIC fillings – up to 6 teeth",
      "RCT – Single-rooted (unlimited)",
      "RPD – Acrylic (up to 3 teeth)",
      "4 PFM crowns",
      "1 Zirconia crown",
      "4 routine check-ups",
      "Up to 10% Discounts available on dentures/bridges/fillings/RPD",
      "Senior citizen discount: 10-15%"
    ],
    isActive: true,
  },
  {
    name: "Smile Saver Plan",
    description: "Premium dental care with unlimited treatments and priority access",
    price: 24999,
    duration: 12,
    sessions: 12,
    category: "adult",
    features: [
      "Unlimited scaling",
      "Unlimited fillings",
      "RCT – All teeth",
      "6 PFM crowns",
      "4 Zirconia crowns",
      "Flexible RPD – up to 5 teeth",
      "Gum treatment",
      "Surgical impaction (partially impacted)",
      "Priority check-ups",
      "Up to 10% Discounts available on dentures/bridges/fillings/RPD",
      "Senior citizen discount: 10-15%"
    ],
    isActive: true,
  },
  // Kids Plans (Age 3-14 years)
  {
    name: "Kids Protect Plan",
    description: "Essential dental care for growing smiles",
    price: 4999,
    duration: 12,
    sessions: 2,
    category: "kids",
    ageRange: "3-14 years",
    features: [
      "Dental Check-up – 2 times/year",
      "Scaling & Polishing – 1 session",
      "Fluoride Application – 1 session",
      "Diet & Oral Hygiene Counseling",
      "Fillings – 2 teeth",
      "X-ray – 1 film included",
      "Pain relief visit – 2 times",
      "Minor gum infection treatment"
    ],
    isActive: true,
  },
  {
    name: "Kids Shield Plan",
    description: "Comprehensive dental care for healthy kids",
    price: 8999,
    duration: 12,
    sessions: 4,
    category: "kids",
    ageRange: "3-14 years",
    features: [
      "Fluorine – 2 sessions",
      "Fluoride Application – 2 sessions",
      "Pit & Fissure Sealants – 4 molars",
      "Fillings – 4 teeth",
      "Simple Extractions – 2 teeth",
      "X-rays – 2 films",
      "Orthodontic Evaluation – 1 visit (early detection of crooked teeth)"
    ],
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
