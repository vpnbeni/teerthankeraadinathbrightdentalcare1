import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const NotificationCenter = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    generateNotifications();
  }, [user]);

  const generateNotifications = () => {
    const newNotifications = [];
    const now = new Date();

    if (user?.subscription) {
      // Check for expiring subscription
      if (user.subscription.endDate) {
        const endDate = new Date(user.subscription.endDate);
        const daysUntilExpiry = Math.ceil(
          (endDate - now) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          newNotifications.push({
            id: "subscription-expiry",
            type: "warning",
            title: "Subscription Expiring Soon",
            message: `Your subscription expires in ${daysUntilExpiry} days. Renew now to avoid interruption.`,
            action: "Renew Plan",
            actionUrl: "/payments",
            timestamp: now,
          });
        } else if (daysUntilExpiry <= 0) {
          newNotifications.push({
            id: "subscription-expired",
            type: "error",
            title: "Subscription Expired",
            message:
              "Your subscription has expired. Renew to continue accessing services.",
            action: "Renew Now",
            actionUrl: "/payments",
            timestamp: now,
          });
        }
      }

      // Check for low session count
      if (
        user.subscription.sessionsRemaining <= 2 &&
        user.subscription.sessionsRemaining > 0
      ) {
        newNotifications.push({
          id: "low-sessions",
          type: "warning",
          title: "Few Sessions Remaining",
          message: `You have only ${user.subscription.sessionsRemaining} sessions left in your plan.`,
          action: "Upgrade Plan",
          actionUrl: "/payments",
          timestamp: now,
        });
      }
    }

    // Check for incomplete profile
    if (!user?.email || !user?.address) {
      newNotifications.push({
        id: "incomplete-profile",
        type: "info",
        title: "Complete Your Profile",
        message: "Add your email and address to receive important updates.",
        action: "Update Profile",
        actionUrl: "/profile",
        timestamp: now,
      });
    }

    // Check for missing documents
    if (!user?.documents || user.documents.length === 0) {
      newNotifications.push({
        id: "missing-documents",
        type: "info",
        title: "Upload Documents",
        message:
          "Upload your ID proof and medical records for faster check-ins.",
        action: "Upload Now",
        actionUrl: "/profile",
        timestamp: now,
      });
    }

    setNotifications(newNotifications);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "error":
        return "🚨";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      case "info":
      default:
        return "ℹ️";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter((n) => n.id !== notificationId));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#346870] rounded-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-3.5-3.5a50.002 50.002 0 00-2.5-2.5V9a6 6 0 10-12 0v1.5c0 .9-.4 1.8-1 2.5L1 17h5m9 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Notifications
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 last:border-b-0 ${getNotificationColor(
                  notification.type
                )}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-sm mt-1 opacity-90">
                          {notification.message}
                        </p>
                        {notification.action && (
                          <a
                            href={notification.actionUrl}
                            className="inline-block mt-2 text-sm font-medium underline hover:no-underline"
                          >
                            {notification.action}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
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
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setNotifications([])}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
