import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAnalyticsData } from "../../store/analyticsSlice";

const AnalyticsVerification = () => {
  const dispatch = useDispatch();
  const { paymentAnalytics, bookingAnalytics, loading, error } = useSelector(
    (state) => state.analytics || {}
  );

  useEffect(() => {
    // Test with the same date range from your API calls
    const dateRange = {
      startDate: "2025-07-31",
      endDate: "2025-08-08",
    };
    dispatch(fetchAnalyticsData(dateRange));
  }, [dispatch]);

  const paymentDataValid = !!(
    paymentAnalytics?.overview?.totalRevenue &&
    paymentAnalytics?.trends?.length >= 0 &&
    paymentAnalytics?.revenueByPlan?.length >= 0
  );

  const bookingDataValid = !!(
    bookingAnalytics?.overview?.totalAppointments !== undefined &&
    bookingAnalytics?.statusDistribution?.length >= 0 &&
    bookingAnalytics?.dailyTrends?.length >= 0
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Analytics Data Verification</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Analytics Status */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            💰 Payment Analytics
            <span
              className={`ml-2 px-2 py-1 rounded text-xs ${
                paymentDataValid
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {paymentDataValid ? "Valid" : "Invalid"}
            </span>
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Loading:</span>
              <span
                className={
                  loading.payments ? "text-yellow-600" : "text-green-600"
                }
              >
                {loading.payments ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Has Overview:</span>
              <span
                className={
                  paymentAnalytics?.overview ? "text-green-600" : "text-red-600"
                }
              >
                {paymentAnalytics?.overview ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Revenue:</span>
              <span className="font-medium">
                ₹
                {paymentAnalytics?.overview?.totalRevenue?.toLocaleString() ||
                  0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Transactions:</span>
              <span className="font-medium">
                {paymentAnalytics?.overview?.totalTransactions || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Trends Data:</span>
              <span
                className={
                  paymentAnalytics?.trends?.length > 0
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {paymentAnalytics?.trends?.length || 0} items
              </span>
            </div>
            <div className="flex justify-between">
              <span>Plans Data:</span>
              <span
                className={
                  paymentAnalytics?.revenueByPlan?.length > 0
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {paymentAnalytics?.revenueByPlan?.length || 0} items
              </span>
            </div>
          </div>
        </div>

        {/* Booking Analytics Status */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            📅 Booking Analytics
            <span
              className={`ml-2 px-2 py-1 rounded text-xs ${
                bookingDataValid
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {bookingDataValid ? "Valid" : "Invalid"}
            </span>
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Loading:</span>
              <span
                className={
                  loading.bookings ? "text-yellow-600" : "text-green-600"
                }
              >
                {loading.bookings ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Has Overview:</span>
              <span
                className={
                  bookingAnalytics?.overview ? "text-green-600" : "text-red-600"
                }
              >
                {bookingAnalytics?.overview ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Consultation:</span>
              <span className="font-medium">
                {bookingAnalytics?.overview?.totalAppointments || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Completion Rate:</span>
              <span className="font-medium">
                {bookingAnalytics?.overview?.completionRate || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status Distribution:</span>
              <span
                className={
                  bookingAnalytics?.statusDistribution?.length > 0
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {bookingAnalytics?.statusDistribution?.length || 0} items
              </span>
            </div>
            <div className="flex justify-between">
              <span>Daily Trends:</span>
              <span
                className={
                  bookingAnalytics?.dailyTrends?.length > 0
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {bookingAnalytics?.dailyTrends?.length || 0} items
              </span>
            </div>
            <div className="flex justify-between">
              <span>Time Slots:</span>
              <span
                className={
                  bookingAnalytics?.timeSlotPopularity?.length > 0
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {bookingAnalytics?.timeSlotPopularity?.length || 0} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="mt-6 p-4 rounded-lg border-2 border-dashed">
        <div className="text-center">
          <div
            className={`text-2xl mb-2 ${
              paymentDataValid && bookingDataValid
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {paymentDataValid && bookingDataValid ? "✅" : "❌"}
          </div>
          <h3 className="text-lg font-semibold">
            {paymentDataValid && bookingDataValid
              ? "All Analytics Data Valid!"
              : "Some Analytics Data Missing"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {paymentDataValid && bookingDataValid
              ? "Both payment and booking analytics are properly mapped and displaying data."
              : "Check the console logs for more details about missing data."}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-semibold">Error:</h4>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsVerification;
