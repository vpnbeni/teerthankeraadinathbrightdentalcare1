// Test script to verify analytics data mapping
// Run this in browser console on the admin analytics page

const testAnalyticsMapping = () => {
  console.log("🧪 Testing Analytics Data Mapping...");

  // Get Redux store from window (if available)
  const store = window.__REDUX_DEVTOOLS_EXTENSION__
    ? window.__REDUX_DEVTOOLS_EXTENSION__.store
    : null;

  if (!store) {
    console.log(
      "❌ Redux DevTools not available. Please install Redux DevTools extension."
    );
    return;
  }

  const state = store.getState();
  const analytics = state.analytics;

  console.log("📊 Current Analytics State:", analytics);

  // Test payment analytics structure
  const paymentAnalytics = analytics?.paymentAnalytics;
  console.log("💰 Payment Analytics:", paymentAnalytics);

  // Test booking analytics structure
  const bookingAnalytics = analytics?.bookingAnalytics;
  console.log("📅 Booking Analytics:", bookingAnalytics);

  // Check if payment data is properly mapped
  const paymentChecks = {
    hasOverview: !!paymentAnalytics?.overview,
    hasTrends: Array.isArray(paymentAnalytics?.trends),
    hasRevenueByPlan: Array.isArray(paymentAnalytics?.revenueByPlan),
    hasPaymentMethods: Array.isArray(
      paymentAnalytics?.paymentMethodDistribution
    ),
    hasFailedPayments: !!paymentAnalytics?.failedPayments,
  };

  // Check if booking data is properly mapped
  const bookingChecks = {
    hasOverview: !!bookingAnalytics?.overview,
    hasStatusDistribution: Array.isArray(bookingAnalytics?.statusDistribution),
    hasDailyTrends: Array.isArray(bookingAnalytics?.dailyTrends),
    hasTimeSlotPopularity: Array.isArray(bookingAnalytics?.timeSlotPopularity),
    hasRescheduleAnalysis: !!bookingAnalytics?.rescheduleAnalysis,
  };

  console.log("✅ Payment Data Structure Checks:", paymentChecks);
  console.log("✅ Booking Data Structure Checks:", bookingChecks);

  // Check specific payment data values
  if (paymentAnalytics?.overview) {
    console.log("💵 Total Revenue:", paymentAnalytics.overview.totalRevenue);
    console.log(
      "📈 Total Transactions:",
      paymentAnalytics.overview.totalTransactions
    );
    console.log(
      "📊 Average Transaction:",
      paymentAnalytics.overview.averageTransaction
    );
  }

  // Check specific booking data values
  if (bookingAnalytics?.overview) {
    console.log(
      "📅 Total Appointments:",
      bookingAnalytics.overview.totalAppointments
    );
    console.log(
      "✅ Completion Rate:",
      bookingAnalytics.overview.completionRate
    );
    console.log(
      "❌ Cancellation Rate:",
      bookingAnalytics.overview.cancellationRate
    );
  }

  if (paymentAnalytics?.revenueByPlan?.length > 0) {
    console.log("📋 Revenue by Plan:", paymentAnalytics.revenueByPlan);
  }

  if (bookingAnalytics?.statusDistribution?.length > 0) {
    console.log("📊 Status Distribution:", bookingAnalytics.statusDistribution);
  }

  if (bookingAnalytics?.timeSlotPopularity?.length > 0) {
    console.log(
      "⏰ Time Slot Popularity:",
      bookingAnalytics.timeSlotPopularity
    );
  }

  // Overall status
  const allPaymentChecksPass = Object.values(paymentChecks).every(
    (check) => check
  );
  const allBookingChecksPass = Object.values(bookingChecks).every(
    (check) => check
  );
  const allChecksPass = allPaymentChecksPass && allBookingChecksPass;

  console.log(
    allPaymentChecksPass
      ? "✅ Payment checks passed!"
      : "❌ Payment checks failed"
  );
  console.log(
    allBookingChecksPass
      ? "✅ Booking checks passed!"
      : "❌ Booking checks failed"
  );
  console.log(
    allChecksPass ? "🎉 All checks passed!" : "⚠️ Some checks failed"
  );

  return {
    state: analytics,
    paymentChecks,
    bookingChecks,
    allChecksPass,
  };
};

// Auto-run if in browser
if (typeof window !== "undefined") {
  console.log("Run testAnalyticsMapping() to test the data mapping");
}
