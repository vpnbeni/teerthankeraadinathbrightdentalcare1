// Test script to verify holiday creation API
import fetch from "node-fetch";

const testHolidayCreation = async () => {
  try {
    console.log("🧪 Testing Holiday Creation API...");

    // You'll need to replace this with a valid JWT token from a logged-in admin user
    const JWT_TOKEN = "YOUR_JWT_TOKEN_HERE";

    const holidayData = {
      date: "2025-12-25",
      reason: "Christmas Day",
      type: "public_holiday",
      isRecurring: true,
      recurringPattern: "yearly",
      isActive: true,
    };

    console.log("📤 Sending holiday data:", holidayData);

    const response = await fetch(
      "http://localhost:5000/api/availability/holidays",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
        body: JSON.stringify(holidayData),
      }
    );

    console.log("📥 Response status:", response.status);
    console.log("📥 Response headers:", [...response.headers.entries()]);

    const responseData = await response.json();
    console.log("📥 Response data:", JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log("✅ Holiday creation successful!");
    } else {
      console.log("❌ Holiday creation failed:", responseData.message);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

console.log("To test the holiday creation API:");
console.log("1. Login to the admin panel to get a JWT token");
console.log("2. Replace YOUR_JWT_TOKEN_HERE with the actual token");
console.log("3. Run: node test-holiday-creation.js");
console.log("");
console.log(
  "Or check the browser network tab when submitting the holiday form"
);

// Uncomment to run the test with a valid token
// testHolidayCreation();
