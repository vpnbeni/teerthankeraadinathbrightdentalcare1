import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/common/DashboardLayout";
import BookingModal from "../components/appointment/BookingModal";
import AppointmentCard from "../components/appointment/AppointmentCard";
import appointmentService from "../services/appointments";
import { LoadingSpinner } from "../shared/components";
import {
  canUserBookAppointment,
  getSessionLimitMessage,
  needsUpgrade,
} from "../utils/sessionLimits";

const Appointments = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [pagination, setPagination] = useState(null);
  const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Refetch appointments when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchAppointments();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments();
      if (response.data.success) {
        setAppointments(response.data.data.appointments || []);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      setError("Unable to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = (newAppointment) => {
    setAppointments([newAppointment.appointment, ...appointments]);

    // Show success message with profile update info if applicable
    if (newAppointment.profileUpdated) {
      // You can add a toast notification here if you have a toast system
      console.log("Profile updated with verified email and information");
    }
  };

  const filterAppointments = (appointments, filter) => {
    const now = new Date();

    switch (filter) {
      case "upcoming":
        return appointments.filter((apt) => {
          const aptDate = new Date(apt.date);
          
          // Check if this is a completed appointment with follow-ups
          const hasUpcomingFollowUps = apt.followUps && apt.followUps.length > 0 && 
            apt.followUps.some(followUp => {
              const followUpDate = new Date(followUp.date);
              return followUpDate >= now && followUp.status !== "cancelled";
            });
          
          return (
            // Regular upcoming appointments
            (aptDate >= now && (apt.status === "scheduled" || apt.status === "confirmed")) ||
            // Completed appointments with upcoming follow-ups
            (apt.status === "completed" && hasUpcomingFollowUps)
          );
        });
      case "past":
        return appointments.filter((apt) => {
          const aptDate = new Date(apt.date);
          
          // Check if this is a completed appointment with follow-ups
          const hasUpcomingFollowUps = apt.followUps && apt.followUps.length > 0 && 
            apt.followUps.some(followUp => {
              const followUpDate = new Date(followUp.date);
              return followUpDate >= now && followUp.status !== "cancelled";
            });
          
          return (
            // Past appointments (date-wise or completed status)
            (aptDate < now || apt.status === "completed") &&
            // But exclude completed appointments with upcoming follow-ups (they go to upcoming)
            !(apt.status === "completed" && hasUpcomingFollowUps)
          );
        });
      case "cancelled":
        return appointments.filter((apt) => apt.status === "cancelled");
      default:
        return appointments;
    }
  };

  const filteredAppointments = filterAppointments(appointments, activeTab);

  const tabs = [
    {
      id: "upcoming",
      label: "Upcoming",
      count: filterAppointments(appointments, "upcoming").length,
    },
    {
      id: "past",
      label: "Past",
      count: filterAppointments(appointments, "past").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: filterAppointments(appointments, "cancelled").length,
    },
  ];

  const canBookAppointment = () => {
    const { canBook } = canUserBookAppointment(user, appointments);
    return canBook;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
              My Consultation
            </h1>
            <p className="text-gray-600 text-base">
              Manage your dental consultations and schedule new visits
            </p>
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            disabled={!canBookAppointment()}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#2E676F] via-[#346870] to-[#4a8a95] text-white text-sm font-semibold rounded-xl hover:from-[#346870] hover:to-[#5fa8b5] transition-all shadow-lg shadow-[#346870]/25 hover:shadow-xl hover:shadow-[#346870]/35 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            title={
              !canBookAppointment()
                ? user?.subscription?.status !== "active"
                  ? "Active subscription required to book consultancy"
                  : user?.subscription?.sessionsRemaining <= 0
                  ? "No sessions remaining in your current plan"
                  : "You have already booked the maximum number of consultations allowed"
                : ""
            }
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Book Consultation
          </button>
        </div>

        {/* Premium Alert - Subscription Status */}
        {!canBookAppointment() && (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/50 rounded-3xl p-6 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-amber-900 text-base mb-1">
                  {user?.subscription?.status !== "active"
                    ? "Subscription Required"
                    : "Session Limit Reached"}
                </h4>
                <p className="text-amber-800 text-sm leading-relaxed mb-4">
                  {getSessionLimitMessage(user, appointments)}
                </p>
                {needsUpgrade(user, appointments) && (
                  <Link
                    to="/payments"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    Upgrade Plan
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Premium Tabs */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl md:rounded-3xl shadow-lg shadow-gray-200/50 p-1.5 md:p-2">
          <nav className="flex gap-1.5 md:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 relative px-3 py-2.5 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#2E676F] via-[#346870] to-[#4a8a95] text-white shadow-lg shadow-[#346870]/25"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-1 md:ml-2 inline-flex items-center justify-center min-w-[20px] md:min-w-[24px] h-5 md:h-6 px-1.5 md:px-2 rounded-full text-[10px] md:text-xs font-bold ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No {activeTab} consultations
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {activeTab === "upcoming"
                  ? "You don't have any upcoming consultations. Book your first visit to get started."
                  : activeTab === "past"
                  ? "You don't have any past consultations yet."
                  : "You don't have any cancelled consultations."}
              </p>
              {activeTab === "upcoming" && canBookAppointment() && (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#2E676F] via-[#346870] to-[#4a8a95] text-white text-sm font-semibold rounded-xl hover:from-[#346870] hover:to-[#5fa8b5] transition-all shadow-lg shadow-[#346870]/25 hover:shadow-xl hover:shadow-[#346870]/35 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Book Your First Consultation
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
              />
            ))
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
        refreshTrigger={sessionRefreshTrigger}
      />

      {/* Toast Notifications */}
      {/* The Toast component is not directly used here, but the error state is removed. */}
    </DashboardLayout>
  );
};

export default Appointments;
