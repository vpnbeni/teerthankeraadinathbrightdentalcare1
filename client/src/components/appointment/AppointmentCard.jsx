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
      className={`group relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300 overflow-hidden ${
        isUpcoming() ? "ring-2 ring-[#346870]/15" : ""
      }`}
    >
      {/* Premium accent bar for upcoming */}
      {isUpcoming() && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#2E676F] via-[#346870] to-[#4a8a95]"></div>
      )}

      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-5 flex-1 min-w-0">
            {/* Premium Date Badge */}
            <div className="flex-shrink-0">
              <div
                className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-all ${
                  isUpcoming()
                    ? "bg-gradient-to-br from-[#2E676F] via-[#346870] to-[#4a8a95] text-white shadow-[#346870]/25"
                    : isPast()
                    ? "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 shadow-gray-200/50"
                    : "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-blue-500/20"
                }`}
              >
                <div className="text-xs font-semibold opacity-90 uppercase tracking-wide">
                  {new Date(appointment.date)
                    .toLocaleDateString("en-IN", { month: "short" })}
                </div>
                <div className="text-2xl font-bold">
                  {new Date(appointment.date).getDate()}
                </div>
              </div>
            </div>

            {/* Consultation Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="font-bold text-gray-900 text-lg">
                  {appointment.isFollowUp 
                    ? `Follow-up #${appointment.followUpNumber}` 
                    : "Dental Consultation"}
                </h3>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  {getStatusIcon(appointment.status)}
                  <span className="capitalize">{appointment.status}</span>
                </div>
                {appointment.isFollowUp && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200/50 shadow-sm">
                    <svg
                      className="w-3.5 h-3.5"
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200/50 shadow-sm">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Has Follow-ups
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">{formatDate(appointment.date)}</span>
                </div>

                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">{formatTime(appointment.timeSlot)}</span>
                </div>

                {appointment.sessionNumber && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4.5 h-4.5 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">Session #{appointment.sessionNumber}</span>
                  </div>
                )}

                {appointment.isFollowUp && appointment.parentAppointment && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-700 md:col-span-2">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4.5 h-4.5 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">
                      Related to: {formatDate(appointment.parentAppointment.date)}
                      {appointment.parentAppointment.sessionNumber && 
                        ` (Session #${appointment.parentAppointment.sessionNumber})`
                      }
                    </span>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/50 rounded-2xl">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold text-gray-900">Notes:</span> {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Expand Button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all"
              title="View details"
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  showDetails ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details - Premium */}
      {showDetails && (
        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0">
          <div className="pt-6 border-t border-gray-200/50 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</span>
                <div className="font-semibold text-gray-900 mt-1.5">
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
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Updated</span>
                  <div className="font-semibold text-gray-900 mt-1.5">
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
                <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-amber-900">
                      Reschedule History
                    </span>
                  </div>
                  <div className="space-y-2">
                    {appointment.rescheduleHistory.map((history, index) => (
                      <div
                        key={index}
                        className="text-sm text-amber-800 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-amber-200/30"
                      >
                        Originally scheduled for{" "}
                        <span className="font-semibold">{formatDate(history.originalDate)}</span> at{" "}
                        <span className="font-semibold">{formatTime(history.originalTimeSlot)}</span>
                        {history.reason && (
                          <div className="mt-1 text-xs text-amber-700">
                            Reason: {history.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Follow-ups Section - Premium */}
            {!appointment.isFollowUp && appointment.followUps && appointment.followUps.length > 0 && (
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-green-900">
                    Follow-up Appointments ({appointment.followUps.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {appointment.followUps.map((followUp, index) => (
                    <div
                      key={followUp._id || index}
                      className="bg-white/60 backdrop-blur-sm border border-green-200/30 p-4 rounded-xl"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-900 text-sm">
                            Follow-up #{index + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(
                              followUp.status
                            )}`}
                          >
                            {getStatusIcon(followUp.status)}
                            <span className="capitalize">{followUp.status}</span>
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                          No session deduction
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="font-medium">{formatDate(followUp.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-800">
                          <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <span className="font-medium">{formatTime(followUp.timeSlot)}</span>
                        </div>
                      </div>
                      
                      {followUp.notes && (
                        <div className="p-3 bg-green-100/50 rounded-lg mb-2">
                          <p className="text-xs text-green-800">
                            <span className="font-semibold">Notes:</span> {followUp.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-xs text-green-600 font-medium">
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

            {/* Follow-up Information Section - Premium */}
            {appointment.isFollowUp && (
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
                      <svg
                        className="w-6 h-6 text-white"
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
                    <h4 className="text-base font-bold text-green-900 mb-3">
                      Follow-up Appointment Information
                    </h4>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-green-800 leading-relaxed">
                          This is a follow-up for your previous treatment
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-green-800 leading-relaxed">
                          No session deduction - this consultation is complimentary
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-green-800 leading-relaxed">
                          Scheduled to monitor your treatment progress
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
