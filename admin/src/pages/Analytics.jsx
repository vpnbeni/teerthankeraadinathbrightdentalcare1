import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../components/common/AdminLayout";
import AnalyticsDashboard from "../components/analytics/AnalyticsDashboard";
import BookingChart from "../components/analytics/BookingChart";
import RevenueChart from "../components/analytics/RevenueChart";
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
    dashboardStats,
    paymentAnalytics,
    bookingAnalytics,
    loading,
    error,
    dateRange,
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
    { id: "bookings", name: "Bookings", icon: CalendarIcon },
    { id: "payments", name: "Payments", icon: ChartBarIcon },
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
            {loading.dashboard || loading.payments || loading.bookings ? (
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
                    data={dashboardStats}
                    paymentData={paymentAnalytics}
                    bookingData={bookingAnalytics}
                    dateRange={dateRange}
                  />
                )}

                {activeTab === "bookings" && (
                  <BookingChart
                    data={bookingAnalytics}
                    dateRange={dateRange}
                    loading={loading.bookings}
                  />
                )}

                {activeTab === "payments" && (
                  <RevenueChart
                    data={paymentAnalytics}
                    dateRange={dateRange}
                    loading={loading.payments}
                  />
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
