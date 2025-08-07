import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";
import { formatDate, formatCurrency } from "../../shared/utils/formatters";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const CancelSubscriptionModal = ({
  subscription,
  onClose,
  onCancel,
  loading,
}) => {
  const [formData, setFormData] = useState({
    reason: "",
    customReason: "",
    refundOption: "partial", // "none", "partial", "full"
    effectiveDate: "immediate", // "immediate", "end_of_period"
    sendNotification: true,
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  const cancellationReasons = [
    { value: "financial_constraints", label: "Financial constraints" },
    { value: "treatment_completed", label: "Treatment completed early" },
    { value: "unsatisfied_service", label: "Unsatisfied with service" },
    { value: "moving_location", label: "Moving to different location" },
    { value: "health_issues", label: "Health issues preventing treatment" },
    { value: "found_alternative", label: "Found alternative provider" },
    { value: "other", label: "Other (please specify)" },
  ];

  const refundOptions = [
    {
      value: "none",
      label: "No Refund",
      description: "Cancel without any refund",
    },
    {
      value: "partial",
      label: "Partial Refund",
      description: "Refund for unused sessions only",
    },
    {
      value: "full",
      label: "Full Refund",
      description: "Full refund of subscription amount",
    },
  ];

  const calculateRefundAmount = () => {
    if (!subscription.amount || !subscription.totalSessions) return 0;

    const sessionValue = subscription.amount / subscription.totalSessions;
    const unusedSessions = subscription.sessionsRemaining || 0;

    switch (formData.refundOption) {
      case "full":
        return subscription.amount;
      case "partial":
        return sessionValue * unusedSessions;
      case "none":
      default:
        return 0;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reason) {
      newErrors.reason = "Please select a cancellation reason";
    }

    if (formData.reason === "other" && !formData.customReason.trim()) {
      newErrors.customReason = "Please specify the reason";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setShowConfirmation(true);
  };

  const handleConfirmCancel = () => {
    const cancellationData = {
      ...formData,
      refundAmount: calculateRefundAmount(),
      subscription,
      cancelledAt: new Date().toISOString(),
    };

    onCancel(cancellationData);
  };

  const refundAmount = calculateRefundAmount();
  const effectiveDate =
    formData.effectiveDate === "immediate"
      ? new Date()
      : new Date(subscription.endDate);

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Cancellation
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                Are you sure you want to cancel this subscription? This action
                cannot be undone.
              </p>

              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">
                  Cancellation Summary
                </h4>
                <div className="space-y-1 text-sm text-red-800">
                  <div className="flex justify-between">
                    <span>Effective Date:</span>
                    <span>{formatDate(effectiveDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sessions Lost:</span>
                    <span>{subscription.sessionsRemaining || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(refundAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Cancelling...</span>
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cancel Subscription
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[75vh]"
        >
          <div className="space-y-6">
            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Important Notice
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Cancelling this subscription will immediately stop all
                    services and may result in loss of unused sessions. Please
                    review the refund options carefully.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Subscription Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Current Subscription Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Plan Type:</span>
                  <span className="ml-2 font-medium capitalize">
                    {subscription.planType || "Standard Plan"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Sessions Remaining:</span>
                  <span className="ml-2 font-medium">
                    {subscription.sessionsRemaining || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">End Date:</span>
                  <span className="ml-2 font-medium">
                    {subscription.endDate
                      ? formatDate(subscription.endDate)
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Amount Paid:</span>
                  <span className="ml-2 font-medium">
                    {subscription.amount
                      ? formatCurrency(subscription.amount)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Reason for Cancellation *
              </label>
              <div className="space-y-2">
                {cancellationReasons.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={formData.reason === reason.value}
                      onChange={(e) =>
                        handleInputChange("reason", e.target.value)
                      }
                      className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.reason && (
                <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Custom Reason */}
            {formData.reason === "other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Please specify the reason *
                </label>
                <textarea
                  value={formData.customReason}
                  onChange={(e) =>
                    handleInputChange("customReason", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                  placeholder="Please provide details about your reason for cancellation..."
                />
                {errors.customReason && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.customReason}
                  </p>
                )}
              </div>
            )}

            {/* Refund Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Refund Option
              </label>
              <div className="space-y-3">
                {refundOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.refundOption === option.value
                        ? "border-[#346870] bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundOption"
                      value={option.value}
                      checked={formData.refundOption === option.value}
                      onChange={(e) =>
                        handleInputChange("refundOption", e.target.value)
                      }
                      className="mt-1 h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                        {formData.refundOption === option.value && (
                          <span className="font-bold text-[#346870]">
                            {formatCurrency(calculateRefundAmount())}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cancellation Effective Date
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="effectiveDate"
                    value="immediate"
                    checked={formData.effectiveDate === "immediate"}
                    onChange={(e) =>
                      handleInputChange("effectiveDate", e.target.value)
                    }
                    className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Immediate
                    </span>
                    <p className="text-xs text-gray-500">
                      Cancel subscription right now
                    </p>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="effectiveDate"
                    value="end_of_period"
                    checked={formData.effectiveDate === "end_of_period"}
                    onChange={(e) =>
                      handleInputChange("effectiveDate", e.target.value)
                    }
                    className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      End of Current Period
                    </span>
                    <p className="text-xs text-gray-500">
                      Cancel at the end of subscription period (
                      {formatDate(subscription.endDate)})
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                placeholder="Any additional information about the cancellation..."
              />
            </div>

            {/* Notification Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendNotification"
                checked={formData.sendNotification}
                onChange={(e) =>
                  handleInputChange("sendNotification", e.target.checked)
                }
                className="h-4 w-4 text-[#346870] focus:ring-[#346870] border-gray-300 rounded"
              />
              <label
                htmlFor="sendNotification"
                className="ml-2 text-sm text-gray-700"
              >
                Send email notification to patient about subscription
                cancellation
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
            >
              Keep Subscription
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Proceed to Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelSubscriptionModal;
