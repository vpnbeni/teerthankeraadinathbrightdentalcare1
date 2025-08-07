#!/usr/bin/env node

/**
 * Comprehensive Integration Test Suite
 * Tests all critical functionality before production deployment
 */

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  apiUrl: process.env.API_URL || "http://localhost:5000/api",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  adminUrl: process.env.ADMIN_URL || "http://localhost:3001",
  timeout: 30000,
  retries: 3,
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

// Utility functions
const log = (message, type = "info") => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warning: "\x1b[33m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
      timeout: config.timeout,
      validateStatus: () => true, // Don't throw on HTTP errors
    });
    return response;
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      error: true,
    };
  }
};

const runTest = async (testName, testFunction) => {
  log(`Running test: ${testName}`, "info");
  try {
    await testFunction();
    testResults.passed++;
    log(`✅ PASSED: ${testName}`, "success");
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    log(`❌ FAILED: ${testName} - ${error.message}`, "error");
    return false;
  }
};

// Test suites
const healthCheckTests = async () => {
  await runTest("API Health Check", async () => {
    const response = await makeRequest("GET", `${config.apiUrl}/health`);
    if (response.status !== 200) {
      throw new Error(`API health check failed with status ${response.status}`);
    }
    if (response.data.status !== "healthy") {
      throw new Error(`API reports unhealthy status: ${response.data.status}`);
    }
  });

  await runTest("Client Portal Accessibility", async () => {
    const response = await makeRequest("GET", config.clientUrl);
    if (response.status !== 200) {
      throw new Error(`Client portal not accessible: ${response.status}`);
    }
  });

  await runTest("Admin Dashboard Accessibility", async () => {
    const response = await makeRequest("GET", config.adminUrl);
    if (response.status !== 200) {
      throw new Error(`Admin dashboard not accessible: ${response.status}`);
    }
  });
};

const authenticationTests = async () => {
  let authToken = null;
  let testUser = {
    name: "Integration Test User",
    phone: "+919999999999",
    email: "test@example.com",
  };

  await runTest("User Registration Flow", async () => {
    // Test registration endpoint
    const response = await makeRequest(
      "POST",
      `${config.apiUrl}/auth/register`,
      {
        ...testUser,
        planId: "507f1f77bcf86cd799439011", // Mock plan ID
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(
        `Registration failed: ${response.status} - ${JSON.stringify(
          response.data
        )}`
      );
    }
  });

  await runTest("OTP Verification Endpoint", async () => {
    // Test OTP verification endpoint (without actually sending OTP)
    const response = await makeRequest(
      "POST",
      `${config.apiUrl}/auth/verify-otp`,
      {
        phone: testUser.phone,
        otp: "123456", // This will fail but endpoint should respond properly
      }
    );

    // Should return 400 for invalid OTP, not 500
    if (response.status !== 400 && response.status !== 401) {
      throw new Error(
        `OTP verification endpoint not responding correctly: ${response.status}`
      );
    }
  });

  await runTest("Login Endpoint", async () => {
    // Test login endpoint structure
    const response = await makeRequest("POST", `${config.apiUrl}/auth/login`, {
      phone: testUser.phone,
      password: "testpassword",
    });

    // Should return proper error for non-existent user
    if (
      response.status !== 400 &&
      response.status !== 401 &&
      response.status !== 404
    ) {
      throw new Error(
        `Login endpoint not responding correctly: ${response.status}`
      );
    }
  });
};

const paymentTests = async () => {
  await runTest("Payment Plans Retrieval", async () => {
    const response = await makeRequest("GET", `${config.apiUrl}/plans`);
    if (response.status !== 200) {
      throw new Error(`Plans endpoint failed: ${response.status}`);
    }
    if (!Array.isArray(response.data.plans)) {
      throw new Error("Plans endpoint should return array of plans");
    }
  });

  await runTest("Payment Order Creation Endpoint", async () => {
    // Test payment order creation structure (will fail without auth but should respond)
    const response = await makeRequest(
      "POST",
      `${config.apiUrl}/payments/create-order`,
      {
        planId: "507f1f77bcf86cd799439011",
        amount: 5000,
      }
    );

    // Should return 401 for unauthorized, not 500
    if (response.status !== 401) {
      throw new Error(
        `Payment order endpoint not responding correctly: ${response.status}`
      );
    }
  });
};

const appointmentTests = async () => {
  await runTest("Appointment Booking Endpoint", async () => {
    // Test appointment booking structure (will fail without auth)
    const response = await makeRequest(
      "POST",
      `${config.apiUrl}/appointments`,
      {
        date: new Date().toISOString(),
        timeSlot: "09:00-10:00",
      }
    );

    // Should return 401 for unauthorized
    if (response.status !== 401) {
      throw new Error(
        `Appointment booking endpoint not responding correctly: ${response.status}`
      );
    }
  });

  await runTest("Available Time Slots Endpoint", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await makeRequest(
      "GET",
      `${config.apiUrl}/appointments/available-slots?date=${
        tomorrow.toISOString().split("T")[0]
      }`
    );

    // Should return 401 for unauthorized or 200 with slots
    if (response.status !== 401 && response.status !== 200) {
      throw new Error(
        `Available slots endpoint not responding correctly: ${response.status}`
      );
    }
  });
};

const fileUploadTests = async () => {
  await runTest("File Upload Endpoint", async () => {
    // Test file upload endpoint structure
    const response = await makeRequest("POST", `${config.apiUrl}/files/upload`);

    // Should return 401 for unauthorized or 400 for missing file
    if (response.status !== 401 && response.status !== 400) {
      throw new Error(
        `File upload endpoint not responding correctly: ${response.status}`
      );
    }
  });
};

const securityTests = async () => {
  await runTest("CORS Headers", async () => {
    const response = await makeRequest("OPTIONS", `${config.apiUrl}/health`);

    // Check if CORS headers are present
    const corsHeader = response.headers?.["access-control-allow-origin"];
    if (!corsHeader) {
      throw new Error("CORS headers not configured properly");
    }
  });

  await runTest("Security Headers", async () => {
    const response = await makeRequest("GET", `${config.apiUrl}/health`);

    // Check for basic security headers
    const securityHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
    ];

    for (const header of securityHeaders) {
      if (!response.headers?.[header]) {
        throw new Error(`Missing security header: ${header}`);
      }
    }
  });

  await runTest("Rate Limiting", async () => {
    // Make multiple rapid requests to test rate limiting
    const requests = Array(10)
      .fill()
      .map(() => makeRequest("GET", `${config.apiUrl}/health`));

    const responses = await Promise.all(requests);
    const rateLimited = responses.some((r) => r.status === 429);

    // Rate limiting might not trigger for health endpoint, so this is informational
    log(
      `Rate limiting test: ${rateLimited ? "Active" : "Not triggered"}`,
      "info"
    );
  });
};

const databaseTests = async () => {
  await runTest("Database Connection", async () => {
    const response = await makeRequest("GET", `${config.apiUrl}/health`);
    if (response.status !== 200) {
      throw new Error(
        "API not responding - possible database connection issue"
      );
    }

    if (response.data.database?.status !== "healthy") {
      throw new Error(
        `Database connection unhealthy: ${response.data.database?.status}`
      );
    }
  });
};

const performanceTests = async () => {
  await runTest("API Response Time", async () => {
    const startTime = Date.now();
    const response = await makeRequest("GET", `${config.apiUrl}/health`);
    const responseTime = Date.now() - startTime;

    if (response.status !== 200) {
      throw new Error("API not responding");
    }

    if (responseTime > 2000) {
      throw new Error(`API response time too slow: ${responseTime}ms`);
    }

    log(`API response time: ${responseTime}ms`, "info");
  });

  await runTest("Frontend Load Time", async () => {
    const startTime = Date.now();
    const response = await makeRequest("GET", config.clientUrl);
    const loadTime = Date.now() - startTime;

    if (response.status !== 200) {
      throw new Error("Client portal not loading");
    }

    if (loadTime > 5000) {
      throw new Error(`Frontend load time too slow: ${loadTime}ms`);
    }

    log(`Frontend load time: ${loadTime}ms`, "info");
  });
};

const monitoringTests = async () => {
  await runTest("Monitoring Endpoints", async () => {
    // Test monitoring endpoints (these might require auth)
    const endpoints = ["/monitoring/health", "/monitoring/metrics/prometheus"];

    for (const endpoint of endpoints) {
      const response = await makeRequest("GET", `${config.apiUrl}${endpoint}`);

      // Should respond (even if with 401)
      if (response.status === 0 || response.error) {
        throw new Error(`Monitoring endpoint ${endpoint} not responding`);
      }
    }
  });
};

// Main test runner
const runAllTests = async () => {
  log("🚀 Starting Integration Test Suite", "info");
  log(`Testing against: ${config.apiUrl}`, "info");

  const testSuites = [
    { name: "Health Check Tests", fn: healthCheckTests },
    { name: "Authentication Tests", fn: authenticationTests },
    { name: "Payment Tests", fn: paymentTests },
    { name: "Appointment Tests", fn: appointmentTests },
    { name: "File Upload Tests", fn: fileUploadTests },
    { name: "Security Tests", fn: securityTests },
    { name: "Database Tests", fn: databaseTests },
    { name: "Performance Tests", fn: performanceTests },
    { name: "Monitoring Tests", fn: monitoringTests },
  ];

  for (const suite of testSuites) {
    log(`\n📋 Running ${suite.name}...`, "info");
    await suite.fn();
  }

  // Generate report
  log("\n📊 Test Results Summary:", "info");
  log(`✅ Passed: ${testResults.passed}`, "success");
  log(
    `❌ Failed: ${testResults.failed}`,
    testResults.failed > 0 ? "error" : "info"
  );
  log(`⏭️  Skipped: ${testResults.skipped}`, "info");

  if (testResults.errors.length > 0) {
    log("\n🔍 Failed Tests Details:", "error");
    testResults.errors.forEach((error) => {
      log(`  • ${error.test}: ${error.error}`, "error");
    });
  }

  // Save results to file
  const reportPath = path.join(
    __dirname,
    "..",
    "integration-test-results.json"
  );
  const report = {
    timestamp: new Date().toISOString(),
    config,
    results: testResults,
    summary: {
      total: testResults.passed + testResults.failed + testResults.skipped,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      success: testResults.failed === 0,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Test report saved to: ${reportPath}`, "info");

  // Exit with appropriate code
  if (testResults.failed > 0) {
    log(
      "\n❌ Integration tests failed. Do not proceed with deployment.",
      "error"
    );
    process.exit(1);
  } else {
    log("\n✅ All integration tests passed. Ready for deployment!", "success");
    process.exit(0);
  }
};

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  log(`Unhandled rejection: ${error.message}`, "error");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  log(`Uncaught exception: ${error.message}`, "error");
  process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
  log(`Test suite failed: ${error.message}`, "error");
  process.exit(1);
});
