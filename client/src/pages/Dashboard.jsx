import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/common/DashboardLayout";
import AppointmentReminders from "../components/dashboard/AppointmentReminders";
import SessionLimitIndicator from "../components/common/SessionLimitIndicator";
import { getTimeBasedGreeting, getTimeBasedMessage } from "../shared/utils";
import { fetchAppointments } from "../store/appointmentSlice";
import { updateUser } from "../store/authSlice";
import authService from "../services/auth";
import plansService from "../services/plans";
import { motion } from "framer-motion";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { upcomingAppointments, appointments } = useSelector((state) => state.appointments);
  const [currentGreeting, setCurrentGreeting] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);
  const [plan, setPlan] = useState(null);

  // Fetch profile and appointments when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        console.log("Dashboard: Fetching data for user:", user);
        
        // Fetch latest profile data to get subscription info
        try {
          const profileResponse = await authService.getProfile();
          if (profileResponse.data.success) {
            dispatch(updateUser(profileResponse.data.data));
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
        
        // Fetch appointments
        dispatch(fetchAppointments());
      }
    };
    
    fetchData();
  }, [dispatch, user?.id]); // Use user.id to avoid infinite re-renders

  // Fetch plan details when subscription changes
  useEffect(() => {
    if (user?.subscription?.planId) {
      plansService
        .getPlan(user.subscription.planId)
        .then((response) => {
          setPlan(response.data.data);
        })
        .catch((error) => {
          console.error("Failed to fetch plan details", error);
        });
    }
  }, [user?.subscription?.planId]);

  // Generate recent activity from appointments
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const activity = appointments
        .slice(0, 5) // Get last 5 appointments
        .map((appointment) => {
          let message = "";
          const date = new Date(appointment.date).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          });
          
          switch (appointment.status) {
            case "completed":
              message = `Consultation completed on ${date}`;
              break;
            case "scheduled":
            case "confirmed":
              message = `Consultation scheduled for ${date} at ${appointment.timeSlot}`;
              break;
            case "cancelled":
              message = `Consultation cancelled for ${date}`;
              break;
            default:
              message = `Consultation ${appointment.status} for ${date}`;
          }
          
          return {
            message,
            date: appointment.createdAt || appointment.date,
            type: appointment.status
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by most recent
      
      setRecentActivity(activity);
    }
  }, [appointments]);

  // Update greeting every minute to keep it current
  useEffect(() => {
    const updateGreeting = () => {
      setCurrentGreeting(getTimeBasedGreeting(user?.name || "Patient"));
      setCurrentMessage(getTimeBasedMessage());
    };

    // Initial update
    updateGreeting();

    // Update every minute
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, [user?.name]);

  // Calculate total sessions from subscription or plan details
  const getTotalSessions = () => {
    // Use subscription.totalSessions if available (handles upgrades correctly)
    // Otherwise fall back to plan.sessions for new subscriptions
    return user?.subscription?.totalSessions || plan?.sessions || 0;
  };

  const getSessionsUsed = () => {
    const totalSessions = getTotalSessions();
    const sessionsRemaining = user?.subscription?.sessionsRemaining || 0;
    return totalSessions - sessionsRemaining;
  };

  const calculateProgress = () => {
    const totalSessions = getTotalSessions();
    const sessionsRemaining = user?.subscription?.sessionsRemaining || 0;
    const used = totalSessions - sessionsRemaining;
    return totalSessions > 0 ? (used / totalSessions) * 100 : 0;
  };

  const getSubscriptionStatus = () => {
    if (!user?.subscription) return "No active subscription";
    return user.subscription.status === "active"
      ? `${user.subscription.sessionsRemaining} sessions remaining`
      : "Subscription inactive";
  };

  const getSubscriptionPlanName = () => {
    if (!user?.subscription) return "No Active Plan";
    // Use plan name if available, otherwise return generic name
    return plan?.name || (user.subscription.status === "active" ? "Active Plan" : "Inactive Plan");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Appointment Reminders */}
        <motion.div variants={itemVariants}>
          <AppointmentReminders />
        </motion.div>

        {/* Phone Verification Reminder */}
        {user && !user.phone && (
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-semibold text-base mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  Add your phone number to enable SMS notifications and phone-based login for a seamless experience.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  Add Phone Number
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

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
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              {currentGreeting}
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed">
              {currentMessage} Manage your dental consultations and track your care journey with ease.
            </p>
          </div>
        </motion.div>

        {/* Quick Stats - Premium Glass Cards */}
        <div className="grid md:grid-cols-3 gap-5">
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
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  Active
                </div>
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                {user?.subscription?.sessionsRemaining || 0}
              </div>
              <p className="text-gray-600 font-medium text-sm mb-4">Sessions Remaining</p>
              <div className="pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-semibold text-gray-700">
                      {getSessionsUsed()} of {getTotalSessions()} used
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-xs font-semibold text-gray-600">
                      {Math.round(calculateProgress())}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

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
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  Scheduled
                </div>
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                {upcomingAppointments?.filter(
                  (apt) =>
                    apt.status === "scheduled" || apt.status === "confirmed"
                ).length || 0}
              </div>
              <p className="text-gray-600 font-medium text-sm">Upcoming Consultation</p>
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
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Done
                </div>
              </div>
              <div className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                {appointments?.filter(apt => apt.status === "completed").length || 0}
              </div>
              <p className="text-gray-600 font-medium text-sm">Completed Consultation</p>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions - Refined Grid */}
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-gradient-to-b from-[#346870] to-[#5fa8b5] rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quick Actions</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/appointments"
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl hover:shadow-xl hover:shadow-slate-900/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#346870]/20 to-[#5fa8b5]/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">Book Consultation</h3>
                <p className="relative text-xs text-slate-300 text-center">Schedule your next visit</p>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/profile"
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">Update Profile</h3>
                <p className="relative text-xs text-indigo-100 text-center">Manage your information</p>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/payments"
                className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">View Payments</h3>
                <p className="relative text-xs text-orange-100 text-center">Check subscription details</p>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <div className="group relative flex flex-col items-center p-6 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl hover:shadow-xl hover:shadow-gray-900/20 transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="relative font-semibold text-white text-center mb-1.5">Need Help?</h3>
                <p className="relative text-xs text-gray-300 text-center">Contact support</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Activity - Clean Timeline */}
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex items-start gap-4 p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-200/50 hover:shadow-md transition-all duration-200"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    activity.type === 'completed' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    activity.type === 'scheduled' || activity.type === 'confirmed' ? 'bg-gradient-to-br from-[#346870] to-[#5fa8b5]' :
                    activity.type === 'cancelled' ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    {activity.type === 'completed' ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : activity.type === 'scheduled' || activity.type === 'confirmed' ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-medium text-sm leading-relaxed">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDate(activity.date)}
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
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </motion.div>
                <p className="text-gray-600 font-medium text-sm">No recent activity</p>
                <p className="text-gray-400 text-xs mt-1">Your activity will appear here</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Subscription Info - Premium Card */}
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 overflow-hidden">
          <div className="p-8 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Subscription Overview</h2>
            </div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-10">
            {/* Premium background pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#5fa8b5]/20 to-[#346870]/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-white mb-4 border border-white/10">
                  <div className={`w-2 h-2 rounded-full ${user?.subscription?.status === "active" ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}></div>
                  {user?.subscription?.status === "active" ? "ACTIVE PLAN" : "INACTIVE"}
                </div>
                <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">
                  {getSubscriptionPlanName()}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-200">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm">{getSubscriptionStatus()}</span>
                  </div>
                  {user?.subscription?.totalSessions && (
                    <div className="flex items-center gap-3 text-slate-200">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <span className="text-sm">Total Sessions: {user.subscription.totalSessions}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {user?.subscription?.startDate && (
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                      <p className="text-xs text-slate-400 mb-1.5 font-medium">Started On</p>
                      <p className="text-white font-semibold text-sm">
                        {new Date(user.subscription.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  )}
                  {user?.subscription?.endDate && (
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                      <p className="text-xs text-slate-400 mb-1.5 font-medium">Valid Until</p>
                      <p className="text-white font-semibold text-sm">
                        {new Date(user.subscription.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  )}
                </div>
                <Link
                  to="/payments"
                  className="group inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5"
                >
                  Manage Subscription
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
