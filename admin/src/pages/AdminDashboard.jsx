import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import AdminLayout from "../components/common/AdminLayout";
import StatsCards from "../components/analytics/StatsCards";
import { LoadingSpinner } from "../shared/components";
import { fetchDashboardStats } from "../store/analyticsSlice";
import { fetchRecentUsers } from "../store/userSlice";
import { fetchRecentAppointments } from "../store/appointmentSlice";
import { motion } from "framer-motion";
import {
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats = {}, loading = {} } = useSelector(
    (state) => state.analytics || {}
  );
  const analyticsLoading = loading.dashboard || false;
  const { recentUsers = [], loading: usersLoading = false } = useSelector(
    (state) => state.users || {}
  );
  const { recentAppointments = [], loading: appointmentsLoading = false } =
    useSelector((state) => state.appointments || {});
  const { user } = useSelector((state) => state.auth);

  const dashboardFetchedRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dashboardFetchedRef.current) {
      console.log("AdminDashboard: Fetching dashboard data");
      dashboardFetchedRef.current = true;
      dispatch(fetchDashboardStats());
      dispatch(fetchRecentUsers({ limit: 5 }));
      dispatch(fetchRecentAppointments({ limit: 5 }));
    }
  }, [dispatch]);

  const isLoading = analyticsLoading || usersLoading || appointmentsLoading;

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  const statsData = [
    {
      title: "Total Users",
      value: dashboardStats?.totalUsers || 0,
      icon: UsersIcon,
      color: "bg-blue-500",
      change: dashboardStats?.userGrowth || 0,
    },
    {
      title: "Today's Appointments",
      value: dashboardStats?.todayAppointments || 0,
      icon: CalendarIcon,
      color: "bg-green-500",
      change: dashboardStats?.appointmentChange || 0,
    },
    {
      title: "Completed Sessions",
      value: dashboardStats?.completedSessions || 0,
      icon: DocumentTextIcon,
      color: "bg-purple-500",
      change: dashboardStats?.sessionChange || 0,
    },
    {
      title: "Monthly Revenue",
      value: `₹${dashboardStats?.monthlyRevenue || 0}`,
      icon: CurrencyRupeeIcon,
      color: "bg-yellow-500",
      change: dashboardStats?.revenueChange || 0,
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" ariaLabel="Loading dashboard" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div
        className="space-y-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Section - Premium Hero */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 md:p-12 shadow-2xl"
        >
          {/* Ambient background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#346870]/30 to-[#5fa8b5]/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>

          <div className="relative">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-[#5fa8b5] to-[#346870] rounded-2xl flex items-center justify-center shadow-xl shadow-[#346870]/30">
                <ChartBarIcon className="w-7 h-7 text-white" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              {getTimeBasedGreeting()}, {user?.name || "Admin"}
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed mb-6">
              Welcome to your admin dashboard. Monitor clinic performance, manage appointments, and track key metrics.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <ClockIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{formatTime(currentTime)}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <CalendarIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{formatDate(currentTime)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards - Premium Glass Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                {statsData[0].change !== 0 && (
                  <div className={`px-3 py-1 ${statsData[0].change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} text-xs font-semibold rounded-full`}>
                    {statsData[0].change > 0 ? "+" : ""}{statsData[0].change}%
                  </div>
                )}
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                {statsData[0].value}
              </div>
              <p className="text-gray-600 font-medium text-sm">Total Users</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-green-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                {statsData[1].change !== 0 && (
                  <div className={`px-3 py-1 ${statsData[1].change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} text-xs font-semibold rounded-full`}>
                    {statsData[1].change > 0 ? "+" : ""}{statsData[1].change}%
                  </div>
                )}
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                {statsData[1].value}
              </div>
              <p className="text-gray-600 font-medium text-sm">Today's Appointments</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-purple-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                {statsData[2].change !== 0 && (
                  <div className={`px-3 py-1 ${statsData[2].change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} text-xs font-semibold rounded-full`}>
                    {statsData[2].change > 0 ? "+" : ""}{statsData[2].change}%
                  </div>
                )}
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                {statsData[2].value}
              </div>
              <p className="text-gray-600 font-medium text-sm">Completed Sessions</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-7 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-amber-200/30 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <CurrencyRupeeIcon className="w-6 h-6 text-white" />
                </div>
                {statsData[3].change !== 0 && (
                  <div className={`px-3 py-1 ${statsData[3].change > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} text-xs font-semibold rounded-full`}>
                    {statsData[3].change > 0 ? "+" : ""}{statsData[3].change}%
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                {statsData[3].value}
              </div>
              <p className="text-gray-600 font-medium text-sm">Monthly Revenue</p>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Grid - Premium Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Recent Users
                </h2>
              </div>
              <Link
                to="/users"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#346870] hover:text-[#2a5359] transition-colors"
              >
                View all
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers?.length > 0 ? (
                recentUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-200/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gradient-to-br from-[#346870] to-[#5fa8b5] rounded-xl flex items-center justify-center shadow-lg shadow-[#346870]/20">
                        <span className="text-white text-base font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{user.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-700">
                        {user.subscription?.plan?.name || "No Plan"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <UsersIcon className="w-8 h-8 text-gray-400" />
                  </motion.div>
                  <p className="text-gray-600 font-medium text-sm">No recent users</p>
                  <p className="text-gray-400 text-xs mt-1">New users will appear here</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Appointments */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Recent Appointments
                </h2>
              </div>
              <Link
                to="/appointments"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#346870] hover:text-[#2a5359] transition-colors"
              >
                View all
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="space-y-3">
              {recentAppointments?.length > 0 ? (
                recentAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-200/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
                        appointment.status === "confirmed"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                          : appointment.status === "scheduled"
                          ? "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/20"
                          : appointment.status === "completed"
                          ? "bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/20"
                          : "bg-gradient-to-br from-red-500 to-pink-600 shadow-red-500/20"
                      }`}>
                        <CalendarIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {appointment.userId?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {appointment.timeSlot}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-700 mb-1.5">
                        {new Date(appointment.date).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : appointment.status === "completed"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                  </motion.div>
                  <p className="text-gray-600 font-medium text-sm">No recent appointments</p>
                  <p className="text-gray-400 text-xs mt-1">Appointments will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions - Refined Grid */}
        <motion.div
          variants={itemVariants}
          className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-gradient-to-b from-[#346870] to-[#5fa8b5] rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quick Actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/users"
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">Manage Users</h3>
                <p className="relative text-xs text-blue-100 text-center">View and edit users</p>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/appointments"
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">Appointments</h3>
                <p className="relative text-xs text-green-100 text-center">Schedule & manage</p>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/availability"
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">Availability</h3>
                <p className="relative text-xs text-purple-100 text-center">Manage time slots</p>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/analytics"
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#346870]/20 to-[#5fa8b5]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">Analytics</h3>
                <p className="relative text-xs text-slate-300 text-center">View reports</p>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
