/**
 * Payment Form Component
 * Handles payment processing with comprehensive error handling and user feedback
 */

import React, { useState } from "react";
import paymentService from "../../services/payments.js";
import { LoadingSpinner } from "../../shared/components";

const PaymentForm = ({ selectedPlan, userDetails, onSuccess, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Format price for display
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Validate inputs before processing
  const validateInputs = () => {
    if (!selectedPlan?._id) {
      throw new Error("Please select a plan first");
    }
    if (!userDetails?.id) {
      throw new Error("User details are required for payment processing");
    }
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      throw new Error("Complete user profile is required for payment");
    }
  };

  // Handle payment initiation
  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Validate inputs
      validateInputs();

      // Initialize payment
      const result = await paymentService.initializePayment(
        selectedPlan._id,
        userDetails
      );

      // Handle success
      onSuccess?.(result);
    } catch (error) {
      console.error("Payment error:", error);

      const errorMessage =
        error.message === "PAYMENT_CANCELLED"
          ? "Payment was cancelled. You can try again when ready."
          : error.message || "Payment failed. Please try again.";

      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Please select a plan to continue</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Plan Details Section */}
      <div className="mb-6" role="region" aria-label="Plan details">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Payment Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Plan</span>
            <span className="font-medium">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Sessions</span>
            <span className="font-medium">
              {selectedPlan.sessions} sessions
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium">{selectedPlan.duration} months</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount</span>
            <span>{formatPrice(selectedPlan.price)}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-50 text-red-700 rounded-md"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors
          ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2">Processing...</span>
          </div>
        ) : (
          `Pay ${formatPrice(selectedPlan.price)}`
        )}
      </button>
    </div>
  );
};

export default PaymentForm;
