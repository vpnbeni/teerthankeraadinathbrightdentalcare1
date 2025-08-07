/**
 * Payment Test Runner
 * Comprehensive test suite runner for payment functionality
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test categories
const testCategories = {
  unit: {
    name: "Unit Tests",
    pattern: "src/test/services/paymentService.test.js",
    description: "Testing payment service error handling and functionality",
  },
  integration: {
    name: "Integration Tests",
    pattern: "src/test/integration/paymentFlow.test.js",
    description: "Testing complete payment flow scenarios",
  },
  e2e: {
    name: "End-to-End Tests",
    pattern: "src/test/e2e/razorpayIntegration.test.js",
    description: "Testing Razorpay integration and webhooks",
  },
  errorRecovery: {
    name: "Error Recovery Tests",
    pattern: "src/test/services/errorRecovery.test.js",
    description: "Testing error recovery and fallback mechanisms",
  },
  debugging: {
    name: "Payment Debugging Tests",
    pattern: "src/test/integration/paymentDebugIntegration.test.js",
    description: "Testing payment debugging and troubleshooting tools",
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  const border = "=".repeat(60);
  console.log(colorize(border, "cyan"));
  console.log(colorize(`  ${title}`, "bright"));
  console.log(colorize(border, "cyan"));
}

function printSection(title) {
  console.log(colorize(`\n📋 ${title}`, "blue"));
  console.log(colorize("-".repeat(40), "blue"));
}

function runTestCategory(category, options = {}) {
  const { name, pattern, description } = testCategories[category];

  if (!testCategories[category]) {
    console.error(colorize(`❌ Unknown test category: ${category}`, "red"));
    return false;
  }

  printSection(`${name} - ${description}`);

  try {
    const jestOptions = [
      "--testPathPattern=" + pattern,
      "--verbose",
      "--detectOpenHandles",
      "--forceExit",
    ];

    if (options.coverage) {
      jestOptions.push("--coverage");
      jestOptions.push("--coverageDirectory=coverage/payment-tests");
    }

    if (options.watch) {
      jestOptions.push("--watch");
    }

    if (options.bail) {
      jestOptions.push("--bail");
    }

    const command = `npx jest ${jestOptions.join(" ")}`;
    console.log(colorize(`🚀 Running: ${command}`, "yellow"));

    execSync(command, {
      stdio: "inherit",
      cwd: path.resolve(__dirname, "../../.."),
    });

    console.log(colorize(`✅ ${name} completed successfully`, "green"));
    return true;
  } catch (error) {
    console.error(colorize(`❌ ${name} failed:`, "red"));
    console.error(error.message);
    return false;
  }
}

function runAllTests(options = {}) {
  printHeader("Payment Flow Comprehensive Test Suite");

  const results = {};
  let totalPassed = 0;
  let totalFailed = 0;

  // Run tests in order of complexity
  const testOrder = [
    "unit",
    "integration",
    "e2e",
    "errorRecovery",
    "debugging",
  ];

  for (const category of testOrder) {
    const success = runTestCategory(category, options);
    results[category] = success;

    if (success) {
      totalPassed++;
    } else {
      totalFailed++;

      if (options.bail) {
        console.log(
          colorize("\n🛑 Stopping due to test failure (--bail option)", "red")
        );
        break;
      }
    }
  }

  // Print summary
  printSection("Test Summary");
  console.log(colorize(`Total Categories: ${testOrder.length}`, "blue"));
  console.log(colorize(`Passed: ${totalPassed}`, "green"));
  console.log(colorize(`Failed: ${totalFailed}`, "red"));

  if (totalFailed === 0) {
    console.log(colorize("\n🎉 All payment tests passed!", "green"));
  } else {
    console.log(colorize(`\n⚠️  ${totalFailed} test categories failed`, "red"));
  }

  return totalFailed === 0;
}

function printUsage() {
  console.log(colorize("Payment Test Runner Usage:", "bright"));
  console.log("");
  console.log("Run all tests:");
  console.log(colorize("  node src/test/runPaymentTests.js", "cyan"));
  console.log("");
  console.log("Run specific test category:");
  console.log(
    colorize("  node src/test/runPaymentTests.js --category=unit", "cyan")
  );
  console.log("");
  console.log("Available categories:");
  Object.entries(testCategories).forEach(([key, { name, description }]) => {
    console.log(
      colorize(`  ${key.padEnd(12)} - ${name}: ${description}`, "yellow")
    );
  });
  console.log("");
  console.log("Options:");
  console.log(colorize("  --coverage     Generate coverage report", "yellow"));
  console.log(colorize("  --watch        Run tests in watch mode", "yellow"));
  console.log(colorize("  --bail         Stop on first failure", "yellow"));
  console.log(colorize("  --help         Show this help message", "yellow"));
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    category: null,
    coverage: false,
    watch: false,
    bail: false,
    help: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--category=")) {
      options.category = arg.split("=")[1];
    } else if (arg === "--coverage") {
      options.coverage = true;
    } else if (arg === "--watch") {
      options.watch = true;
    } else if (arg === "--bail") {
      options.bail = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

// Main execution
function main() {
  const options = parseArgs();

  if (options.help) {
    printUsage();
    return;
  }

  if (options.category) {
    if (!testCategories[options.category]) {
      console.error(
        colorize(`❌ Unknown category: ${options.category}`, "red")
      );
      printUsage();
      process.exit(1);
    }

    const success = runTestCategory(options.category, options);
    process.exit(success ? 0 : 1);
  } else {
    const success = runAllTests(options);
    process.exit(success ? 0 : 1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error(colorize("❌ Uncaught Exception:", "red"));
  console.error(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(colorize("❌ Unhandled Rejection:", "red"));
  console.error(reason);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runTestCategory, runAllTests, testCategories };
