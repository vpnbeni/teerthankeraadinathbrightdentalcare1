import React, { useState } from "react";
import { useDispatch } from "react-redux";
import paymentService from "../../services/payments";
import { LoadingSpinner } from "../../shared/components";
import Toast from "../../shared/components/Toast";

const PaymentForm = ({ selectedPlan, userDetails, onSuccess, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
  };

  const clearToast = () => {
    setToast(null);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !userDetails) {
      showToast(
        "error",
        "Error",
        "Please select a plan and provide user details"
      );
      return;
    }

    setIsProcessing(true);
    clearToast();

    try {
      showToast("info", "Processing", "Initializing payment...");

      // Initialize payment using our simplified service
      const response = await paymentService.initializePayment(
        selectedPlan._id,
        {
          ...userDetails,
          // Ensure we have the right contact field for Razorpay
          phone: userDetails.phone || userDetails.email,
        }
      );

      // Payment successful
      showToast("success", "Success", "Payment completed successfully!");
      onSuccess(response);
    } catch (error) {
      console.error("Payment failed:", error);
      showToast("error", "Payment Failed", error.message || "Please try again");
      onError(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={clearToast}
          autoClose={toast.type !== "error"}
          duration={toast.type === "success" ? 3000 : 5000}
        />
      )}

      {/* Plan Summary */}
      <div className="rounded-lg p-4 mb-6 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-2">Plan Summary</h3>
        {selectedPlan ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Plan:</span>
              <span className="font-medium">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Sessions:</span>
              <span>{selectedPlan.sessions}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{selectedPlan.duration} months</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span className="text-[#346870]">
                {formatPrice(selectedPlan.price)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>No plan selected</p>
          </div>
        )}
      </div>

      {/* User Details */}
      <div className="rounded-lg p-4 mb-6 bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-2">Payment Details</h3>
        {userDetails ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Name:</span>
              <span className="font-medium">{userDetails.name}</span>
            </div>
            {userDetails.phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{userDetails.phone}</span>
              </div>
            )}
            {userDetails.email && (
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{userDetails.email}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2 text-gray-500 text-sm">
            User details not available
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div className="text-sm text-green-700">
            <div className="font-medium">Secure Payment</div>
            <div>Your payment information is encrypted and secure</div>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || !selectedPlan || !userDetails}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
          isProcessing || !selectedPlan || !userDetails
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[#346870] text-white hover:bg-[#2a5359]"
        }`}
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" color="white" />
            <span className="ml-2">Processing Payment...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Pay {selectedPlan ? formatPrice(selectedPlan.price) : "Select Plan"}
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-600 text-center mt-4">
        By proceeding with payment, you agree to our{" "}
        <a href="#" className="text-[#346870] hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-[#346870] hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default PaymentForm;
