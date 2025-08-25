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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              My Appointments
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your dental appointments and book new ones
            </p>
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            disabled={!canBookAppointment()}
            className="btn-primary px-6 py-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !canBookAppointment()
                ? user?.subscription?.status !== "active"
                  ? "Active subscription required to book appointments"
                  : user?.subscription?.sessionsRemaining <= 0
                  ? "No sessions remaining in your current plan"
                  : "You have already booked the maximum number of appointments allowed"
                : ""
            }
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Book Appointment
          </button>
        </div>

        {/* Subscription Status Alert */}
        {!canBookAppointment() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800">
                  {user?.subscription?.status !== "active"
                    ? "Subscription Required"
                    : "Session Limit Reached"}
                </h4>
                <p className="text-yellow-700 text-sm mt-1">
                  {getSessionLimitMessage(user, appointments)}
                </p>
                {needsUpgrade(user, appointments) && (
                  <div className="mt-3">
                    <Link
                      to="/payments"
                      className="inline-flex items-center px-4 py-2 bg-[#346870] text-white text-sm font-medium rounded-lg hover:bg-[#2a5359] transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      Upgrade Plan
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#346870] text-[#346870]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? "bg-[#346870] text-white"
                        : "bg-gray-100 text-gray-600"
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
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No {activeTab} appointments
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === "upcoming"
                  ? "You don't have any upcoming appointments."
                  : activeTab === "past"
                  ? "You don't have any past appointments."
                  : "You don't have any cancelled appointments."}
              </p>
              {activeTab === "upcoming" && canBookAppointment() && (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="btn-primary px-6 py-2"
                >
                  Book Your First Appointment
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
