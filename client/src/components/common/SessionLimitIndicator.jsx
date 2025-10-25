import React from "react";
import { useSessionLimits } from "../../hooks/useSessionLimits";

const SessionLimitIndicator = ({ showDetails = true, className = "", darkMode = false }) => {
  const { sessionLimits, canBook, bookingMessage, loading } =
    useSessionLimits();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`h-4 rounded w-32 ${darkMode ? 'bg-white bg-opacity-20' : 'bg-gray-200'}`}></div>
      </div>
    );
  }

  const { sessionsRemaining, totalSessions, confirmedAppointments } =
    sessionLimits;
  const usedSessions = totalSessions - sessionsRemaining;
  const progressPercentage =
    totalSessions > 0 ? (usedSessions / totalSessions) * 100 : 0;

  const getStatusColor = () => {
    if (darkMode) {
      if (!canBook) return "text-red-200";
      if (sessionsRemaining <= 2) return "text-yellow-200";
      return "text-green-200";
    }
    if (!canBook) return "text-red-600";
    if (sessionsRemaining <= 2) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    if (darkMode) {
      if (!canBook) return "bg-red-300";
      if (sessionsRemaining <= 2) return "bg-yellow-300";
      return "bg-green-300";
    }
    if (!canBook) return "bg-red-500";
    if (sessionsRemaining <= 2) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className={`${className}`}>
      {/* Session Count */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${darkMode ? 'text-purple-100' : 'text-gray-700'}`}>Sessions</span>
        <span className={`text-sm font-semibold ${getStatusColor()}`}>
          {sessionsRemaining} / {totalSessions}
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full rounded-full h-2 mb-2 ${darkMode ? 'bg-white bg-opacity-20' : 'bg-gray-200'}`}>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        ></div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-1">
          <div className={`flex justify-between text-xs ${darkMode ? 'text-purple-100' : 'text-gray-600'}`}>
            <span>Used:</span>
            <span>{usedSessions}</span>
          </div>
          <div className={`flex justify-between text-xs ${darkMode ? 'text-purple-100' : 'text-gray-600'}`}>
            <span>Confirmed Appointments:</span>
            <span>{confirmedAppointments}</span>
          </div>
          <div className={`flex justify-between text-xs ${darkMode ? 'text-purple-100' : 'text-gray-600'}`}>
            <span>Available Bookings:</span>
            <span className={canBook ? (darkMode ? "text-green-200" : "text-green-600") : (darkMode ? "text-red-200" : "text-red-600")}>
              {Math.max(0, sessionsRemaining - confirmedAppointments)}
            </span>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className={`text-xs mt-2 font-medium ${darkMode ? 'text-purple-100' : getStatusColor()}`}>{bookingMessage}</div>
    </div>
  );
};

export default SessionLimitIndicator;
