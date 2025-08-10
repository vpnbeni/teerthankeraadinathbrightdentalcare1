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
    return (
      appointmentDate > now &&
      (appointment.status === "scheduled" || appointment.status === "confirmed")
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
                Dental Appointment
              </h3>
              <div
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                  appointment.status
                )}`}
              >
                {getStatusIcon(appointment.status)}
                <span className="ml-1 capitalize">{appointment.status}</span>
              </div>
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
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
