import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoadingSpinner } from "../../shared/components";
import { formatDate, formatCurrency } from "../../shared/utils/formatters";
import { toast } from "react-hot-toast";
import ExtendSubscriptionModal from "./ExtendSubscriptionModal";
import ChangePlanModal from "./ChangePlanModal";
import CancelSubscriptionModal from "./CancelSubscriptionModal";
import SubscriptionAnalytics from "./SubscriptionAnalytics";
import {
  CreditCardIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const SubscriptionManager = ({ user, onSubscriptionUpdate }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const subscription = user?.subscription || {};
  const hasActiveSubscription = subscription.status === "active";

  useEffect(() => {
    if (user?.subscription) {
      setSubscriptionData(user.subscription);
      checkSubscriptionAlerts();
    }
  }, [user]);

  const checkSubscriptionAlerts = () => {
    const alerts = [];
    const subscription = user.subscription;

    if (!subscription) return;

    // Check expiration alerts
    const daysUntilExpiry = getDaysRemaining();
    if (
      daysUntilExpiry !== null &&
      daysUntilExpiry <= 7 &&
      daysUntilExpiry > 0
    ) {
      alerts.push({
        type: "warning",
        title: "Subscription Expiring Soon",
        message: `Expires in ${daysUntilExpiry} day${
          daysUntilExpiry !== 1 ? "s" : ""
        }`,
        action: "extend",
      });
    }

    // Check session alerts
    if (
      subscription.sessionsRemaining <= 2 &&
      subscription.sessionsRemaining > 0
    ) {
      alerts.push({
        type: "warning",
        title: "Low Session Count",
        message: `Only ${subscription.sessionsRemaining} session${
          subscription.sessionsRemaining !== 1 ? "s" : ""
        } remaining`,
        action: "extend",
      });
    }

    // Check expired subscription
    if (subscription.status === "expired") {
      alerts.push({
        type: "error",
        title: "Subscription Expired",
        message: "This subscription has expired and needs renewal",
        action: "renew",
      });
    }

    setNotifications(alerts);
  };

  const getDaysRemaining = () => {
    if (!subscription.endDate) return null;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "expired":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "suspended":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case "cancelled":
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleModalOpen = (modalType) => {
    setActiveModal(modalType);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handleSubscriptionAction = async (action, data) => {
    setLoading(true);
    try {
      // This would call the appropriate API endpoint based on the action
      switch (action) {
        case "extend":
          await handleExtendSubscription(data);
          break;
        case "changePlan":
          await handleChangePlan(data);
          break;
        case "cancel":
          await handleCancelSubscription(data);
          break;
        default:
          throw new Error("Unknown action");
      }

      toast.success("Subscription updated successfully");
      if (onSubscriptionUpdate) onSubscriptionUpdate();
      handleModalClose();
    } catch (error) {
      toast.error(error.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async (extensionData) => {
    // Implementation would call API to extend subscription
    console.log("Extending subscription:", extensionData);
  };

  const handleChangePlan = async (planData) => {
    // Implementation would call API to change plan
    console.log("Changing plan:", planData);
  };

  const handleCancelSubscription = async (cancellationData) => {
    // Implementation would call API to cancel subscription
    console.log("Cancelling subscription:", cancellationData);
  };

  const calculateUtilization = () => {
    if (!subscription.totalSessions) return 0;
    const used =
      subscription.totalSessions - (subscription.sessionsRemaining || 0);
    return (used / subscription.totalSessions) * 100;
  };

  const utilization = calculateUtilization();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 ${
                notification.type === "error"
                  ? "bg-red-50 border border-red-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <BellIcon
                  className={`h-5 w-5 mt-0.5 ${
                    notification.type === "error"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                />
                <div className="flex-1">
                  <h4
                    className={`text-sm font-medium ${
                      notification.type === "error"
                        ? "text-red-800"
                        : "text-yellow-800"
                    }`}
                  >
                    {notification.title}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      notification.type === "error"
                        ? "text-red-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => handleModalOpen(notification.action)}
                  className={`text-sm font-medium ${
                    notification.type === "error"
                      ? "text-red-800 hover:text-red-900"
                      : "text-yellow-800 hover:text-yellow-900"
                  }`}
                >
                  {notification.action === "extend" ? "Extend" : "Renew"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subscription Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Subscription Overview
          </h3>
          <div className="flex items-center gap-2">
            {getStatusIcon(subscription.status)}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                subscription.status
              )}`}
            >
              {subscription.status || "No Plan"}
            </span>
          </div>
        </div>

        {subscription.status ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Plan Type
                </label>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {subscription.planType || "Standard Plan"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Amount Paid
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.amount
                    ? formatCurrency(subscription.amount)
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Start Date
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.startDate
                    ? formatDate(subscription.startDate)
                    : "N/A"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  End Date
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.endDate
                    ? formatDate(subscription.endDate)
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Sessions Remaining
                </label>
                <p className="text-2xl font-bold text-[#346870]">
                  {subscription.sessionsRemaining || 0}
                  <span className="text-sm font-normal text-gray-500">
                    /{subscription.totalSessions || 0}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Utilization
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#346870] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${utilization}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {utilization.toFixed(1)}% used
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No Active Subscription
            </h4>
            <p className="text-gray-500 mb-4">
              This user doesn't have an active subscription plan.
            </p>
          </div>
        )}
      </div>

      {/* Management Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Subscription Management
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleModalOpen("extend")}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <PlusIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-left">
              <h5 className="font-medium text-gray-900">Extend Subscription</h5>
              <p className="text-sm text-gray-500">Add more time or sessions</p>
            </div>
          </button>

          <button
            onClick={() => handleModalOpen("changePlan")}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowPathIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h5 className="font-medium text-gray-900">Change Plan</h5>
              <p className="text-sm text-gray-500">Upgrade or modify plan</p>
            </div>
          </button>

          {hasActiveSubscription && (
            <button
              onClick={() => handleModalOpen("cancel")}
              disabled={loading}
              className="flex items-center justify-center gap-3 p-4 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left">
                <h5 className="font-medium text-red-900">
                  Cancel Subscription
                </h5>
                <p className="text-sm text-red-600">End current subscription</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Analytics */}
      {subscription.status && (
        <SubscriptionAnalytics subscription={subscription} user={user} />
      )}

      {/* Modals */}
      {activeModal === "extend" && (
        <ExtendSubscriptionModal
          subscription={subscription}
          onClose={handleModalClose}
          onExtend={(data) => handleSubscriptionAction("extend", data)}
          loading={loading}
        />
      )}

      {activeModal === "changePlan" && (
        <ChangePlanModal
          subscription={subscription}
          onClose={handleModalClose}
          onChange={(data) => handleSubscriptionAction("changePlan", data)}
          loading={loading}
        />
      )}

      {activeModal === "cancel" && (
        <CancelSubscriptionModal
          subscription={subscription}
          onClose={handleModalClose}
          onCancel={(data) => handleSubscriptionAction("cancel", data)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default SubscriptionManager;
