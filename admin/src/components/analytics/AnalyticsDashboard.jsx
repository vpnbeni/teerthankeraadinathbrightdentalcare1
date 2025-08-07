import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDashboardStats,
  fetchPaymentAnalytics,
  fetchSessionAnalytics,
  fetchBookingAnalytics,
  setDateRange,
} from "../../store/analyticsSlice";
import { LoadingSpinner } from "../../shared/components";
import StatsCards from "./StatsCards";
import RevenueChart from "./RevenueChart";
import SessionChart from "./SessionChart";
import BookingChart from "./BookingChart";
import AppointmentTrends from "./AppointmentTrends";
import PatientGrowth from "./PatientGrowth";
import DateRangeFilter from "./DateRangeFilter";
import ReportGenerator from "./ReportGenerator";
import {
  formatCurrency,
  formatPercentage,
} from "../../shared/utils/formatters";
import {
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const AnalyticsDashboard = ({
  data,
  paymentData,
  sessionData,
  bookingData,
}) => {
  const dispatch = useDispatch();
  const {
    dashboardStats,
    paymentAnalytics,
    sessionAnalytics,
    bookingAnalytics,
    loading,
    error,
    dateRange,
  } = useSelector((state) => state.analytics);

  const [activeView, setActiveView] = useState("overview");

  // Use passed data or fallback to store data
  const currentData = data || dashboardStats;
  const currentPaymentData = paymentData || paymentAnalytics;
  const currentSessionData = sessionData || sessionAnalytics;
  const currentBookingData = bookingData || bookingAnalytics;

  useEffect(() => {
    // Fetch initial data if not provided
    if (!data) {
      dispatch(fetchDashboardStats());
      dispatch(fetchPaymentAnalytics(dateRange));
      dispatch(fetchSessionAnalytics(dateRange));
      dispatch(fetchBookingAnalytics(dateRange));
    }
  }, [dispatch, dateRange, data]);

  const handleDateRangeChange = (newDateRange) => {
    dispatch(setDateRange(newDateRange));
  };

  // Enhanced metrics calculation
  const calculateMetrics = () => {
    const totalRevenue = currentPaymentData?.totalRevenue || 0;
    const totalPatients = currentData?.totalUsers || 0;
    const totalAppointments = currentBookingData?.totalBookings || 0;
    const completedSessions = currentSessionData?.totalSessions || 0;

    const revenueGrowth = currentPaymentData?.revenueChange || 0;
    const patientGrowth = currentData?.userGrowth || 0;
    const appointmentGrowth = currentBookingData?.bookingChange || 0;
    const sessionGrowth = currentSessionData?.sessionChange || 0;

    return {
      totalRevenue,
      totalPatients,
      totalAppointments,
      completedSessions,
      revenueGrowth,
      patientGrowth,
      appointmentGrowth,
      sessionGrowth,
      averageRevenuePerPatient:
        totalPatients > 0 ? totalRevenue / totalPatients : 0,
      appointmentShowRate: currentBookingData?.showRate || 0,
      sessionCompletionRate: currentSessionData?.completionRate || 0,
    };
  };

  const metrics = calculateMetrics();

  if (loading?.dashboard && !currentData?.totalUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" ariaLabel="Loading analytics dashboard" />
      </div>
    );
  }

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

        {/* Completed Sessions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Completed Sessions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.completedSessions}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {metrics.sessionGrowth >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                metrics.sessionGrowth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {metrics.sessionGrowth >= 0 ? "+" : ""}
              {formatPercentage(metrics.sessionGrowth)}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <p className="text-sm font-medium text-gray-600">
              Appointment Show Rate
            </p>
            <p className="text-xl font-bold text-green-600">
              {formatPercentage(metrics.appointmentShowRate)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">
              Session Completion Rate
            </p>
            <p className="text-xl font-bold text-blue-600">
              {formatPercentage(metrics.sessionCompletionRate)}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <RevenueChart
          data={currentPaymentData?.monthlyRevenue}
          loading={loading?.payments}
          title="Revenue Performance"
          showTrends={true}
        />

        {/* Patient Growth Chart */}
        <PatientGrowth data={currentData} loading={loading?.dashboard} />

        {/* Appointment Trends - Full Width */}
        <div className="lg:col-span-2">
          <AppointmentTrends
            data={currentBookingData}
            loading={loading?.bookings}
          />
        </div>

        {/* Session Analytics */}
        <SessionChart
          data={currentSessionData?.sessionTrends}
          loading={loading?.sessions}
          detailed={true}
        />

        {/* Booking Patterns */}
        <BookingChart
          data={currentBookingData?.appointmentPatterns}
          loading={loading?.bookings}
          showHeatmap={true}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
