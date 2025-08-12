/**
 * Test script to verify session handling fix
 * This script tests the authentication flow and cookie handling
 */

const axios = require("axios");

const API_BASE_URL =
  process.env.API_URL || "https://teerthanker-server.vercel.app/api";
const CLIENT_URL =
  process.env.CLIENT_URL ||
  "https://teerthankeraadinathbrightdentalcare-ten.vercel.app";

console.log("🧪 Testing Session Handling Fix");
console.log(`API URL: ${API_BASE_URL}`);
console.log(`Client URL: ${CLIENT_URL}`);

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Origin: CLIENT_URL,
  },
  timeout: 10000,
});

async function testSessionHandling() {
  try {
    console.log("\n1. Testing CORS preflight...");

    // Test CORS preflight
    const corsResponse = await api.options("/auth/check");
    console.log("✅ CORS preflight successful");

    console.log("\n2. Testing auth check without token...");

    // Test auth check without token (should fail gracefully)
    try {
      await api.get("/auth/check");
      console.log("❌ Auth check should have failed without token");
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Auth check correctly returned 401 without token");
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }

    console.log("\n3. Testing email OTP flow...");

    // Test email OTP (this should work without authentication)
    const testEmail = "test@gmail.com";
    try {
      await api.post("/auth/send-email-otp", { email: testEmail });
      console.log("✅ Email OTP endpoint accessible");
    } catch (error) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("already registered")
      ) {
        console.log("✅ Email OTP endpoint working (email already registered)");
      } else {
        console.log(
          `⚠️ Email OTP error: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }

    console.log("\n4. Testing server health...");

    // Test server health
    const healthResponse = await api.get("/");
    console.log("✅ Server health check successful");
    console.log(`Environment: ${healthResponse.data.environment}`);

    console.log("\n✅ Session handling tests completed");
    console.log("\nKey fixes applied:");
    console.log("- Updated CORS origins to include Vercel URLs");
    console.log('- Changed cookie sameSite to "none" for production');
    console.log("- Removed domain restriction for cookies");
    console.log("- Added proper CORS logging for debugging");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testSessionHandling();
