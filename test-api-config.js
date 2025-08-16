#!/usr/bin/env node

/**
 * Test API Configuration Script
 * Verifies that the API URLs are correctly configured
 */

import axios from "axios";

// Test configuration
const testConfig = {
  admin: {
    baseURL: "https://teerthanker-server.vercel.app/api",
    endpoints: [
      "/auth/admin/login",
      "/auth/logout",
      "/admin/users",
      "/admin/appointments"
    ]
  },
  client: {
    baseURL: "https://teerthanker-server.vercel.app/api",
    endpoints: [
      "/auth/login",
      "/auth/register",
      "/appointments",
      "/plans"
    ]
  }
};

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Utility functions
const log = (message, type = "info") => {
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warning: "\x1b[33m",
    reset: "\x1b[0m"
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
};

const testEndpoint = async (baseURL, endpoint, description, method = 'GET') => {
  const url = `${baseURL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    let response;
    
    if (method === 'POST') {
      // For POST requests, send minimal test data
      const testData = {
        email: 'test@test.com',
        password: 'testpassword123'
      };
      
      response = await axios.post(url, testData, { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      response = await axios.get(url, { timeout: 10000 });
    }
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200 || response.status === 401) {
      // 401 is expected for protected endpoints without auth
      log(`✅ ${description}: ${response.status} (${duration}ms)`, "success");
      return { success: true, status: response.status, duration };
    } else {
      log(`⚠️  ${description}: Unexpected status ${response.status}`, "warning");
      return { success: false, status: response.status, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.response?.status === 401) {
      // 401 is expected for protected endpoints
      log(`✅ ${description}: 401 Unauthorized (expected) (${duration}ms)`, "success");
      return { success: true, status: 401, duration };
    } else if (error.response?.status === 400) {
      // 400 is expected for validation errors (e.g., password too short)
      log(`✅ ${description}: 400 Validation Error (expected) (${duration}ms)`, "success");
      return { success: true, status: 400, duration };
    } else if (error.code === "ECONNABORTED") {
      log(`❌ ${description}: Timeout after ${duration}ms`, "error");
      return { success: false, error: "timeout" };
    } else {
      log(`❌ ${description}: ${error.message}`, "error");
      return { success: false, error: error.message };
    }
  }
};

const runTests = async () => {
  log("Starting API configuration tests...", "info");
  log(`Testing against: ${testConfig.admin.baseURL}`, "info");
  
  // Test Admin API endpoints
  log("\nTesting Admin API endpoints:", "info");
  for (const endpoint of testConfig.admin.endpoints) {
    const method = endpoint.includes('/auth/') ? 'POST' : 'GET';
    const result = await testEndpoint(
      testConfig.admin.baseURL,
      endpoint,
      `Admin ${endpoint}`,
      method
    );
    results.tests.push({
      type: "admin",
      endpoint,
      method,
      ...result
    });
    results.summary.total++;
    if (result.success) results.summary.passed++;
    else results.summary.failed++;
  }
  
  // Test Client API endpoints
  log("\nTesting Client API endpoints:", "info");
  for (const endpoint of testConfig.client.endpoints) {
    const method = endpoint.includes('/auth/') ? 'POST' : 'GET';
    const result = await testEndpoint(
      testConfig.client.baseURL,
      endpoint,
      `Client ${endpoint}`,
      method
    );
    results.tests.push({
      type: "client",
      endpoint,
      method,
      ...result
    });
    results.summary.total++;
    if (result.success) results.summary.passed++;
    else results.summary.failed++;
  }
  
  // Summary
  log("\n" + "=".repeat(50), "info");
  log("TEST SUMMARY", "info");
  log("=".repeat(50), "info");
  log(`Total Tests: ${results.summary.total}`, "info");
  log(`Passed: ${results.summary.passed}`, "success");
  log(`Failed: ${results.summary.failed}`, results.summary.failed > 0 ? "error" : "success");
  
  if (results.summary.failed === 0) {
    log("\n🎉 All API configuration tests passed!", "success");
    log("Your API is properly configured and accessible.", "success");
  } else {
    log("\n⚠️  Some tests failed. Please check your configuration.", "warning");
  }
  
  // Save results
  const fs = await import('fs');
  fs.writeFileSync('api-test-results.json', JSON.stringify(results, null, 2));
  log("\nResults saved to api-test-results.json", "info");
};

// Run tests
runTests().catch(error => {
  log(`Test execution failed: ${error.message}`, "error");
  process.exit(1);
});
