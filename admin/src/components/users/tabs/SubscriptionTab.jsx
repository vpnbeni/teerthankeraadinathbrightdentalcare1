import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateUser } from "../../../store/userSlice";
import { LoadingSpinner } from "../../../shared/components";
import { formatDate, formatCurrency } from "../../../shared/utils/formatters";
import { toast } from "react-hot-toast";
import {
  CreditCardIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

const SubscriptionTab = ({ user, onUserUpdate }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const subscription = user.subscription || {};
  const hasActiveSubscription = subscription.status === "active";

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
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const calculateProgress = () => {
    if (!subscription.totalSessions) return 0;
    const used =
      subscription.totalSessions - (subscription.sessionsRemaining || 0);
    return (used / subscription.totalSessions) * 100;
  };

  const getDaysRemaining = () => {
    if (!subscription.endDate) return null;
    const endDate = new Date(subscription.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExtendSubscription = async (extensionData) => {
    setLoading(true);
    try {
      // This would typically call a specific API endpoint for subscription extension
      await dispatch(
        updateUser({
          userId: user._id,
          userData: {
            subscription: {
              ...subscription,
              endDate: extensionData.newEndDate,
              sessionsRemaining:
                subscription.sessionsRemaining +
                extensionData.additionalSessions,
              totalSessions:
                subscription.totalSessions + extensionData.additionalSessions,
            },
          },
        })
      ).unwrap();

      toast.success("Subscription extended successfully");
      setShowExtendModal(false);
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      toast.error(error || "Failed to extend subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (planData) => {
    setLoading(true);
    try {
      await dispatch(
        updateUser({
          userId: user._id,
          userData: {
            subscription: {
              ...subscription,
              planType: planData.planType,
              totalSessions: planData.totalSessions,
              sessionsRemaining: planData.sessionsRemaining,
            },
          },
        })
      ).unwrap();

      toast.success("Subscription plan changed successfully");
      setShowChangePlanModal(false);
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      toast.error(error || "Failed to change subscription plan");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (cancellationData) => {
    setLoading(true);
    try {
      await dispatch(
        updateUser({
          userId: user._id,
          userData: {
            subscription: {
              ...subscription,
              status: "cancelled",
              cancelledAt: new Date().toISOString(),
              cancellationReason: cancellationData.reason,
            },
          },
        })
      ).unwrap();

      toast.success("Subscription cancelled successfully");
      setShowCancelModal(false);
      if (onUserUpdate) onUserUpdate();
    } catch (error) {
      toast.error(error || "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = getDaysRemaining();
  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Subscription Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getStatusIcon(subscription.status)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    subscription.status
                  )}`}
                >
                  {subscription.status || "No Plan"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sessions Left</p>
              <p className="text-2xl font-bold text-green-600">
                {subscription.sessionsRemaining || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Days Left</p>
              <p className="text-2xl font-bold text-yellow-600">
                {daysRemaining !== null ? Math.max(0, daysRemaining) : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Management Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Subscription Management
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowExtendModal(true)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Extend Subscription
          </button>
          <button
            onClick={() => setShowChangePlanModal(true)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Change Plan
          </button>
          {hasActiveSubscription && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Subscription Details */}
      {subscription.status ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Subscription Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Plan Type
                </label>
                <p className="text-gray-900 capitalize">
                  {subscription.planType || "Standard Plan"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Start Date
                </label>
                <p className="text-gray-900">
                  {subscription.startDate
                    ? formatDate(subscription.startDate)
                    : "N/A"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  End Date
                </label>
                <p className="text-gray-900">
                  {subscription.endDate
                    ? formatDate(subscription.endDate)
                    : "N/A"}
                </p>
              </div>

              {subscription.amount && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Amount Paid
                  </label>
                  <p className="text-gray-900">
                    {formatCurrency(subscription.amount)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Total Sessions
                </label>
                <p className="text-gray-900">
                  {subscription.totalSessions || 0}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Sessions Used
                </label>
                <p className="text-gray-900">
                  {(subscription.totalSessions || 0) -
                    (subscription.sessionsRemaining || 0)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Sessions Remaining
                </label>
                <p className="text-gray-900">
                  {subscription.sessionsRemaining || 0}
                </p>
              </div>

              {/* Progress Bar */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Usage Progress
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#346870] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.toFixed(1)}% used
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {daysRemaining !== null &&
            daysRemaining <= 7 &&
            daysRemaining > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-yellow-800">
                      Subscription Expiring Soon
                    </h5>
                    <p className="text-sm text-yellow-700 mt-1">
                      This subscription will expire in {daysRemaining} day
                      {daysRemaining !== 1 ? "s" : ""}. Consider extending or
                      renewing the plan.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {subscription.sessionsRemaining <= 2 &&
            subscription.sessionsRemaining > 0 && (
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-medium text-orange-800">
                      Low Session Count
                    </h5>
                    <p className="text-sm text-orange-700 mt-1">
                      Only {subscription.sessionsRemaining} session
                      {subscription.sessionsRemaining !== 1 ? "s" : ""}{" "}
                      remaining. Consider adding more sessions or upgrading the
                      plan.
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No Active Subscription
          </h4>
          <p className="text-gray-500 mb-4">
            This user doesn't have an active subscription plan.
          </p>
          <button
            onClick={() => setShowChangePlanModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5359]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Subscription Plan
          </button>
        </div>
      )}

      {/* Modals would be implemented here */}
      {showExtendModal && (
        <ExtendSubscriptionModal
          subscription={subscription}
          onClose={() => setShowExtendModal(false)}
          onExtend={handleExtendSubscription}
          loading={loading}
        />
      )}

      {showChangePlanModal && (
        <ChangePlanModal
          subscription={subscription}
          onClose={() => setShowChangePlanModal(false)}
          onChange={handleChangePlan}
          loading={loading}
        />
      )}

      {showCancelModal && (
        <CancelSubscriptionModal
          subscription={subscription}
          onClose={() => setShowCancelModal(false)}
          onCancel={handleCancelSubscription}
          loading={loading}
        />
      )}
    </div>
  );
};

// Placeholder modal components - these would be fully implemented
const ExtendSubscriptionModal = ({
  subscription,
  onClose,
  onExtend,
  loading,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Extend Subscription
      </h3>
      <p className="text-gray-600 mb-4">
        Extend subscription functionality will be implemented here.
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onExtend({ newEndDate: new Date(), additionalSessions: 5 })
          }
          disabled={loading}
          className="px-4 py-2 bg-[#346870] text-white rounded-md hover:bg-[#2a5359] disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Extend"}
        </button>
      </div>
    </div>
  </div>
);

const ChangePlanModal = ({ subscription, onClose, onChange, loading }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Plan</h3>
      <p className="text-gray-600 mb-4">
        Change plan functionality will be implemented here.
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onChange({
              planType: "premium",
              totalSessions: 10,
              sessionsRemaining: 10,
            })
          }
          disabled={loading}
          className="px-4 py-2 bg-[#346870] text-white rounded-md hover:bg-[#2a5359] disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Change Plan"}
        </button>
      </div>
    </div>
  </div>
);

const CancelSubscriptionModal = ({
  subscription,
  onClose,
  onCancel,
  loading,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Cancel Subscription
      </h3>
      <p className="text-gray-600 mb-4">
        Are you sure you want to cancel this subscription? This action cannot be
        undone.
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Keep Subscription
        </button>
        <button
          onClick={() => onCancel({ reason: "Admin cancellation" })}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Cancel Subscription"}
        </button>
      </div>
    </div>
  </div>
);

export default SubscriptionTab;
