import { Plan } from "../models/index.js";
import { connectDB } from "../config/database.js";

/**
 * Seed default subscription plans
 */
const seedPlans = async () => {
  try {
    await connectDB();

    // Check if plans already exist
    const existingPlans = await Plan.find();
    if (existingPlans.length > 0) {
      console.log("Plans already exist, skipping seed");
      return;
    }

    const defaultPlans = [
      {
        name: "Basic Plan",
        sessions: 6,
        price: 5000,
        duration: 12,
        description:
          "Perfect for basic dental care needs with 6 sessions over a year",
        features: [
          "6 dental sessions per year",
          "Basic dental checkup",
          "Teeth cleaning",
          "Oral health consultation",
          "Priority booking",
        ],
      },
      {
        name: "Standard Plan",
        sessions: 8,
        price: 6500,
        duration: 12,
        description:
          "Comprehensive dental care with 8 sessions and additional benefits",
        features: [
          "8 dental sessions per year",
          "Complete dental checkup",
          "Professional teeth cleaning",
          "Oral health consultation",
          "X-ray examination (if needed)",
          "Priority booking",
          "Emergency consultation",
        ],
      },
      {
        name: "Premium Plan",
        sessions: 12,
        price: 9000,
        duration: 12,
        description:
          "Complete dental care package with maximum sessions and premium benefits",
        features: [
          "12 dental sessions per year",
          "Comprehensive dental examination",
          "Professional teeth cleaning & polishing",
          "Oral health consultation",
          "X-ray examination",
          "Fluoride treatment",
          "Priority booking",
          "Emergency consultation",
          "Dental care tips & guidance",
          "Follow-up reminders",
        ],
      },
    ];

    const createdPlans = await Plan.insertMany(defaultPlans);
    console.log(`✅ Created ${createdPlans.length} subscription plans:`);

    createdPlans.forEach((plan) => {
      console.log(
        `   - ${plan.name}: ₹${plan.price} (${plan.sessions} sessions)`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPlans().then(() => {
    process.exit(0);
  });
}

export { seedPlans };
