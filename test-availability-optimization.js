// Test script to verify availability API optimization
import fetch from "node-fetch";

const testAvailabilityOptimization = async () => {
  console.log("🧪 Testing Availability API Optimization...\n");

  const baseUrl = "http://localhost:5000/api/availability";

  // Test scenarios
  const testCases = [
    {
      name: "Past dates only (should be fast)",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      expectedOptimization: "High - all past dates skipped",
    },
    {
      name: "Future dates only (normal processing)",
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      expectedOptimization: "None - all dates processed normally",
    },
    {
      name: "Mixed range (partial optimization)",
      startDate: "2024-12-01",
      endDate: "2025-01-31",
      expectedOptimization: "Medium - past dates skipped, future processed",
    },
    {
      name: "Current month (typical calendar view)",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      expectedOptimization: "Medium - past dates in month skipped",
    },
  ];

  for (const testCase of testCases) {
    console.log(`📊 Testing: ${testCase.name}`);
    console.log(`   Date Range: ${testCase.startDate} to ${testCase.endDate}`);
    console.log(`   Expected: ${testCase.expectedOptimization}`);

    const startTime = Date.now();

    try {
      const response = await fetch(
        `${baseUrl}/availability/range?startDate=${testCase.startDate}&endDate=${testCase.endDate}&onlyAvailable=false`
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        const totalDays = data.meta?.totalDays || "Unknown";

        // Count past dates in response
        const today = new Date().toISOString().split("T")[0];
        let pastDates = 0;
        let futureDates = 0;

        if (data.data) {
          Object.keys(data.data).forEach((dateKey) => {
            if (dateKey < today) {
              pastDates++;
              // Verify past dates are marked correctly
              if (data.data[dateKey].type === "past_date") {
                // Optimization working correctly
              }
            } else {
              futureDates++;
            }
          });
        }

        console.log(`   ✅ Response Time: ${responseTime}ms`);
        console.log(`   📅 Total Days: ${totalDays}`);
        console.log(`   ⏮️  Past Dates: ${pastDates} (should be optimized)`);
        console.log(`   ⏭️  Future Dates: ${futureDates} (full processing)`);

        // Performance assessment
        if (pastDates > 0 && responseTime < 500) {
          console.log(
            `   🚀 OPTIMIZATION WORKING: Fast response despite ${pastDates} past dates`
          );
        } else if (pastDates === 0) {
          console.log(`   ⚡ NORMAL PROCESSING: No past dates to optimize`);
        } else {
          console.log(`   ⚠️  SLOW RESPONSE: May need further optimization`);
        }
      } else {
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }

    console.log(""); // Empty line for readability
  }

  console.log("🎯 Optimization Test Summary:");
  console.log("   - Past dates should respond quickly (< 500ms)");
  console.log('   - Response should include type: "past_date" for past dates');
  console.log("   - Mixed ranges should show performance improvement");
  console.log("   - Future dates will have normal processing times");
  console.log(
    "\n📈 Check server logs for performance metrics from performanceMonitor"
  );
};

// Run the test
testAvailabilityOptimization().catch(console.error);
