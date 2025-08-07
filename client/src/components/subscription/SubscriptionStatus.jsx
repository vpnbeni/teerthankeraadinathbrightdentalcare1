import React, { useState, useEffect } from "react";
import plansService from "../../services/plans";

const SubscriptionStatus = ({ subscription, onUpgrade }) => {
  const [planDetails, setPlanDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch plan details when subscription changes
  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (subscription?.planId && typeof subscription.planId === "string") {
        setLoading(true);
        try {
          const response = await plansService.getPlan(subscription.planId);
          setPlanDetails(response.data);
        } catch (error) {
          console.error("Failed to fetch plan details:", error);
          setPlanDetails(null);
        } finally {
          setLoading(false);
        }
      } else if (subscription?.planId && typeof subscription.planId === "object") {
        // If planId is already populated with plan details
        setPlanDetails(subscription.planId);
      }
    };

    fetchPlanDetails();
  }, [subscription?.planId]);

  // Handle case where subscription is not loaded or doesn't exist
  if (!subscription) {
    return (
      <div className="card">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-600 mb-4">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <button onClick={onUpgrade} className="btn-primary px-6 py-2">
            Choose Plan
          </button>
        </div>
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
      case "suspended":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "expired":
        return (
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "suspended":
        return (
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
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // Calculate total sessions from plan details or use fallback
  const getTotalSessions = () => {
    if (planDetails?.sessions) {
      return planDetails.sessions;
    }
    // Fallback: estimate from sessions remaining and usage pattern
    const sessionsRemaining = subscription.sessionsRemaining || 0;
    // If we don't have plan details, we can't accurately calculate total
    // So we'll use a reasonable estimate or return 0
    return subscription.totalSessions || sessionsRemaining;
  };

  const calculateProgress = () => {
    const totalSessions = getTotalSessions();
    const sessionsRemaining = subscription.sessionsRemaining || 0;
    const used = totalSessions - sessionsRemaining;
    return totalSessions > 0 ? (used / totalSessions) * 100 : 0;
  };

  const getDaysRemaining = () => {
    if (!subscription.endDate) return 0;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isExpiringSoon = () => {
    return getDaysRemaining() <= 30 && subscription.status === "active";
  };

  // Get plan name with fallback
  const getPlanName = () => {
    if (loading) return "Loading...";
    if (planDetails?.name) return planDetails.name;
    if (typeof subscription.planId === "object" && subscription.planId?.name) {
      return subscription.planId.name;
    }
    return "Unknown Plan";
  };

  const totalSessions = getTotalSessions();
  const sessionsUsed = totalSessions - (subscription.sessionsRemaining || 0);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Subscription Status
          </h2>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
              subscription.status
            )}`}
          >
            {getStatusIcon(subscription.status)}
            <span className="ml-2 capitalize">{subscription.status}</span>
          </div>
        </div>

        {/* Plan Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Plan Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{getPlanName()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sessions:</span>
                <span className="font-medium">{totalSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">
                  {subscription.startDate
                    ? formatDate(subscription.startDate)
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium">
                  {subscription.endDate
                    ? formatDate(subscription.endDate)
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-3">Usage Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions Remaining:</span>
                <span className="font-medium text-[#346870]">
                  {subscription.sessionsRemaining || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sessions Used:</span>
                <span className="font-medium">{sessionsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days Remaining:</span>
                <span
                  className={`font-medium ${
                    isExpiringSoon() ? "text-yellow-600" : ""
                  }`}
                >
                  {getDaysRemaining()} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <h3 className="font-medium text-gray-800 mb-3">Session Usage</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {sessionsUsed} of {totalSessions} sessions used
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-[#346870] h-3 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {subscription.sessionsRemaining || 0} sessions remaining
          </div>
        </div>
      </div>

      {/* Alerts */}
      {subscription.status === "expired" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
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
              <h4 className="font-medium text-red-800">Subscription Expired</h4>
              <p className="text-red-700 text-sm mt-1">
                Your subscription has expired. Renew now to continue accessing
                our services.
              </p>
              <button
                onClick={onUpgrade}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Renew Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {subscription.status === "suspended" && (
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
                Subscription Suspended
              </h4>
              <p className="text-yellow-700 text-sm mt-1">
                Your subscription is currently suspended. Please complete your
                payment to reactivate.
              </p>
              <button
                onClick={onUpgrade}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpiringSoon() && (
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
                Subscription Expiring Soon
              </h4>
              <p className="text-yellow-700 text-sm mt-1">
                Your subscription expires in {getDaysRemaining()} days. Renew
                now to avoid service interruption.
              </p>
              <button
                onClick={onUpgrade}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Renew Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Option */}
      {/* {subscription.status === "active" && !isExpiringSoon() && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Want More Sessions?</h3>
              <p className="text-gray-600 text-sm mt-1">
                Upgrade your plan to get more sessions and additional benefits.
              </p>
            </div>
            <button onClick={onUpgrade} className="btn-primary px-6 py-2">
              Upgrade Plan
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default SubscriptionStatus;
