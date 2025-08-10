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

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { upcomingAppointments, appointments } = useSelector((state) => state.appointments);
  const [currentGreeting, setCurrentGreeting] = useState("");
  const [currentMessage, setCurrentMessage] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);

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
              message = `Appointment completed on ${date}`;
              break;
            case "scheduled":
            case "confirmed":
              message = `Appointment scheduled for ${date} at ${appointment.timeSlot}`;
              break;
            case "cancelled":
              message = `Appointment cancelled for ${date}`;
              break;
            default:
              message = `Appointment ${appointment.status} for ${date}`;
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

  const getSubscriptionStatus = () => {
    if (!user?.subscription) return "No active subscription";
    return user.subscription.status === "active"
      ? `${user.subscription.sessionsRemaining} sessions remaining`
      : "Subscription inactive";
  };

  const getSubscriptionPlanName = () => {
    if (!user?.subscription) return "No Active Plan";
    // For now, return a generic plan name since planId is just an ID
    // You might want to fetch plan details separately if needed
    return user.subscription.status === "active" ? "Active Plan" : "Inactive Plan";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Appointment Reminders */}
        <AppointmentReminders />

        {/* Phone Verification Reminder */}
        {user && !user.phone && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-500 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-blue-800 font-medium mb-1">
                  Add Your Phone Number
                </h3>
                <p className="text-blue-700 text-sm mb-3">
                  Add and verify your phone number to enable phone-based login
                  and receive SMS notifications.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Phone Number
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
              <button
                onClick={() => {
                  /* Could add dismiss functionality */
                }}
                className="text-blue-400 hover:text-blue-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {currentGreeting}
          </h1>
          <p className="text-gray-600">
            {currentMessage} Manage your dental appointments and track your care
            journey.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-[#346870] mb-2">
              {user?.subscription?.sessionsRemaining || 0}
            </div>
            <p className="text-gray-600">Sessions Remaining</p>
            <SessionLimitIndicator showDetails={false} />
          </div>

          <div className="card text-center">
            <div className="text-3xl font-bold text-[#346870] mb-2">
              {upcomingAppointments?.filter(
                (apt) =>
                  apt.status === "scheduled" || apt.status === "confirmed"
              ).length || 0}
            </div>
            <p className="text-gray-600">Upcoming Appointments</p>
          </div>

          <div className="card text-center">
            <div className="text-3xl font-bold text-[#346870] mb-2">
              {appointments?.filter(apt => apt.status === "completed").length || 0}
            </div>
            <p className="text-gray-600">Completed Appointments</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/appointments"
              className="flex items-center p-4 bg-[#346870] bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors"
            >
              <svg
                className="w-8 h-8 text-[#346870] mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-gray-800">Book Appointment</h3>
                <p className="text-sm text-gray-600">
                  Schedule your next visit
                </p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center p-4 bg-[#346870] bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors"
            >
              <svg
                className="w-8 h-8 text-[#346870] mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-gray-800">Update Profile</h3>
                <p className="text-sm text-gray-600">Manage your information</p>
              </div>
            </Link>

            <Link
              to="/payments"
              className="flex items-center p-4 bg-[#346870] bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors"
            >
              <svg
                className="w-8 h-8 text-[#346870] mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-gray-800">View Payments</h3>
                <p className="text-sm text-gray-600">
                  Check subscription details
                </p>
              </div>
            </Link>

            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <svg
                className="w-8 h-8 text-gray-400 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-medium text-gray-800">Need Help?</h3>
                <p className="text-sm text-gray-600">Contact support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === 'completed' ? 'bg-green-500' :
                    activity.type === 'scheduled' || activity.type === 'confirmed' ? 'bg-[#346870]' :
                    activity.type === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Subscription Overview
          </h2>
          <div className="bg-gradient-to-r from-[#346870] to-[#BDCFD1] rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {getSubscriptionPlanName()}
                </h3>
                <p className="text-sm opacity-90">{getSubscriptionStatus()}</p>
                {user?.subscription?.totalSessions && (
                  <p className="text-sm opacity-90 mt-1">
                    Total Sessions: {user.subscription.totalSessions}
                  </p>
                )}
              </div>
              <div className="text-right">
                {user?.subscription?.endDate && (
                  <p className="text-sm opacity-90">
                    Valid until {formatDate(user.subscription.endDate)}
                  </p>
                )}
                {user?.subscription?.startDate && (
                  <p className="text-sm opacity-90 mt-1">
                    Started: {formatDate(user.subscription.startDate)}
                  </p>
                )}
                <Link
                  to="/payments"
                  className="inline-block mt-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-colors"
                >
                  Manage Subscription
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
