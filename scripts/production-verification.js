#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Verifies all production services are working correctly
 */

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production URLs
const PRODUCTION_URLS = {
  api: "https://api.teerthankerdentalcare.com",
  client: "https://client.teerthankerdentalcare.com",
  admin: "https://admin.teerthankerdentalcare.com",
};

// Test configuration
const config = {
  timeout: 30000,
  retries: 3,
  expectedResponseTime: 3000, // 3 seconds max
};

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
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
  console.log(`${colors[type]}${message}${colors.reset}`);
};

const recordTest = (name, status, details = {}) => {
  const test = {
    name,
    status,
    timestamp: new Date().toISOString(),
    ...details,
  };

  results.tests.push(test);
  results.summary.total++;
  results.summary[status]++;

  const statusEmoji = {
    passed: "✅",
    failed: "❌",
    warnings: "⚠️",
  };

  log(
    `${statusEmoji[status]} ${name}${
      details.message ? ": " + details.message : ""
    }`,
    status === "failed"
      ? "error"
      : status === "warnings"
      ? "warning"
      : "success"
  );
};

const makeRequest = async (url, options = {}) => {
  const startTime = Date.now();
  try {
    const response = await axios({
      url,
      timeout: config.timeout,
      validateStatus: () => true,
      ...options,
    });

    const responseTime = Date.now() - startTime;
    return { ...response, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 0,
      data: { error: error.message },
      responseTime,
      error: true,
    };
  }
};

// Test suites
const testSSLCertificates = async () => {
  log("\n🔒 Testing SSL Certificates...", "info");

  for (const [service, url] of Object.entries(PRODUCTION_URLS)) {
    const response = await makeRequest(url);

    if (response.error) {
      recordTest(`SSL Certificate - ${service}`, "failed", {
        message: `Connection failed: ${response.data.error}`,
        url,
      });
    } else if (response.status === 200) {
      recordTest(`SSL Certificate - ${service}`, "passed", {
        message: `HTTPS working correctly`,
        url,
        responseTime: response.responseTime,
      });
    } else {
      recordTest(`SSL Certificate - ${service}`, "warnings", {
        message: `Unexpected status: ${response.status}`,
        url,
        responseTime: response.responseTime,
      });
    }
  }
};

const testAPIEndpoints = async () => {
  log("\n🔌 Testing API Endpoints...", "info");

  const endpoints = [
    { path: "/api/health", name: "Health Check" },
    { path: "/api/plans", name: "Plans Endpoint" },
    { path: "/api/monitoring/health", name: "Monitoring Health" },
    { path: "/api/monitoring/metrics/prometheus", name: "Prometheus Metrics" },
  ];

  for (const endpoint of endpoints) {
    const url = `${PRODUCTION_URLS.api}${endpoint.path}`;
    const response = await makeRequest(url);

    if (response.error) {
      recordTest(`API ${endpoint.name}`, "failed", {
        message: `Connection failed: ${response.data.error}`,
        url,
      });
    } else if (response.status === 200) {
      recordTest(`API ${endpoint.name}`, "passed", {
        message: `Responding correctly (${response.responseTime}ms)`,
        url,
        responseTime: response.responseTime,
      });
    } else if (response.status === 401 || response.status === 403) {
      recordTest(`API ${endpoint.name}`, "passed", {
        message: `Protected endpoint responding correctly`,
        url,
        responseTime: response.responseTime,
      });
    } else {
      recordTest(`API ${endpoint.name}`, "warnings", {
        message: `Unexpected status: ${response.status}`,
        url,
        responseTime: response.responseTime,
      });
    }
  }
};

const testSecurityHeaders = async () => {
  log("\n🛡️ Testing Security Headers...", "info");

  const requiredHeaders = [
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
    "strict-transport-security",
  ];

  for (const [service, url] of Object.entries(PRODUCTION_URLS)) {
    const response = await makeRequest(url);

    if (response.error) {
      recordTest(`Security Headers - ${service}`, "failed", {
        message: `Could not check headers: ${response.data.error}`,
        url,
      });
      continue;
    }

    const missingHeaders = requiredHeaders.filter(
      (header) =>
        !response.headers[header] && !response.headers[header.toLowerCase()]
    );

    if (missingHeaders.length === 0) {
      recordTest(`Security Headers - ${service}`, "passed", {
        message: "All required security headers present",
        url,
      });
    } else {
      recordTest(`Security Headers - ${service}`, "warnings", {
        message: `Missing headers: ${missingHeaders.join(", ")}`,
        url,
        missingHeaders,
      });
    }
  }
};

const testPerformance = async () => {
  log("\n⚡ Testing Performance...", "info");

  for (const [service, url] of Object.entries(PRODUCTION_URLS)) {
    const response = await makeRequest(url);

    if (response.error) {
      recordTest(`Performance - ${service}`, "failed", {
        message: `Connection failed: ${response.data.error}`,
        url,
      });
    } else if (response.responseTime <= config.expectedResponseTime) {
      recordTest(`Performance - ${service}`, "passed", {
        message: `Fast response time: ${response.responseTime}ms`,
        url,
        responseTime: response.responseTime,
      });
    } else {
      recordTest(`Performance - ${service}`, "warnings", {
        message: `Slow response time: ${response.responseTime}ms`,
        url,
        responseTime: response.responseTime,
      });
    }
  }
};

const testCORS = async () => {
  log("\n🌐 Testing CORS Configuration...", "info");

  // Test CORS from client to API
  const corsTests = [
    {
      origin: PRODUCTION_URLS.client,
      target: `${PRODUCTION_URLS.api}/api/health`,
      name: "Client to API",
    },
    {
      origin: PRODUCTION_URLS.admin,
      target: `${PRODUCTION_URLS.api}/api/health`,
      name: "Admin to API",
    },
  ];

  for (const test of corsTests) {
    const response = await makeRequest(test.target, {
      method: "OPTIONS",
      headers: {
        Origin: test.origin,
        "Access-Control-Request-Method": "GET",
      },
    });

    if (response.error) {
      recordTest(`CORS - ${test.name}`, "failed", {
        message: `CORS preflight failed: ${response.data.error}`,
        origin: test.origin,
        target: test.target,
      });
    } else if (response.headers["access-control-allow-origin"]) {
      recordTest(`CORS - ${test.name}`, "passed", {
        message: "CORS configured correctly",
        origin: test.origin,
        target: test.target,
      });
    } else {
      recordTest(`CORS - ${test.name}`, "warnings", {
        message: "CORS headers not found",
        origin: test.origin,
        target: test.target,
      });
    }
  }
};

const testRedirects = async () => {
  log("\n🔄 Testing HTTP to HTTPS Redirects...", "info");

  for (const [service, httpsUrl] of Object.entries(PRODUCTION_URLS)) {
    const httpUrl = httpsUrl.replace("https://", "http://");

    const response = await makeRequest(httpUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
    });

    if (response.status === 301 || response.status === 302) {
      const location = response.headers.location;
      if (location && location.startsWith("https://")) {
        recordTest(`HTTPS Redirect - ${service}`, "passed", {
          message: `HTTP correctly redirects to HTTPS`,
          httpUrl,
          httpsUrl: location,
        });
      } else {
        recordTest(`HTTPS Redirect - ${service}`, "warnings", {
          message: `Redirect location not HTTPS: ${location}`,
          httpUrl,
        });
      }
    } else {
      recordTest(`HTTPS Redirect - ${service}`, "warnings", {
        message: `No redirect found (status: ${response.status})`,
        httpUrl,
      });
    }
  }
};

const testHealthEndpoints = async () => {
  log("\n🏥 Testing Health Endpoints...", "info");

  const healthUrl = `${PRODUCTION_URLS.api}/api/health`;
  const response = await makeRequest(healthUrl);

  if (response.error) {
    recordTest("Health Endpoint", "failed", {
      message: `Health check failed: ${response.data.error}`,
      url: healthUrl,
    });
    return;
  }

  if (response.status !== 200) {
    recordTest("Health Endpoint", "failed", {
      message: `Health check returned status ${response.status}`,
      url: healthUrl,
    });
    return;
  }

  const healthData = response.data;

  // Check health status
  if (healthData.status === "healthy") {
    recordTest("Health Status", "passed", {
      message: "System reports healthy status",
      uptime: healthData.uptime,
    });
  } else {
    recordTest("Health Status", "failed", {
      message: `System reports unhealthy status: ${healthData.status}`,
      healthData,
    });
  }

  // Check database health
  if (healthData.database?.status === "healthy") {
    recordTest("Database Health", "passed", {
      message: "Database connection healthy",
    });
  } else {
    recordTest("Database Health", "failed", {
      message: `Database unhealthy: ${healthData.database?.status}`,
      database: healthData.database,
    });
  }
};

const generateReport = () => {
  log("\n📊 Generating Verification Report...", "info");

  const reportPath = path.join(
    __dirname,
    "..",
    "production-verification-report.json"
  );
  const htmlReportPath = path.join(
    __dirname,
    "..",
    "production-verification-report.html"
  );

  // Save JSON report
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Production Verification Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warnings { color: #ffc107; }
        .test { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test.passed { border-color: #28a745; }
        .test.failed { border-color: #dc3545; }
        .test.warnings { border-color: #ffc107; }
        .details { font-size: 0.9em; color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Production Verification Report</h1>
        <p>Generated: ${results.timestamp}</p>
        <p>Environment: Production</p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <h3>Total Tests</h3>
            <div>${results.summary.total}</div>
        </div>
        <div class="stat passed">
            <h3>Passed</h3>
            <div>${results.summary.passed}</div>
        </div>
        <div class="stat failed">
            <h3>Failed</h3>
            <div>${results.summary.failed}</div>
        </div>
        <div class="stat warnings">
            <h3>Warnings</h3>
            <div>${results.summary.warnings}</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${results.tests
      .map(
        (test) => `
        <div class="test ${test.status}">
            <strong>${test.name}</strong>
            <div class="details">
                Status: ${test.status.toUpperCase()}
                ${test.message ? `<br>Message: ${test.message}` : ""}
                ${
                  test.responseTime
                    ? `<br>Response Time: ${test.responseTime}ms`
                    : ""
                }
                ${test.url ? `<br>URL: ${test.url}` : ""}
            </div>
        </div>
    `
      )
      .join("")}
</body>
</html>`;

  fs.writeFileSync(htmlReportPath, htmlReport);

  log(`📄 JSON report saved: ${reportPath}`, "info");
  log(`📄 HTML report saved: ${htmlReportPath}`, "info");
};

// Main verification function
const runVerification = async () => {
  log("🚀 Starting Production Deployment Verification", "info");
  log(`Testing production URLs:`, "info");
  Object.entries(PRODUCTION_URLS).forEach(([service, url]) => {
    log(`  ${service}: ${url}`, "info");
  });

  await testSSLCertificates();
  await testRedirects();
  await testHealthEndpoints();
  await testAPIEndpoints();
  await testSecurityHeaders();
  await testCORS();
  await testPerformance();

  generateReport();

  // Summary
  log("\n📋 Verification Summary:", "info");
  log(`✅ Passed: ${results.summary.passed}`, "success");
  log(
    `❌ Failed: ${results.summary.failed}`,
    results.summary.failed > 0 ? "error" : "info"
  );
  log(
    `⚠️  Warnings: ${results.summary.warnings}`,
    results.summary.warnings > 0 ? "warning" : "info"
  );

  if (results.summary.failed > 0) {
    log("\n❌ Production verification failed. Critical issues found.", "error");
    process.exit(1);
  } else if (results.summary.warnings > 0) {
    log("\n⚠️  Production verification completed with warnings.", "warning");
    process.exit(0);
  } else {
    log(
      "\n✅ Production verification successful! All systems operational.",
      "success"
    );
    process.exit(0);
  }
};

// Handle errors
process.on("unhandledRejection", (error) => {
  log(`Unhandled rejection: ${error.message}`, "error");
  process.exit(1);
});

// Run verification
runVerification().catch((error) => {
  log(`Verification failed: ${error.message}`, "error");
  process.exit(1);
});
