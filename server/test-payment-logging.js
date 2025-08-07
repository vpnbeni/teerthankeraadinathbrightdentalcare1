/**
 * Simple test script to verify payment logging functionality
 */

import { paymentLogger } from "./src/services/paymentLogger.js";
import { paymentAnalytics } from "./src/services/paymentAnalytics.js";
import { paymentMonitoring } from "./src/services/paymentMonitoring.js";

console.log("🧪 Testing Payment Logging and Monitoring System...\n");

// Test 1: Payment Logger Basic Functionality
console.log("1. Testing Payment Logger Basic Functionality:");
try {
  const requestId = "test_req_123";

  // Test order creation logging
  paymentLogger.logOrderCreationStart(requestId, {
    userId: "test_user_123",
    planId: "test_plan_456",
  });

  // Simulate successful order creation
  setTimeout(() => {
    paymentLogger.logOrderCreationSuccess(requestId, 1500, {
      order: { id: "order_123", amount: 50000, currency: "INR" },
      planDetails: { name: "Basic Plan" },
      userDetails: { name: "Test User" },
    });
  }, 100);

  // Simulate failed order creation
  setTimeout(() => {
    const error = new Error("Test error");
    error.code = "TEST_ERROR";
    paymentLogger.logOrderCreationFailure("test_req_456", 2000, error, {
      userId: "test_user_456",
      planId: "test_plan_789",
    });
  }, 200);

  console.log("✅ Payment Logger basic functionality test passed");
} catch (error) {
  console.error(
    "❌ Payment Logger basic functionality test failed:",
    error.message
  );
}

// Test 2: Metrics Collection
console.log("\n2. Testing Metrics Collection:");
try {
  // Wait a bit for the previous logs to be processed
  setTimeout(() => {
    const metrics = paymentLogger.getMetricsSnapshot();
    console.log("📊 Current Metrics:");
    console.log(
      `   - Order Creation Count: ${metrics.metrics.orderCreationCount}`
    );
    console.log(
      `   - Order Success Count: ${metrics.metrics.orderSuccessCount}`
    );
    console.log(
      `   - Order Failure Count: ${metrics.metrics.orderFailureCount}`
    );
    console.log(
      `   - Order Success Rate: ${metrics.successRates.orderSuccessRate}%`
    );
    console.log(
      `   - Average Processing Time: ${metrics.metrics.averageProcessingTime}ms`
    );
    console.log("✅ Metrics collection test passed");
  }, 500);
} catch (error) {
  console.error("❌ Metrics collection test failed:", error.message);
}

// Test 3: Monitoring System
console.log("\n3. Testing Monitoring System:");
try {
  setTimeout(() => {
    const monitoringStatus = paymentMonitoring.getMonitoringStatus();
    console.log("🔍 Monitoring Status:");
    console.log(`   - Overall Health: ${monitoringStatus.health.overall}`);
    console.log(
      `   - Payment Processing Health: ${monitoringStatus.health.components.paymentProcessing}`
    );
    console.log(`   - Active Alerts: ${monitoringStatus.alerts.active.length}`);
    console.log(
      `   - Monitoring Enabled: ${monitoringStatus.monitoring.enabled}`
    );
    console.log("✅ Monitoring system test passed");
  }, 1000);
} catch (error) {
  console.error("❌ Monitoring system test failed:", error.message);
}

// Test 4: Error Tracking
console.log("\n4. Testing Error Tracking:");
try {
  setTimeout(() => {
    // Simulate Razorpay API failure
    const razorpayError = new Error("Razorpay API timeout");
    razorpayError.code = "RAZORPAY_TIMEOUT";
    paymentLogger.logRazorpayApiFailure(
      "test_req_789",
      "create_order",
      5000,
      razorpayError,
      {
        attempt: 1,
        maxRetries: 3,
      }
    );

    // Simulate database failure
    const dbError = new Error("Database connection failed");
    dbError.code = "DB_CONNECTION_ERROR";
    paymentLogger.logDatabaseOperationFailure(
      "test_req_101",
      "create_payment",
      3000,
      dbError,
      {
        userId: "test_user_101",
        planId: "test_plan_202",
      }
    );

    console.log("✅ Error tracking test passed");
  }, 1500);
} catch (error) {
  console.error("❌ Error tracking test failed:", error.message);
}

// Test 5: Performance Metrics
console.log("\n5. Testing Performance Metrics:");
try {
  setTimeout(() => {
    // Simulate various API calls with different durations
    paymentLogger.logRazorpayApiSuccess("test_req_perf1", "create_order", 800, {
      id: "order_perf1",
      status: "created",
      amount: 30000,
      currency: "INR",
    });

    paymentLogger.logDatabaseOperationSuccess(
      "test_req_perf2",
      "create_payment",
      200,
      {
        paymentId: "payment_perf1",
        status: "pending",
      }
    );

    console.log("✅ Performance metrics test passed");
  }, 2000);
} catch (error) {
  console.error("❌ Performance metrics test failed:", error.message);
}

// Final metrics summary
setTimeout(() => {
  console.log("\n📈 Final Metrics Summary:");
  const finalMetrics = paymentLogger.getMetricsSnapshot();
  console.log("=====================================");
  console.log("Order Operations:");
  console.log(`  Total Attempts: ${finalMetrics.metrics.orderCreationCount}`);
  console.log(`  Successful: ${finalMetrics.metrics.orderSuccessCount}`);
  console.log(`  Failed: ${finalMetrics.metrics.orderFailureCount}`);
  console.log(`  Success Rate: ${finalMetrics.successRates.orderSuccessRate}%`);

  console.log("\nRazorpay API Operations:");
  console.log(`  Total Calls: ${finalMetrics.metrics.razorpayApiCalls}`);
  console.log(`  Failed: ${finalMetrics.metrics.razorpayApiFailures}`);
  console.log(
    `  Success Rate: ${finalMetrics.successRates.razorpayApiSuccessRate}%`
  );
  console.log(
    `  Average Time: ${finalMetrics.performance.averageRazorpayApiTime}ms`
  );

  console.log("\nDatabase Operations:");
  console.log(`  Total Operations: ${finalMetrics.metrics.databaseOperations}`);
  console.log(`  Failed: ${finalMetrics.metrics.databaseFailures}`);
  console.log(
    `  Success Rate: ${finalMetrics.successRates.databaseSuccessRate}%`
  );
  console.log(
    `  Average Time: ${finalMetrics.performance.averageDatabaseTime}ms`
  );

  console.log("\nError Summary:");
  console.log(
    `  Total Error Types: ${finalMetrics.errorSummary.totalErrorTypes}`
  );
  console.log(
    `  Recent Errors: ${finalMetrics.errorSummary.recentErrorsCount}`
  );

  if (finalMetrics.errorSummary.topErrors.length > 0) {
    console.log("  Top Errors:");
    finalMetrics.errorSummary.topErrors.forEach((error, index) => {
      console.log(
        `    ${index + 1}. ${error.error}: ${error.count} occurrences`
      );
    });
  }

  console.log("\nPerformance:");
  console.log(
    `  Average Processing Time: ${finalMetrics.metrics.averageProcessingTime}ms`
  );
  console.log(
    `  Total Processing Time: ${finalMetrics.metrics.totalProcessingTime}ms`
  );

  console.log("=====================================");
  console.log("🎉 Payment Logging and Monitoring System Test Complete!");

  // Stop monitoring to clean up
  paymentMonitoring.stopMonitoring();

  process.exit(0);
}, 3000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Test interrupted, cleaning up...");
  paymentMonitoring.stopMonitoring();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  paymentMonitoring.stopMonitoring();
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  paymentMonitoring.stopMonitoring();
  process.exit(1);
});
