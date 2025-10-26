import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../components/common/AdminLayout";
import StatCard from "../components/common/StatCard";
import AnalyticsDashboard from "../components/analytics/AnalyticsDashboard";
import BookingChart from "../components/analytics/BookingChart";
import RevenueChart from "../components/analytics/RevenueChart";
import DateRangeFilter from "../components/analytics/DateRangeFilter";
import ReportGenerator from "../components/analytics/ReportGenerator";
import { LoadingSpinner } from "../shared/components";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAnalyticsData,
  setDateRange,
  clearFilters,
} from "../store/analyticsSlice";
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
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
    { id: "payments", name: "Payments", icon: CurrencyDollarIcon },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <AdminLayout>
      <motion.div
        className="space-y-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Premium Header Section */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl md:rounded-3xl p-3 md:p-12 shadow-2xl"
        >
          {/* Ambient background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#346870]/30 to-[#5fa8b5]/30 rounded-full blur-3xl"></div>

          <div className="relative flex flex-row items-center justify-between gap-2 md:gap-6">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="w-9 h-9 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg md:rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <ChartBarIcon className="w-4 h-4 md:w-7 md:h-7 text-white" />
                </div>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base md:text-5xl font-bold text-white tracking-tight truncate">
                  Analytics & Reports
                </h1>
                <p className="hidden md:block text-slate-300 text-lg leading-relaxed max-w-2xl mt-3">
                  Monitor clinic performance and generate actionable insights
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowReportGenerator(true)}
              className="inline-flex items-center justify-center gap-1 md:gap-2 px-2 md:px-6 py-1.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold bg-white text-slate-900 shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 transition-all"
            >
              <DocumentArrowDownIcon className="h-3.5 w-3.5 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Generate Report</span>
              <span className="sm:hidden">Report</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Tab Navigation - Premium Style */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden"
        >
          <div className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
            <nav className="flex px-3 md:px-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex items-center gap-1.5 md:gap-2 py-3 md:py-4 px-2 md:px-6 font-semibold text-xs md:text-sm transition-all ${
                      isActive
                        ? "text-[#346870]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#346870] to-[#5fa8b5]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-3 md:p-8">
            {loading.dashboard || loading.payments || loading.bookings ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <LoadingSpinner size="large" ariaLabel="Loading analytics" />
                  <p className="text-gray-600 font-medium mt-4">Loading analytics...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </motion.div>
                <p className="text-red-600 font-semibold mb-2">Error loading analytics</p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dispatch(fetchAnalyticsData(dateRange))}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#346870] to-[#5fa8b5] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#346870]/25 transition-all"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Try Again
                </motion.button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
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
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Report Generator Modal */}
      {showReportGenerator && (
        <ReportGenerator
          onClose={() => setShowReportGenerator(false)}
          dateRange={dateRange}
          analyticsData={{ dashboardStats, paymentAnalytics, bookingAnalytics }}
        />
      )}
    </AdminLayout>
  );
};

export default Analytics;
