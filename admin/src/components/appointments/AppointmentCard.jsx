import React from "react";
import { formatDate, formatPhoneNumber } from "../../shared/utils/formatters";

const AppointmentCard = ({
  appointment,
  onSelect,
  isSelected,
  onToggleSelect,
  showSelection = false,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "completed":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-200";
      case "rescheduled":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "scheduled":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "completed":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "cancelled":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const isUpcoming = () => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    return appointmentDate > now;
  };

  const isToday = () => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    return (
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative bg-white border rounded-xl md:rounded-2xl p-3 md:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isSelected
          ? "border-primary-300 bg-primary-50/50 shadow-md ring-2 ring-primary-100"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Mobile Layout - Compact & Information Dense */}
      <div className="md:hidden">
        <div className="flex items-start gap-2.5">
          {/* Selection Checkbox */}
          {showSelection && (
            <div className="flex items-center pt-0.5">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(appointment);
                }}
                className="h-4 w-4 rounded border-2 border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-1 transition-all duration-200"
              />
            </div>
          )}

          {/* Patient Avatar with Status Indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
              <span className="text-primary-700 font-bold text-base">
                {appointment.userId?.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            {isToday() && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border border-white"></div>
            )}
          </div>

          {/* Main Content - Compact */}
          <div className="flex-1 min-w-0">
            {/* Name and Date Row */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-bold text-gray-900 truncate leading-tight">
                {appointment.userId?.name || "Unknown Patient"}
              </h3>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {new Date(appointment.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-[10px] font-semibold text-primary-600 leading-tight">
                  {appointment.timeSlot}
                </p>
              </div>
            </div>

            {/* Status and Phone Row */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold gap-0.5 ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </span>
                {isToday() && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-100 text-orange-800">
                    Today
                  </span>
                )}
                {appointment.sessionNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                    S#{appointment.sessionNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Phone Number Row */}
            <div className="flex items-center gap-1.5 text-gray-600 mb-2">
              <svg
                className="w-3 h-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span className="text-xs font-medium truncate">
                {formatPhoneNumber(appointment.userId?.phone)}
              </span>
            </div>

            {/* Quick Info Tags */}
            {(appointment.notes || appointment.rescheduleHistory?.length > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {appointment.notes && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Notes
                  </span>
                )}
                {appointment.rescheduleHistory?.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    {appointment.rescheduleHistory.length}x
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              {/* Selection Checkbox */}
              {showSelection && (
                <div className="flex items-center pt-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect(appointment);
                    }}
                    className="h-5 w-5 rounded-lg border-2 border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 transition-all duration-200"
                  />
                </div>
              )}

              {/* Patient Avatar */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-primary-700 font-bold text-xl">
                    {appointment.userId?.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                {isToday() && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Consultation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {appointment.userId?.name || "Unknown Patient"}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold gap-1.5 ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusIcon(appointment.status)}
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>
                      {isToday() && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold bg-orange-100 text-orange-800">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <span className="font-medium">
                      {formatPhoneNumber(appointment.userId?.phone)}
                    </span>
                  </div>
                  {appointment.userId?.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <span className="font-medium truncate">
                        {appointment.userId?.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Details & Actions */}
          <div className="flex flex-col items-end gap-4 ml-4">
            {/* Date & Time */}
            <div className="text-right">
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-lg font-bold text-gray-900 mb-1">
                  {formatDate(appointment.date)}
                </p>
                <p className="text-sm font-semibold text-primary-600">
                  {appointment.timeSlot}
                </p>
                {appointment.sessionNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    Session #{appointment.sessionNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="inline-flex items-center px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Additional Info Footer */}
      {(appointment.notes || appointment.rescheduleHistory?.length > 0) && (
        <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-100">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              {appointment.notes && (
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 bg-blue-50 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg">
                  <svg
                    className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">Notes</span>
                </div>
              )}
              {appointment.rescheduleHistory?.length > 0 && (
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-amber-700 bg-amber-50 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg">
                  <svg
                    className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">
                    Rescheduled {appointment.rescheduleHistory.length}x
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg whitespace-nowrap">
              Created: {formatDate(appointment.createdAt)}
            </div>
          </div>
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default AppointmentCard;
