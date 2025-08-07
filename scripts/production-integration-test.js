#!/usr/bin/env node

/**
 * Production Integration Test Suite
 * Comprehensive end-to-end testing for production deployment
 */

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production configuration
const PRODUCTION_CONFIG = {
  apiUrl: "https://api.teerthankerdentalcare.com/api",
  clientUrl: "https://client.teerthankerdentalcare.com",
  adminUrl: "https://admin.teerthankerdentalcare.com",
  timeout: 30000,
};

const testResults = {
  timestamp: new Date().toISOString(),
  environment: "production",
  tests: [],
  summary: { total: 0, passed: 0, failed: 0, warnings: 0 },
};

// Utility functions
const log = (message, type = "info") => {
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warning: "\x1b[33m",
    reset: "\x1b[0m",
  };
  console.log(
    `${colors[type]}[${new Date().toISOString()}] ${message}${colors.reset}`
  );
};

const recordTest = (name, status, details = {}) => {
  const test = {
    name,
    status,
    timestamp: new Date().toISOString(),
    ...details,
  };
  testResults.tests.push(test);
  testResults.summary.total++;
  testResults.summary[status]++;

  const emoji = { passed: "✅", failed: "❌", warnings: "⚠️" };
  log(
    `${emoji[status]} ${name}${details.message ? ": " + details.message : ""}`,
    status === "failed"
      ? "error"
      : status === "warnings"
      ? "warning"
      : "success"
  );
};

const makeRequest = async (method, url, data = null, headers = {}) => {
  const startTime = Date.now();
  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
      timeout: PRODUCTION_CONFIG.timeout,
      validateStatus: () => true,
    });
    return { ...response, responseTime: Date.now() - startTime };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      responseTime: Date.now() - startTime,
      error: true,
    };
  }
};

// Test suites
const testSystemHealth = async () => {
  log("\n🏥 Testing System Health...", "info");

  // API Health Check
  const healthResponse = await makeRequest(
    "GET",
    `${PRODUCTION_CONFIG.apiUrl}/health`
  );
  if (healthResponse.error) {
    recordTest("API Health Check", "failed", {
      message: `Connection failed: ${healthResponse.data.error}`,
    });
  } else if (
    healthResponse.status === 200 &&
    healthResponse.data.status === "healthy"
  ) {
    recordTest("API Health Check", "passed", {
      message: `Healthy (${healthResponse.responseTime}ms)`,
      responseTime: healthResponse.responseTime,
      uptime: healthResponse.data.uptime,
    });
  } else {
    recordTest("API Health Check", "failed", {
      message: `Unhealthy status: ${
        healthResponse.data.status || healthResponse.status
      }`,
    });
  }

  // Database Health
  if (healthResponse.data?.database?.status === "healthy") {
    recordTest("Database Health", "passed", {
      message: "Database connection healthy",
    });
  } else {
    recordTest("Database Health", "failed", {
      message: `Database status: ${
        healthResponse.data?.database?.status || "unknown"
      }`,
    });
  }
};

const testApplicationAccess = async () => {
  log("\n🌐 Testing Application Access...", "info");

  const apps = [
    { name: "Client Portal", url: PRODUCTION_CONFIG.clientUrl },
    { name: "Admin Dashboard", url: PRODUCTION_CONFIG.adminUrl },
  ];

  for (const app of apps) {
    const response = await makeRequest("GET", app.url);

    if (response.error) {
      recordTest(`${app.name} Access`, "failed", {
        message: `Connection failed: ${response.data.error}`,
        url: app.url,
      });
    } else if (response.status === 200) {
      recordTest(`${app.name} Access`, "passed", {
        message: `Accessible (${response.responseTime}ms)`,
        url: app.url,
        responseTime: response.responseTime,
      });
    } else {
      recordTest(`${app.name} Access`, "failed", {
        message: `HTTP ${response.status}`,
        url: app.url,
      });
    }
  }
};

const testAPIEndpoints = async () => {
  log("\n🔌 Testing Critical API Endpoints...", "info");

  const endpoints = [
    { path: "/plans", name: "Subscription Plans", expectedStatus: 200 },
    {
      path: "/auth/register",
      name: "User Registration",
      method: "POST",
      expectedStatus: 400,
    },
    {
      path: "/appointments/available-slots",
      name: "Available Slots",
      expectedStatus: 401,
    },
    {
      path: "/monitoring/health",
      name: "Monitoring Health",
      expectedStatus: 200,
    },
  ];

  for (const endpoint of endpoints) {
    const url = `${PRODUCTION_CONFIG.apiUrl}${endpoint.path}`;
    const method = endpoint.method || "GET";
    const testData = method === "POST" ? {} : null;

    const response = await makeRequest(method, url, testData);

    if (response.error) {
      recordTest(`API ${endpoint.name}`, "failed", {
        message: `Connection failed: ${response.data.error}`,
        url,
      });
    } else if (response.status === endpoint.expectedStatus) {
      recordTest(`API ${endpoint.name}`, "passed", {
        message: `Responding correctly (${response.responseTime}ms)`,
        url,
        responseTime: response.responseTime,
      });
    } else {
      recordTest(`API ${endpoint.name}`, "warnings", {
        message: `Expected ${endpoint.expectedStatus}, got ${response.status}`,
        url,
      });
    }
  }
};

const testSSLSecurity = async () => {
  log("\n🔒 Testing SSL and Security...", "info");

  const urls = Object.values(PRODUCTION_CONFIG);

  for (const url of urls) {
    if (!url.startsWith("https://")) continue;

    const response = await makeRequest("GET", url);
    const serviceName = url.includes("api")
      ? "API"
      : url.includes("admin")
      ? "Admin"
      : "Client";

    if (response.error) {
      recordTest(`SSL ${serviceName}`, "failed", {
        message: `SSL connection failed: ${response.data.error}`,
        url,
      });
      continue;
    }

    // Check security headers
    const securityHeaders = {
      "strict-transport-security": "HSTS",
      "x-content-type-options": "Content Type Options",
      "x-frame-options": "Frame Options",
      "x-xss-protection": "XSS Protection",
    };

    const missingHeaders = [];
    for (const [header, name] of Object.entries(securityHeaders)) {
      if (
        !response.headers[header] &&
        !response.headers[header.toLowerCase()]
      ) {
        missingHeaders.push(name);
      }
    }

    if (missingHeaders.length === 0) {
      recordTest(`Security Headers ${serviceName}`, "passed", {
        message: "All security headers present",
        url,
      });
    } else {
      recordTest(`Security Headers ${serviceName}`, "warnings", {
        message: `Missing: ${missingHeaders.join(", ")}`,
        url,
      });
    }
  }
};

const testHTTPSRedirect = async () => {
  log("\n🔄 Testing HTTPS Redirects...", "info");

  const httpsUrls = Object.values(PRODUCTION_CONFIG).filter((url) =>
    url.startsWith("https://")
  );

  for (const httpsUrl of httpsUrls) {
    const httpUrl = httpsUrl.replace("https://", "http://");
    const serviceName = httpsUrl.includes("api")
      ? "API"
      : httpsUrl.includes("admin")
      ? "Admin"
      : "Client";

    const response = await makeRequest(
      "GET",
      httpUrl,
      null,
      {},
      { maxRedirects: 0 }
    );

    if (response.status === 301 || response.status === 302) {
      const location = response.headers.location;
      if (location && location.startsWith("https://")) {
        recordTest(`HTTPS Redirect ${serviceName}`, "passed", {
          message: "HTTP correctly redirects to HTTPS",
          httpUrl,
          httpsUrl: location,
        });
      } else {
        recordTest(`HTTPS Redirect ${serviceName}`, "warnings", {
          message: `Redirect location not HTTPS: ${location}`,
          httpUrl,
        });
      }
    } else {
      recordTest(`HTTPS Redirect ${serviceName}`, "warnings", {
        message: `No redirect (status: ${response.status})`,
        httpUrl,
      });
    }
  }
};

const testPerformance = async () => {
  log("\n⚡ Testing Performance...", "info");

  const performanceTests = [
    {
      name: "API Response Time",
      url: `${PRODUCTION_CONFIG.apiUrl}/health`,
      maxTime: 2000,
    },
    {
      name: "Client Load Time",
      url: PRODUCTION_CONFIG.clientUrl,
      maxTime: 5000,
    },
    { name: "Admin Load Time", url: PRODUCTION_CONFIG.adminUrl, maxTime: 5000 },
  ];

  for (const test of performanceTests) {
    const response = await makeRequest("GET", test.url);

    if (response.error) {
      recordTest(`Performance ${test.name}`, "failed", {
        message: `Connection failed: ${response.data.error}`,
        url: test.url,
      });
    } else if (response.responseTime <= test.maxTime) {
      recordTest(`Performance ${test.name}`, "passed", {
        message: `Fast response: ${response.responseTime}ms`,
        url: test.url,
        responseTime: response.responseTime,
      });
    } else {
      recordTest(`Performance ${test.name}`, "warnings", {
        message: `Slow response: ${response.responseTime}ms (max: ${test.maxTime}ms)`,
        url: test.url,
        responseTime: response.responseTime,
      });
    }
  }
};

const testCORS = async () => {
  log("\n🌐 Testing CORS Configuration...", "info");

  const corsTests = [
    {
      origin: PRODUCTION_CONFIG.clientUrl,
      target: `${PRODUCTION_CONFIG.apiUrl}/health`,
      name: "Client to API CORS",
    },
    {
      origin: PRODUCTION_CONFIG.adminUrl,
      target: `${PRODUCTION_CONFIG.apiUrl}/health`,
      name: "Admin to API CORS",
    },
  ];

  for (const test of corsTests) {
    const response = await makeRequest("OPTIONS", test.target, null, {
      Origin: test.origin,
      "Access-Control-Request-Method": "GET",
    });

    if (response.error) {
      recordTest(test.name, "failed", {
        message: `CORS preflight failed: ${response.data.error}`,
        origin: test.origin,
        target: test.target,
      });
    } else if (response.headers["access-control-allow-origin"]) {
      recordTest(test.name, "passed", {
        message: "CORS configured correctly",
        origin: test.origin,
        target: test.target,
      });
    } else {
      recordTest(test.name, "warnings", {
        message: "CORS headers not found",
        origin: test.origin,
        target: test.target,
      });
    }
  }
};

const testExternalServices = async () => {
  log("\n🔗 Testing External Service Integration...", "info");

  // Test if external service endpoints are reachable (without actual API calls)
  const externalServices = [
    { name: "Razorpay", url: "https://api.razorpay.com" },
    { name: "Cloudinary", url: "https://api.cloudinary.com" },
    { name: "MSG91", url: "https://api.msg91.com" },
  ];

  for (const service of externalServices) {
    const response = await makeRequest("GET", service.url);

    if (response.error) {
      recordTest(`External Service ${service.name}`, "warnings", {
        message: `Service unreachable: ${response.data.error}`,
        url: service.url,
      });
    } else {
      recordTest(`External Service ${service.name}`, "passed", {
        message: "Service reachable",
        url: service.url,
        status: response.status,
      });
    }
  }
};

const generateReport = () => {
  log("\n📊 Generating Test Report...", "info");

  const reportPath = path.join(
    __dirname,
    "..",
    "production-integration-report.json"
  );
  const htmlReportPath = path.join(
    __dirname,
    "..",
    "production-integration-report.html"
  );

  // Calculate success rate
  const successRate =
    testResults.summary.total > 0
      ? (
          (testResults.summary.passed / testResults.summary.total) *
          100
        ).toFixed(1)
      : 0;

  testResults.summary.successRate = `${successRate}%`;

  // Save JSON report
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Production Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #ddd; }
        .stat.passed { border-color: #28a745; }
        .stat.failed { border-color: #dc3545; }
        .stat.warnings { border-color: #ffc107; }
        .stat h3 { margin: 0 0 10px 0; color: #333; }
        .stat .value { font-size: 2em; font-weight: bold; }
        .tests { margin-top: 30px; }
        .test { margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #ddd; }
        .test.passed { background: #d4edda; border-color: #28a745; }
        .test.failed { background: #f8d7da; border-color: #dc3545; }
        .test.warnings { background: #fff3cd; border-color: #ffc107; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-details { font-size: 0.9em; color: #666; }
        .timestamp { color: #888; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Production Integration Test Report</h1>
            <p>Environment: Production | Generated: ${testResults.timestamp}</p>
            <p>Success Rate: ${testResults.summary.successRate}</p>
        </div>
        
        <div class="summary">
            <div class="stat">
                <h3>Total Tests</h3>
                <div class="value">${testResults.summary.total}</div>
            </div>
            <div class="stat passed">
                <h3>Passed</h3>
                <div class="value">${testResults.summary.passed}</div>
            </div>
            <div class="stat failed">
                <h3>Failed</h3>
                <div class="value">${testResults.summary.failed}</div>
            </div>
            <div class="stat warnings">
                <h3>Warnings</h3>
                <div class="value">${testResults.summary.warnings}</div>
            </div>
        </div>
        
        <div class="tests">
            <h2>Test Results</h2>
            ${testResults.tests
              .map(
                (test) => `
                <div class="test ${test.status}">
                    <div class="test-name">${test.name}</div>
                    <div class="test-details">
                        Status: ${test.status.toUpperCase()}
                        ${test.message ? `<br>Message: ${test.message}` : ""}
                        ${
                          test.responseTime
                            ? `<br>Response Time: ${test.responseTime}ms`
                            : ""
                        }
                        ${test.url ? `<br>URL: ${test.url}` : ""}
                    </div>
                    <div class="timestamp">${test.timestamp}</div>
                </div>
            `
              )
              .join("")}
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(htmlReportPath, htmlReport);

  log(`📄 JSON report: ${reportPath}`, "info");
  log(`📄 HTML report: ${htmlReportPath}`, "info");
};

// Main test runner
const runProductionTests = async () => {
  log("🚀 Starting Production Integration Tests", "info");
  log(`Testing production environment: ${PRODUCTION_CONFIG.apiUrl}`, "info");

  await testSystemHealth();
  await testApplicationAccess();
  await testAPIEndpoints();
  await testSSLSecurity();
  await testHTTPSRedirect();
  await testPerformance();
  await testCORS();
  await testExternalServices();

  generateReport();

  // Summary
  log("\n📋 Test Summary:", "info");
  log(`✅ Passed: ${testResults.summary.passed}`, "success");
  log(
    `❌ Failed: ${testResults.summary.failed}`,
    testResults.summary.failed > 0 ? "error" : "info"
  );
  log(
    `⚠️  Warnings: ${testResults.summary.warnings}`,
    testResults.summary.warnings > 0 ? "warning" : "info"
  );
  log(`📊 Success Rate: ${testResults.summary.successRate}`, "info");

  if (testResults.summary.failed > 0) {
    log(
      "\n❌ Production integration tests failed. Critical issues found.",
      "error"
    );
    process.exit(1);
  } else if (testResults.summary.warnings > 0) {
    log(
      "\n⚠️  Production integration tests completed with warnings.",
      "warning"
    );
    process.exit(0);
  } else {
    log("\n✅ All production integration tests passed!", "success");
    process.exit(0);
  }
};

// Handle errors
process.on("unhandledRejection", (error) => {
  log(`Unhandled rejection: ${error.message}`, "error");
  process.exit(1);
});

// Run tests
runProductionTests().catch((error) => {
  log(`Production tests failed: ${error.message}`, "error");
  process.exit(1);
});
