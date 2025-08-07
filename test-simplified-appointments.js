/**
 * Test script for simplified appointment APIs
 * Run this to verify the simplified appointment system works
 */

const API_BASE = "http://localhost:5000/api";

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    console.log(`${options.method || "GET"} ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return null;
  }
}

// Test functions
async function testAppointmentAPIs() {
  console.log("🧪 Testing Simplified Appointment APIs\n");

  // Test 1: Get available slots for today
  console.log("1. Testing available slots...");
  const today = new Date().toISOString().split("T")[0];
  await apiCall(`/appointments/available-slots/${today}`);
  console.log("");

  // Test 2: Get all appointments (requires admin auth)
  console.log("2. Testing get all appointments...");
  await apiCall("/appointments/admin/all");
  console.log("");

  // Test 3: Get appointment statistics (requires admin auth)
  console.log("3. Testing appointment statistics...");
  await apiCall("/appointments/admin/statistics");
  console.log("");

  // Test 4: Test appointment creation (requires auth)
  console.log("4. Testing appointment creation...");
  const appointmentData = {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Tomorrow
    timeSlot: "10:00",
    notes: "Test appointment from simplified API",
    userId: "507f1f77bcf86cd799439011", // Mock user ID
  };

  await apiCall("/appointments", {
    method: "POST",
    body: JSON.stringify(appointmentData),
  });
  console.log("");

  console.log("✅ Simplified API tests completed!");
  console.log(
    "\nNote: Some tests may fail due to authentication requirements."
  );
  console.log("To fully test, you need to:");
  console.log("1. Start the server: npm run dev (in server directory)");
  console.log("2. Login as admin to get auth token");
  console.log("3. Include Authorization header in requests");
}

// Run tests if this file is executed directly
if (typeof window === "undefined") {
  testAppointmentAPIs();
}

export { testAppointmentAPIs };
