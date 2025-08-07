import React from "react";

const SubscriptionInfo = ({ subscription }) => {
  if (!subscription) {
    return (
      <div className="text-center py-8">
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
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-800 mb-2">
          No Active Subscription
        </h4>
        <p className="text-gray-600 mb-4">
          You don't have any active subscription plan.
        </p>
        <button
          onClick={() => (window.location.href = "/plans")}
          className="btn-primary px-6 py-2"
        >
          View Available Plans
        </button>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Details */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            {subscription.planId.name}
          </h4>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
              subscription.status
            )}`}
          >
            {subscription.status.charAt(0).toUpperCase() +
              subscription.status.slice(1)}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Start Date:</span>
            <div className="font-medium">
              {formatDate(subscription.startDate)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">End Date:</span>
            <div className="font-medium">
              {formatDate(subscription.endDate)}
            </div>
          </div>
          <div>
            <span className="text-gray-600">Sessions Remaining:</span>
            <div className="font-medium">{subscription.sessionsRemaining}</div>
          </div>
          <div>
            <span className="text-gray-600">Total Sessions:</span>
            <div className="font-medium">{subscription.planId.sessions}</div>
          </div>
        </div>
      </div>

      {/* Plan Features */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Plan Features
        </h4>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b">
            <div className="flex items-center text-sm">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
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
              <span>{subscription.planId.sessions} Dental Sessions</span>
            </div>
          </div>
          <div className="p-4 border-b">
            <div className="flex items-center text-sm">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
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
              <span>{subscription.planId.duration} Months Validity</span>
            </div>
          </div>
          {subscription.planId.features?.map((feature, index) => (
            <div key={index} className="p-4 border-b last:border-b-0">
              <div className="flex items-center text-sm">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
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
                <span>{feature}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Button */}
      {subscription.status === "active" && (
        <div className="flex justify-end">
          <button
            onClick={() => (window.location.href = "/plans")}
            className="btn-secondary px-6 py-2"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Renewal Button */}
      {(subscription.status === "expired" ||
        subscription.status === "cancelled") && (
        <div className="flex justify-end">
          <button
            onClick={() => (window.location.href = "/plans")}
            className="btn-primary px-6 py-2"
          >
            Renew Subscription
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionInfo;
