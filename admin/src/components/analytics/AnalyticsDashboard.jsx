import React from "react";
import { LoadingSpinner } from "../../shared/components";
import { motion } from "framer-motion";
import {
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const AnalyticsDashboard = ({ data, paymentData, bookingData, dateRange }) => {
  // Format currency helper
  const formatCurrency = (value) => `₹${value?.toLocaleString() || 0}`;
  const formatPercentage = (value) => `${value?.toFixed(1) || 0}%`;

  // Enhanced metrics calculation
  const calculateMetrics = () => {
    const totalRevenue = paymentData?.overview?.totalRevenue || 0;
    const totalPatients = data?.totalUsers || 0;
    const totalAppointments = data?.totalAppointments || 0;

    const revenueGrowth = paymentData?.overview?.revenueGrowth || 0;
    const patientGrowth = data?.userGrowth || 0;
    const appointmentGrowth = data?.appointmentChange || 0;

    return {
      totalRevenue,
      totalPatients,
      totalAppointments,
      revenueGrowth,
      patientGrowth,
      appointmentGrowth,
      averageRevenuePerPatient:
        totalPatients > 0 ? totalRevenue / totalPatients : 0,
      appointmentShowRate: bookingData?.overview?.completionRate || 0,
      activeSubscriptions: data?.activeSubscriptions || 0,
      todayAppointments: data?.todayAppointments || 0,
      upcomingAppointments: data?.upcomingAppointments || 0,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Enhanced Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Revenue */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-green-200/40 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <CurrencyDollarIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Revenue
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  metrics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.revenueGrowth >= 0 ? "+" : ""}
                {formatPercentage(metrics.revenueGrowth)}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </div>
        </motion.div>

        {/* Total Patients */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/40 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                Patients
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Total Patients</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {metrics.totalPatients}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {metrics.patientGrowth >= 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  metrics.patientGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.patientGrowth >= 0 ? "+" : ""}
                {formatPercentage(metrics.patientGrowth)}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </div>
        </motion.div>

        {/* Total Consultation */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-purple-200/40 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                Bookings
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Total Consultation</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {metrics.totalAppointments}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {metrics.appointmentGrowth >= 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-semibold ${
                  metrics.appointmentGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {metrics.appointmentGrowth >= 0 ? "+" : ""}
                {formatPercentage(metrics.appointmentGrowth)}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          </div>
        </motion.div>

        {/* Active Subscriptions */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-amber-200/40 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <ChartBarIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                Active
              </div>
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-gray-600 mb-1">Active Subscriptions</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {metrics.activeSubscriptions}
              </p>
            </div>
            <div className="mt-4">
              <span className="text-xs text-gray-500">Currently active</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Revenue Overview */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
              Revenue Overview
            </h3>
            <SparklesIcon className="h-4 w-4 md:h-5 md:w-5 text-green-500 ml-auto" />
          </div>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">Total Revenue</span>
              <span className="font-bold text-green-600">
                {formatCurrency(metrics.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">Growth Rate</span>
              <span
                className={`font-bold ${
                  metrics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.revenueGrowth >= 0 ? "+" : ""}
                {formatPercentage(metrics.revenueGrowth)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">Avg per Patient</span>
              <span className="font-bold text-[#346870]">
                {formatCurrency(metrics.averageRevenuePerPatient)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Consultation Overview */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-xl md:rounded-2xl p-5 md:p-6 shadow-lg shadow-gray-200/50 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h3 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">
              Consultation Overview
            </h3>
            <SparklesIcon className="h-4 w-4 md:h-5 md:w-5 text-purple-500 ml-auto" />
          </div>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">Total Consultation</span>
              <span className="font-bold text-purple-600">{metrics.totalAppointments}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">Today's Consultation</span>
              <span className="font-bold text-blue-600">
                {metrics.todayAppointments}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">Upcoming</span>
              <span className="font-bold text-amber-600">
                {metrics.upcomingAppointments}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <span className="text-sm text-gray-700 font-medium">Completion Rate</span>
              <span className="font-bold text-green-600">
                {formatPercentage(metrics.appointmentShowRate)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
