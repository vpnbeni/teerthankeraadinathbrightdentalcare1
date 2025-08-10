// Debug script to test payment flow
// Run this in browser console to test API endpoints

const testPaymentFlow = async () => {
  console.log("🔍 Testing Payment Flow...");

  try {
    // Test 1: Check if API is accessible
    console.log("1. Testing API connection...");
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${apiUrl}/plans`);
    if (response.ok) {
      const data = await response.json();
      console.log("✅ API connection successful");
      console.log("📋 Plans data:", data);
    } else {
      console.error("❌ API connection failed:", response.status);
    }

    // Test 2: Check auth endpoints
    console.log("2. Testing auth endpoints...");
    const authTest = await fetch(`${apiUrl}/auth/check`, {
      credentials: "include",
    });
    console.log("🔐 Auth check status:", authTest.status);
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("💡 Possible issues:");
    console.log("   - Backend server not running");
    console.log("   - CORS configuration issues");
    console.log("   - Network connectivity problems");
  }
};

// Run the test
testPaymentFlow();
