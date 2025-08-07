import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";
import { formatDate, formatCurrency } from "../../shared/utils/formatters";
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const ExtendSubscriptionModal = ({
  subscription,
  onClose,
  onExtend,
  loading,
}) => {
  const [formData, setFormData] = useState({
    extensionType: "sessions", // "sessions" or "time" or "both"
    additionalSessions: 5,
    additionalDays: 30,
    customEndDate: "",
    amount: 0,
    paymentMethod: "cash",
    notes: "",
    sendNotification: true,
  });
  const [errors, setErrors] = useState({});

  const extensionOptions = [
    {
      value: "sessions",
      label: "Add Sessions Only",
      description: "Add more sessions without changing the end date",
      icon: ClockIcon,
    },
    {
      value: "time",
      label: "Extend Time Only",
      description: "Extend the subscription period without adding sessions",
      icon: CalendarIcon,
    },
    {
      value: "both",
      label: "Add Sessions & Extend Time",
      description: "Add both sessions and extend the subscription period",
      icon: CheckCircleIcon,
    },
  ];

  const sessionPackages = [
    { sessions: 5, price: 2500, popular: false },
    { sessions: 10, price: 4500, popular: true },
    { sessions: 15, price: 6000, popular: false },
    { sessions: 20, price: 7500, popular: false },
  ];

  const timeExtensions = [
    { days: 30, label: "1 Month", price: 1000 },
    { days: 60, label: "2 Months", price: 1800 },
    { days: 90, label: "3 Months", price: 2500 },
    { days: 180, label: "6 Months", price: 4500 },
  ];

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const calculateNewEndDate = () => {
    if (!subscription.endDate) return null;

    const currentEndDate = new Date(subscription.endDate);
    const additionalDays =
      formData.extensionType === "sessions" ? 0 : formData.additionalDays;

    if (formData.customEndDate) {
      return new Date(formData.customEndDate);
    }

    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);
    return newEndDate;
  };

  const calculateTotalCost = () => {
    let cost = 0;

    if (
      formData.extensionType === "sessions" ||
      formData.extensionType === "both"
    ) {
      const sessionPackage = sessionPackages.find(
        (p) => p.sessions === formData.additionalSessions
      );
      cost += sessionPackage
        ? sessionPackage.price
        : formData.additionalSessions * 500;
    }

    if (
      formData.extensionType === "time" ||
      formData.extensionType === "both"
    ) {
      const timeExtension = timeExtensions.find(
        (t) => t.days === formData.additionalDays
      );
      cost += timeExtension
        ? timeExtension.price
        : formData.additionalDays * 35;
    }

    return cost;
  };

  const validateForm = () => {
    const newErrors = {};

    if (
      formData.extensionType === "sessions" ||
      formData.extensionType === "both"
    ) {
      if (!formData.additionalSessions || formData.additionalSessions < 1) {
        newErrors.additionalSessions =
          "Please specify number of sessions to add";
      }
    }

    if (
      formData.extensionType === "time" ||
      formData.extensionType === "both"
    ) {
      if (!formData.additionalDays && !formData.customEndDate) {
        newErrors.additionalDays = "Please specify extension period";
      }
    }

    if (!formData.amount || formData.amount < 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const extensionData = {
      ...formData,
      newEndDate: calculateNewEndDate(),
      totalCost: calculateTotalCost(),
      currentSubscription: subscription,
    };

    onExtend(extensionData);
  };

  const newEndDate = calculateNewEndDate();
  const totalCost = calculateTotalCost();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Extend Subscription
          </h3>
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
            {/* Current Subscription Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Current Subscription
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
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
              </div>
            </div>

            {/* Extension Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Extension Type
              </label>
              <div className="space-y-3">
                {extensionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.extensionType === option.value
                          ? "border-[#346870] bg-blue-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="extensionType"
                        value={option.value}
                        checked={formData.extensionType === option.value}
                        onChange={(e) =>
                          handleInputChange("extensionType", e.target.value)
                        }
                        className="mt-1"
                      />
                      <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sessions Extension */}
            {(formData.extensionType === "sessions" ||
              formData.extensionType === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Additional Sessions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sessionPackages.map((pkg) => (
                    <label
                      key={pkg.sessions}
                      className={`relative flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.additionalSessions === pkg.sessions
                          ? "border-[#346870] bg-blue-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="additionalSessions"
                        value={pkg.sessions}
                        checked={formData.additionalSessions === pkg.sessions}
                        onChange={(e) =>
                          handleInputChange(
                            "additionalSessions",
                            parseInt(e.target.value)
                          )
                        }
                        className="sr-only"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {pkg.sessions} Sessions
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(pkg.price)}
                        </div>
                      </div>
                      {pkg.popular && (
                        <span className="absolute -top-2 -right-2 bg-[#346870] text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="number"
                    placeholder="Custom number of sessions"
                    value={formData.additionalSessions}
                    onChange={(e) =>
                      handleInputChange(
                        "additionalSessions",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                    min="1"
                    max="50"
                  />
                </div>
                {errors.additionalSessions && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.additionalSessions}
                  </p>
                )}
              </div>
            )}

            {/* Time Extension */}
            {(formData.extensionType === "time" ||
              formData.extensionType === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Extension
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {timeExtensions.map((ext) => (
                    <label
                      key={ext.days}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.additionalDays === ext.days
                          ? "border-[#346870] bg-blue-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="additionalDays"
                        value={ext.days}
                        checked={formData.additionalDays === ext.days}
                        onChange={(e) =>
                          handleInputChange(
                            "additionalDays",
                            parseInt(e.target.value)
                          )
                        }
                        className="sr-only"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {ext.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(ext.price)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Or set custom end date
                  </label>
                  <input
                    type="date"
                    value={formData.customEndDate}
                    onChange={(e) =>
                      handleInputChange("customEndDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {errors.additionalDays && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.additionalDays}
                  </p>
                )}
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount || totalCost}
                  onChange={(e) =>
                    handleInputChange("amount", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
                {errors.amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    handleInputChange("paymentMethod", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                placeholder="Add any notes about this extension..."
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
                Send email notification to patient about subscription extension
              </label>
            </div>

            {/* Summary */}
            {newEndDate && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Extension Summary
                </h4>
                <div className="space-y-2 text-sm">
                  {(formData.extensionType === "sessions" ||
                    formData.extensionType === "both") && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Additional Sessions:
                      </span>
                      <span className="font-medium">
                        +{formData.additionalSessions}
                      </span>
                    </div>
                  )}
                  {(formData.extensionType === "time" ||
                    formData.extensionType === "both") && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">New End Date:</span>
                      <span className="font-medium">
                        {formatDate(newEndDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-bold text-[#346870]">
                      {formatCurrency(formData.amount || totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Extending...</span>
                </>
              ) : (
                "Extend Subscription"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendSubscriptionModal;
