import mongoose from "mongoose";
import { config } from "../config/environment.js";
import Plan from "../models/Plan.js";

/**
 * Staging Plans - All prices set to ₹1 for testing purposes
 * This script is specifically for the staging environment
 */
const stagePlans = [
    // Adult Plans
    {
        name: "Tooth Protector Plan",
        description: "Perfect for basic dental care needs with essential treatments",
        price: 1, // ₹1 for testing
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
        price: 1, // ₹1 for testing
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
        price: 1, // ₹1 for testing
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
        price: 1, // ₹1 for testing
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
        price: 1, // ₹1 for testing
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

const seedStagePlans = async () => {
    console.log("🎭 STAGING PLANS SEED SCRIPT");
    console.log("============================");
    console.log("⚠️  All plan prices will be set to ₹1 for testing\n");

    try {
        // Verify we're connecting to the correct database
        const mongoUri = config.MONGODB_URI;
        console.log("📍 Connecting to MongoDB...");
        console.log(`   URI: ${mongoUri?.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);

        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB\n");

        // Show current database name
        const dbName = mongoose.connection.db.databaseName;
        console.log(`📦 Database: ${dbName}`);

        // Safety check - warn if database name doesn't look like staging
        if (!dbName.includes("stage") && !dbName.includes("test") && !dbName.includes("dev")) {
            console.log("\n⚠️  WARNING: Database name doesn't contain 'stage', 'test', or 'dev'");
            console.log("   Make sure you're not running this on production!");
            console.log("   Proceeding in 5 seconds...\n");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Clear existing plans
        const existingCount = await Plan.countDocuments();
        console.log(`\n🗑️  Removing ${existingCount} existing plans...`);
        await Plan.deleteMany({});
        console.log("✅ Cleared existing plans");

        // Insert new staging plans (all at ₹1)
        console.log("\n📝 Inserting staging plans (all at ₹1)...");
        const insertedPlans = await Plan.insertMany(stagePlans);

        console.log("\n✅ Inserted plans:");
        insertedPlans.forEach(plan => {
            console.log(`   - ${plan.name}: ₹${plan.price} (${plan.category})`);
        });

        console.log("\n🎉 Staging seed completed successfully!");
        console.log("   All plans are now priced at ₹1 for testing\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedStagePlans();
