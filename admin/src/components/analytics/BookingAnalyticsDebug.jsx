import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingAnalytics } from "../../store/analyticsSlice";

const BookingAnalyticsDebug = () => {
  const dispatch = useDispatch();
  const { bookingAnalytics, loading, error } = useSelector(
    (state) => state.analytics || {}
  );

  useEffect(() => {
    // Test with the same date range from your API call
    const params = {
      startDate: "2025-07-31",
      endDate: "2025-08-08",
    };
    dispatch(fetchBookingAnalytics(params));
  }, [dispatch]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Booking Analytics Debug</h2>

      {loading.bookings && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Raw Booking Analytics Data:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(bookingAnalytics, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Overview Data:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(bookingAnalytics?.overview, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Status Distribution:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(bookingAnalytics?.statusDistribution, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Daily Trends:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(bookingAnalytics?.dailyTrends, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Time Slot Popularity:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(bookingAnalytics?.timeSlotPopularity, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Reschedule Analysis:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(bookingAnalytics?.rescheduleAnalysis, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default BookingAnalyticsDebug;
