import React, { useState } from "react";

const AppointmentCard = ({ appointment }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    const [start, end] = timeString.split("-");
    const formatSingleTime = (time) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatSingleTime(start)} - ${formatSingleTime(end)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "scheduled":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "confirmed":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "completed":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "cancelled":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "rescheduled":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      default:
        return null;
    }
  };



  const isUpcoming = () => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    // Check if this is a completed appointment with follow-ups
    const hasUpcomingFollowUps = appointment.followUps && appointment.followUps.length > 0 && 
      appointment.followUps.some(followUp => {
        const followUpDate = new Date(followUp.date);
        return followUpDate >= now && followUp.status !== "cancelled";
      });
    
    return (
      // Regular upcoming appointments
      (appointmentDate > now && (appointment.status === "scheduled" || appointment.status === "confirmed")) ||
      // Completed appointments with upcoming follow-ups
      (appointment.status === "completed" && hasUpcomingFollowUps)
    );
  };

  const isPast = () => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    return appointmentDate < now;
  };

  return (
    <div
      className={`card transition-all duration-200 ${
        isUpcoming() ? "border-l-4 border-l-[#346870]" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Date Circle */}
          <div className="flex-shrink-0">
            <div
              className={`w-16 h-16 rounded-full flex flex-col items-center justify-center text-sm font-medium ${
                isUpcoming()
                  ? "bg-[#346870] text-white"
                  : isPast()
                  ? "bg-gray-100 text-gray-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <div className="text-xs">
                {new Date(appointment.date)
                  .toLocaleDateString("en-IN", { month: "short" })
                  .toUpperCase()}
              </div>
              <div className="text-lg font-bold">
                {new Date(appointment.date).getDate()}
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-800">
                {appointment.isFollowUp 
                  ? `Follow-up #${appointment.followUpNumber}` 
                  : "Dental Appointment"}
              </h3>
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  appointment.status
                )}`}
              >
                {getStatusIcon(appointment.status)}
                <span className="ml-1 capitalize">{appointment.status}</span>
              </div>
              {appointment.isFollowUp && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Follow-up
                </div>
              )}
              {appointment.status === "completed" && appointment.followUps && appointment.followUps.length > 0 && 
               appointment.followUps.some(followUp => {
                 const followUpDate = new Date(followUp.date);
                 const now = new Date();
                 return followUpDate >= now && followUp.status !== "cancelled";
               }) && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <svg
                    className="w-3 h-3 mr-1"
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
                  Has Follow-ups
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDate(appointment.date)}
              </div>

              <div className="flex items-center">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatTime(appointment.timeSlot)}
              </div>

              {appointment.sessionNumber && (
                <div className="flex items-center">
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
                      d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                    />
                  </svg>
                  Session #{appointment.sessionNumber}
                </div>
              )}

              {appointment.isFollowUp && appointment.parentAppointment && (
                <div className="flex items-center">
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Related to: {formatDate(appointment.parentAppointment.date)}
                  {appointment.parentAppointment.sessionNumber && 
                    ` (Session #${appointment.parentAppointment.sessionNumber})`
                  }
                </div>
              )}
            </div>

            {appointment.notes && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {appointment.notes}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="View details"
          >
            <svg
              className={`w-5 h-5 transition-transform ${
                showDetails ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Created:</span>
              <div className="font-medium">
                {new Date(appointment.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {appointment.updatedAt !== appointment.createdAt && (
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <div className="font-medium">
                  {new Date(appointment.updatedAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}
          </div>

          {appointment.rescheduleHistory &&
            appointment.rescheduleHistory.length > 0 && (
              <div>
                <span className="text-gray-600 text-sm">
                  Reschedule History:
                </span>
                <div className="mt-1 space-y-1">
                  {appointment.rescheduleHistory.map((history, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-500 bg-gray-50 p-2 rounded"
                    >
                      Originally scheduled for{" "}
                      {formatDate(history.originalDate)} at{" "}
                      {formatTime(history.originalTimeSlot)}
                      {history.reason && ` - Reason: ${history.reason}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Follow-ups Section - only show for main appointments, not for follow-ups themselves */}
          {!appointment.isFollowUp && appointment.followUps && appointment.followUps.length > 0 && (
            <div>
              <span className="text-gray-600 text-sm font-medium flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
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
                Follow-up Appointments ({appointment.followUps.length}):
              </span>
              <div className="mt-2 space-y-2">
                {appointment.followUps.map((followUp, index) => (
                  <div
                    key={followUp._id || index}
                    className="text-xs bg-green-50 border border-green-200 p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-green-800">
                          Follow-up #{index + 1}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            followUp.status
                          )}`}
                        >
                          {getStatusIcon(followUp.status)}
                          <span className="ml-1 capitalize">{followUp.status}</span>
                        </span>
                      </div>
                      <div className="text-green-600 font-medium">
                        No session deduction
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center text-green-700">
                        <svg
                          className="w-3 h-3 mr-1"
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
                        <span>{formatDate(followUp.date)}</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{formatTime(followUp.timeSlot)}</span>
                      </div>
                    </div>
                    
                    {followUp.notes && (
                      <div className="mt-2 text-green-700">
                        <span className="font-medium">Notes:</span> {followUp.notes}
                      </div>
                    )}
                    
                    <div className="mt-2 text-green-600 text-xs">
                      Scheduled: {new Date(followUp.scheduledAt || followUp.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Information Section */}
          {appointment.isFollowUp && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">
                    Follow-up Appointment Information
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-green-800">
                        This is a follow-up for your previous treatment
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-green-800">
                        No session deduction - this appointment is complimentary
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-green-800">
                        Scheduled to monitor your treatment progress
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
