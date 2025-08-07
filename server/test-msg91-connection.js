#!/usr/bin/env node

/**
 * MSG91 Connection Test Script
 * Quick test to verify MSG91 credentials and connection
 */

import axios from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_BASE_URL = "https://api.msg91.com/api";

async function testMSG91Connection() {
  console.log("🔍 Testing MSG91 Connection");
  console.log("===========================");

  if (
    !MSG91_AUTH_KEY ||
    MSG91_AUTH_KEY.includes("dummy") ||
    MSG91_AUTH_KEY.length < 10
  ) {
    console.log("❌ MSG91_AUTH_KEY not configured or using dummy value");
    console.log("💡 Please set a valid MSG91_AUTH_KEY in server/.env");
    return false;
  }

  console.log("🔑 Auth Key:", MSG91_AUTH_KEY);
  console.log("🔑 Auth Key Length:", MSG91_AUTH_KEY.length);

  try {
    console.log("📡 Checking MSG91 balance...");

    const response = await axios.post(
      `${MSG91_BASE_URL}/balance.php`,
      new URLSearchParams({
        authkey: MSG91_AUTH_KEY,
        type: "4", // SMS type
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );

    console.log("📊 MSG91 Response:", response.data);

    // Handle different response formats
    if (typeof response.data === "string") {
      if (response.data.includes("Invalid")) {
        console.log("❌ MSG91 authentication failed");
        console.log("🔍 Response:", response.data);
        return false;
      } else {
        console.log("✅ MSG91 connection successful!");
        console.log("💰 Account balance:", response.data);
        return true;
      }
    } else if (typeof response.data === "object") {
      if (response.data.msgType === "error") {
        console.log("❌ MSG91 API error");
        console.log("🔍 Error code:", response.data.msg);

        // Common MSG91 error codes
        const errorCodes = {
          418: "Invalid authentication key",
          419: "Route not allowed for your account",
          420: "Invalid mobile number",
          421: "Invalid sender ID",
          422: "Invalid message",
          423: "Invalid country code",
          424: "SMS sending failed",
          425: "Insufficient balance",
        };

        const errorMessage = errorCodes[response.data.msg] || "Unknown error";
        console.log("🔍 Error description:", errorMessage);
        return false;
      } else {
        console.log("✅ MSG91 connection successful!");
        console.log("💰 Account info:", response.data);
        return true;
      }
    } else {
      console.log("❌ Unexpected response format");
      return false;
    }
  } catch (error) {
    console.log("❌ MSG91 connection error:", error.message);

    if (error.response) {
      console.log("📄 Response status:", error.response.status);
      console.log("📄 Response data:", error.response.data);
    }

    return false;
  }
}

async function testSMSSending() {
  console.log("\n📱 Testing SMS Sending");
  console.log("======================");

  // Use a test number (you can change this)
  const testPhone = "9999999999"; // Dummy number for testing
  const testMessage =
    "Test message from Teerthanker Dental Care - MSG91 integration test";

  try {
    console.log("📤 Sending test SMS...");

    const smsData = {
      authkey: MSG91_AUTH_KEY,
      mobiles: testPhone,
      message: testMessage,
      sender: "DENTAL",
      route: "4", // Transactional route
      country: "91",
    };

    const response = await axios.post(
      `${MSG91_BASE_URL}/sendhttp.php`,
      new URLSearchParams(smsData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      }
    );

    console.log("📊 SMS Response:", response.data);

    if (response.data && response.data.includes("Message Sent Successfully")) {
      console.log("✅ SMS sending capability verified!");
      return true;
    } else {
      console.log("❌ SMS sending failed");
      console.log("🔍 Response:", response.data);
      return false;
    }
  } catch (error) {
    console.log("❌ SMS sending error:", error.message);

    if (error.response) {
      console.log("📄 Response status:", error.response.status);
      console.log("📄 Response data:", error.response.data);
    }

    return false;
  }
}

async function main() {
  console.log("🚀 MSG91 Integration Test");
  console.log("=========================\n");

  const connectionOk = await testMSG91Connection();

  if (connectionOk) {
    await testSMSSending();
  } else {
    console.log("\n💡 To fix MSG91 connection:");
    console.log("1. Sign up at https://msg91.com/");
    console.log("2. Get your AUTH KEY from the dashboard");
    console.log("3. Update MSG91_AUTH_KEY in server/.env");
    console.log("4. Ensure you have SMS credits in your account");
  }

  console.log("\n🏁 Test completed");
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled error:", error.message);
  process.exit(1);
});

// Run the test
main().catch((error) => {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
});
