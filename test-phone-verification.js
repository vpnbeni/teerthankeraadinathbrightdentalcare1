const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

// Test phone verification for profile
async function testPhoneVerificationForProfile() {
  try {
    console.log("🧪 Testing Phone Verification for Profile...\n");

    // First, you need to login to get a token
    console.log(
      "⚠️  Note: You need to be logged in to test profile phone verification"
    );
    console.log("1. Login to your account first");
    console.log(
      "2. Copy the token from browser cookies or use a logged-in session"
    );
    console.log("3. Replace the token below with your actual token\n");

    const token = "your-jwt-token-here"; // Replace with actual token

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Test 1: Send OTP to phone for profile
    console.log("1. Testing send phone OTP for profile...");
    try {
      const otpResponse = await axios.post(
        `${API_BASE}/auth/send-phone-otp-profile`,
        {
          phone: "9876543210", // Replace with test phone number
        },
        { headers }
      );

      console.log("✅ Phone OTP sent:", otpResponse.data);
    } catch (error) {
      console.log("❌ Send OTP failed:", error.response?.data || error.message);
      return;
    }

    // Test 2: Verify phone OTP for profile
    console.log("\n2. Testing verify phone OTP for profile...");
    const testOTP = "123456"; // In development, check console for actual OTP

    try {
      const verifyResponse = await axios.post(
        `${API_BASE}/auth/verify-phone-otp-profile`,
        {
          phone: "9876543210", // Same phone number
          otp: testOTP,
        },
        { headers }
      );

      console.log("✅ Phone verification successful:", verifyResponse.data);
    } catch (error) {
      console.log(
        "❌ Phone verification failed:",
        error.response?.data || error.message
      );
    }

    // Test 3: Check if phone login works now
    console.log("\n3. Testing phone login after verification...");
    try {
      // First send login OTP
      const loginOtpResponse = await axios.post(
        `${API_BASE}/auth/send-login-otp`,
        {
          phone: "9876543210",
        }
      );

      console.log("✅ Login OTP sent:", loginOtpResponse.data);

      // Then try to login with OTP (you'll need to check console for OTP)
      console.log("📝 Check server console for login OTP and test manually");
    } catch (error) {
      console.log(
        "❌ Login OTP failed:",
        error.response?.data || error.message
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Test availability check
async function testPhoneAvailability() {
  try {
    console.log("\n🧪 Testing Phone Availability Check...\n");

    const response = await axios.get(
      `${API_BASE}/auth/check-phone?phone=9876543210`
    );
    console.log("✅ Phone availability check:", response.data);
  } catch (error) {
    console.log(
      "❌ Phone availability check failed:",
      error.response?.data || error.message
    );
  }
}

// Run tests
async function runTests() {
  await testPhoneAvailability();
  await testPhoneVerificationForProfile();

  console.log("\n📋 Manual Testing Steps:");
  console.log("1. Start the server: npm run dev");
  console.log("2. Open the client: npm start");
  console.log("3. Login to your account");
  console.log("4. Go to Profile > Account Security tab");
  console.log("5. Add and verify your phone number");
  console.log("6. Try logging out and logging in with phone number");
  console.log("7. Check that phone login works correctly");
}

runTests();
