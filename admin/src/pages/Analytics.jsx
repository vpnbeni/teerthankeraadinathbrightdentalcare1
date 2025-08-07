import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../components/common/AdminLayout";
import AnalyticsDashboard from "../components/analytics/AnalyticsDashboard";
import DateRangeFilter from "../components/analytics/DateRangeFilter";
import ReportGenerator from "../components/analytics/ReportGenerator";
import { LoadingSpinner } from "../shared/components";
import {
  fetchAnalyticsData,
  setDateRange,
  clearFilters,
} from "../store/analyticsSlice";
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const Analytics = () => {
  const dispatch = useDispatch();
  const {
    analyticsData,
    loading,
    error,
    dateRange,
    paymentAnalytics,
    sessionAnalytics,
    bookingAnalytics,
  } = useSelector((state) => state.analytics || {});

  const [activeTab, setActiveTab] = useState("overview");
  const [showReportGenerator, setShowReportGenerator] = useState(false);

  useEffect(() => {
    dispatch(fetchAnalyticsData(dateRange));
  }, [dispatch, dateRange]);

  const handleDateRangeChange = (newDateRange) => {
    dispatch(setDateRange(newDateRange));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: ChartBarIcon },
    { id: "payments", name: "Payments", icon: ChartBarIcon },
    { id: "sessions", name: "Sessions", icon: ChartBarIcon },
    { id: "bookings", name: "Bookings", icon: CalendarIcon },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Analytics & Reports
            </h1>
            <p className="text-gray-600">
              Monitor clinic performance and generate insights
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setShowReportGenerator(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white p-4 rounded-lg shadow">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? "border-[#346870] text-[#346870]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="large" ariaLabel="Loading analytics" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">
                  Error loading analytics: {error}
                </p>
                <button
                  onClick={() => dispatch(fetchAnalyticsData(dateRange))}
                  className="text-[#346870] hover:text-[#2a5359] font-medium"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div>
                {activeTab === "overview" && (
                  <AnalyticsDashboard
                    data={analyticsData}
                    paymentData={paymentAnalytics}
                    sessionData={sessionAnalytics}
                    bookingData={bookingAnalytics}
                  />
                )}

                {activeTab === "payments" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Total Revenue
                        </h3>
                        <p className="text-3xl font-bold text-green-600">
                          ₹
                          {paymentAnalytics?.totalRevenue?.toLocaleString() ||
                            0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {paymentAnalytics?.revenueChange > 0 ? "+" : ""}
                          {paymentAnalytics?.revenueChange || 0}% from last
                          period
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Total Payments
                        </h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {paymentAnalytics?.totalPayments || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {paymentAnalytics?.paymentChange > 0 ? "+" : ""}
                          {paymentAnalytics?.paymentChange || 0}% from last
                          period
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Average Payment
                        </h3>
                        <p className="text-3xl font-bold text-purple-600">
                          ₹
                          {paymentAnalytics?.averagePayment?.toLocaleString() ||
                            0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Per transaction
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-600">
                        Detailed payment charts and trends coming soon...
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "sessions" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Total Sessions
                        </h3>
                        <p className="text-3xl font-bold text-green-600">
                          {sessionAnalytics?.totalSessions || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {sessionAnalytics?.sessionChange > 0 ? "+" : ""}
                          {sessionAnalytics?.sessionChange || 0}% from last
                          period
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Completion Rate
                        </h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {sessionAnalytics?.completionRate || 0}%
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Of scheduled sessions
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Average Duration
                        </h3>
                        <p className="text-3xl font-bold text-purple-600">
                          {sessionAnalytics?.averageDuration || 0} min
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Per session
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-600">
                        Session completion charts and analysis coming soon...
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "bookings" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Total Bookings
                        </h3>
                        <p className="text-3xl font-bold text-green-600">
                          {bookingAnalytics?.totalBookings || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {bookingAnalytics?.bookingChange > 0 ? "+" : ""}
                          {bookingAnalytics?.bookingChange || 0}% from last
                          period
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Show Rate
                        </h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {bookingAnalytics?.showRate || 0}%
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Patients who attended
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Peak Hours
                        </h3>
                        <p className="text-3xl font-bold text-purple-600">
                          {bookingAnalytics?.peakHours || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Most popular time
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-600">
                        Booking pattern analysis and calendar heatmap coming
                        soon...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Generator Modal */}
      {showReportGenerator && (
        <ReportGenerator
          onClose={() => setShowReportGenerator(false)}
          dateRange={dateRange}
          analyticsData={analyticsData}
        />
      )}
    </AdminLayout>
  );
};

export default Analytics;
