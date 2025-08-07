import React, { useState } from "react";
import { LoadingSpinner } from "../../shared/components";
import { formatCurrency } from "../../shared/utils/formatters";
import {
  XMarkIcon,
  CheckIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

const ChangePlanModal = ({ subscription, onClose, onChange, loading }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    paymentMethod: "cash",
    prorationHandling: "credit", // "credit", "refund", "charge"
    notes: "",
    sendNotification: true,
  });
  const [errors, setErrors] = useState({});

  const availablePlans = [
    {
      id: "basic",
      name: "Basic Plan",
      sessions: 5,
      duration: 30, // days
      price: 2500,
      features: [
        "5 dental sessions",
        "Basic consultation",
        "30-day validity",
        "Email support",
      ],
      popular: false,
    },
    {
      id: "standard",
      name: "Standard Plan",
      sessions: 10,
      duration: 60,
      price: 4500,
      features: [
        "10 dental sessions",
        "Comprehensive consultation",
        "60-day validity",
        "Priority booking",
        "Email & phone support",
      ],
      popular: true,
    },
    {
      id: "premium",
      name: "Premium Plan",
      sessions: 15,
      duration: 90,
      price: 6500,
      features: [
        "15 dental sessions",
        "Full dental care package",
        "90-day validity",
        "Priority booking",
        "24/7 support",
        "Free consultation",
      ],
      popular: false,
    },
    {
      id: "family",
      name: "Family Plan",
      sessions: 25,
      duration: 120,
      price: 9500,
      features: [
        "25 dental sessions",
        "Family dental care",
        "120-day validity",
        "Multiple user access",
        "Priority booking",
        "24/7 support",
        "Free consultations",
      ],
      popular: false,
    },
  ];

  const getCurrentPlan = () => {
    return (
      availablePlans.find(
        (plan) =>
          plan.sessions === subscription.totalSessions ||
          plan.name.toLowerCase().includes(subscription.planType?.toLowerCase())
      ) || availablePlans[1]
    ); // Default to standard
  };

  const currentPlan = getCurrentPlan();

  const calculatePlanChange = () => {
    if (!selectedPlan) return null;

    const currentValue =
      (subscription.sessionsRemaining / subscription.totalSessions) *
      currentPlan.price;
    const newPlanValue = selectedPlan.price;
    const difference = newPlanValue - currentValue;

    return {
      currentValue,
      newPlanValue,
      difference,
      isUpgrade: difference > 0,
      isDowngrade: difference < 0,
    };
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedPlan) {
      newErrors.plan = "Please select a new plan";
    }

    if (selectedPlan && selectedPlan.id === currentPlan.id) {
      newErrors.plan = "Please select a different plan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const planChange = calculatePlanChange();
    const changeData = {
      ...formData,
      newPlan: selectedPlan,
      currentPlan,
      planChange,
      currentSubscription: subscription,
    };

    onChange(changeData);
  };

  const planChange = calculatePlanChange();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Change Subscription Plan
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[75vh]">
          <div className="p-6 space-y-6">
            {/* Current Plan Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {currentPlan.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {subscription.sessionsRemaining} of{" "}
                    {subscription.totalSessions} sessions remaining
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(currentPlan.price)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Current value:{" "}
                    {formatCurrency(planChange?.currentValue || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select New Plan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isCurrent = plan.id === currentPlan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-lg p-6 cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#346870] bg-blue-50 shadow-md"
                          : isCurrent
                          ? "border-gray-300 bg-gray-50 opacity-50"
                          : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
                      }`}
                      onClick={() => !isCurrent && setSelectedPlan(plan)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-[#346870] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                            <StarIcon className="h-3 w-3" />
                            Most Popular
                          </span>
                        </div>
                      )}

                      {isCurrent && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full">
                            Current Plan
                          </span>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {plan.name}
                        </h3>
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-gray-900">
                            {formatCurrency(plan.price)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {plan.sessions} sessions • {plan.duration} days
                        </p>
                      </div>

                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center text-sm text-gray-600"
                          >
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-[#346870] rounded-lg pointer-events-none">
                          <div className="absolute top-2 right-2 bg-[#346870] text-white rounded-full p-1">
                            <CheckIcon className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.plan && (
                <p className="text-red-600 text-sm mt-2">{errors.plan}</p>
              )}
            </div>

            {/* Plan Change Summary */}
            {planChange && selectedPlan && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  Plan Change Summary
                  {planChange.isUpgrade ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                  )}
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current plan value:</span>
                    <span className="font-medium">
                      {formatCurrency(planChange.currentValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New plan cost:</span>
                    <span className="font-medium">
                      {formatCurrency(planChange.newPlanValue)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">
                      {planChange.isUpgrade
                        ? "Additional payment:"
                        : "Credit/Refund:"}
                    </span>
                    <span
                      className={`font-bold ${
                        planChange.isUpgrade ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {planChange.isUpgrade ? "+" : ""}
                      {formatCurrency(Math.abs(planChange.difference))}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-sm text-gray-700">
                    <strong>Sessions:</strong> {subscription.sessionsRemaining}{" "}
                    remaining sessions will be converted to{" "}
                    {selectedPlan.sessions} sessions in the new plan.
                  </p>
                </div>
              </div>
            )}

            {/* Payment and Proration Options */}
            {planChange && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {!planChange.isUpgrade && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Handling
                    </label>
                    <select
                      value={formData.prorationHandling}
                      onChange={(e) =>
                        handleInputChange("prorationHandling", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#346870] focus:border-transparent"
                    >
                      <option value="credit">Apply as account credit</option>
                      <option value="refund">Process refund</option>
                    </select>
                  </div>
                )}
              </div>
            )}

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
                placeholder="Add any notes about this plan change..."
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
                Send email notification to patient about plan change
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
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
              disabled={loading || !selectedPlan}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-[#346870] hover:bg-[#2a5359] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Changing Plan...</span>
                </>
              ) : (
                <>
                  {planChange?.isUpgrade ? "Upgrade Plan" : "Change Plan"}
                  {planChange && (
                    <span className="ml-2">
                      ({planChange.isUpgrade ? "+" : ""}
                      {formatCurrency(Math.abs(planChange.difference))})
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePlanModal;
