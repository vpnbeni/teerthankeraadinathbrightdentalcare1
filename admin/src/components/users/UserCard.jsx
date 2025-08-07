import React from "react";
import {
  formatDate,
  formatPhoneNumber,
  formatCurrency,
} from "../../shared/utils/formatters";

const UserCard = ({ user, onSelect, onEdit }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanName = (planId) => {
    // This would typically come from a plans lookup
    const planNames = {
      "6-sessions": "6 Sessions Plan",
      "8-sessions": "8 Sessions Plan",
      "12-sessions": "12 Sessions Plan",
    };
    return planNames[planId] || "Unknown Plan";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    user.subscription?.status
                  )}`}
                >
                  {user.subscription?.status || "No Plan"}
                </span>
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {formatPhoneNumber(user.phone)}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="text-right">
          {user.subscription && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {getPlanName(user.subscription.planId)}
              </p>
              <p className="text-xs text-gray-600">
                {user.subscription.sessionsRemaining}/
                {user.subscription.totalSessions} sessions left
              </p>
              <p className="text-xs text-gray-600">
                Expires: {formatDate(user.subscription.endDate)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="px-3 py-1 text-sm font-medium text-[#346870] bg-white border border-[#346870] rounded-md hover:bg-[#346870] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
          >
            View
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-1 text-sm font-medium text-white bg-[#346870] border border-[#346870] rounded-md hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870]"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Additional Info Row */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Joined: {formatDate(user.createdAt)}</span>
            {user.lastLoginAt && (
              <span>Last login: {formatDate(user.lastLoginAt)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user.isVerified ? (
              <span className="flex items-center gap-1 text-green-600">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-600">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Unverified
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
