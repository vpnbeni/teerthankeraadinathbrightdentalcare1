import React from "react";
import { LoadingSpinner } from "../../shared/components";
import {
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
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
    <div className="space-y-6">
      {/* Enhanced Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {metrics.revenueGrowth >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                metrics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {metrics.revenueGrowth >= 0 ? "+" : ""}
              {formatPercentage(metrics.revenueGrowth)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Patients
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalPatients}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {metrics.patientGrowth >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                metrics.patientGrowth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {metrics.patientGrowth >= 0 ? "+" : ""}
              {formatPercentage(metrics.patientGrowth)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Appointments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalAppointments}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {metrics.appointmentGrowth >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                metrics.appointmentGrowth >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {metrics.appointmentGrowth >= 0 ? "+" : ""}
              {formatPercentage(metrics.appointmentGrowth)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Subscriptions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.activeSubscriptions}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">Currently active</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Today's Appointments
            </p>
            <p className="text-xl font-bold text-blue-600">
              {metrics.todayAppointments}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Upcoming Appointments
            </p>
            <p className="text-xl font-bold text-purple-600">
              {metrics.upcomingAppointments}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Avg Revenue per Patient
            </p>
            <p className="text-xl font-bold text-[#346870]">
              {formatCurrency(metrics.averageRevenuePerPatient)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
            <p className="text-xl font-bold text-green-600">
              {formatPercentage(metrics.appointmentShowRate)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Overview */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">
                {formatCurrency(metrics.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth Rate</span>
              <span
                className={`font-semibold ${
                  metrics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {metrics.revenueGrowth >= 0 ? "+" : ""}
                {formatPercentage(metrics.revenueGrowth)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg per Patient</span>
              <span className="font-semibold">
                {formatCurrency(metrics.averageRevenuePerPatient)}
              </span>
            </div>
          </div>
        </div>

        {/* Appointment Overview */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Appointment Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Appointments</span>
              <span className="font-semibold">{metrics.totalAppointments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Appointments</span>
              <span className="font-semibold text-blue-600">
                {metrics.todayAppointments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upcoming</span>
              <span className="font-semibold text-purple-600">
                {metrics.upcomingAppointments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completion Rate</span>
              <span className="font-semibold text-green-600">
                {formatPercentage(metrics.appointmentShowRate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
