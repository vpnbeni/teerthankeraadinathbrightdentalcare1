import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "../../shared/components";
import Toast from "../../shared/components/Toast";
import authService, { sendEmailOTP, verifyEmailOTP } from "../../services/auth";

/**
 * Streamlined authentication modal for plan selection flow
 * Steps: User Info → OTP → Payment
 */
const StreamlinedAuthModal = ({
  isOpen,
  onClose,
  selectedPlan,
  onAuthSuccess,
}) => {
  const [step, setStep] = useState("userInfo"); // 'userInfo', 'otp', 'verifying'
  const [formData, setFormData] = useState({
    name: "",
    contact: "", // phone or email
    contactType: "phone", // 'phone' or 'email'
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Clear toast
  const clearToast = () => setToast(null);

  // Show toast notification
  const showToast = (type, title, message) => {
    setToast({
      type,
      title,
      message,
      id: Date.now(),
    });
  };

  // Reset modal state
  const resetModal = () => {
    setStep("userInfo");
    setFormData({ name: "", contact: "", contactType: "phone" });
    setOtp("");
    setError("");
    setOtpSent(false);
    clearToast();
  };

  // Validate email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate phone (Indian format)
  const isValidPhone = (phone) => {
    return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""));
  };

  // Handle contact type toggle
  const handleContactTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      contactType: type,
      contact: "", // Clear contact when switching types
    }));
    setError(""); // Clear any existing errors
  };

  // Handle contact input change
  const handleContactChange = (e) => {
    const contact = e.target.value;
    setFormData((prev) => ({
      ...prev,
      contact,
    }));
    setError(""); // Clear errors on input change
  };

  // Validate user info form
  const validateUserInfo = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return false;
    }
    if (!formData.contact.trim()) {
      setError("Phone number or email is required");
      return false;
    }

    if (formData.contactType === "email") {
      if (!isValidEmail(formData.contact)) {
        setError("Please enter a valid email address");
        return false;
      }
    } else {
      if (!isValidPhone(formData.contact)) {
        setError("Please enter a valid 10-digit phone number");
        return false;
      }
    }

    return true;
  };

  // Send OTP
  const handleSendOTP = async () => {
    setError("");

    if (!validateUserInfo()) {
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (formData.contactType === "email") {
        // Send email OTP
        response = await sendEmailOTP(formData.contact.trim());
      } else {
        // Send phone OTP via registration
        const otpData = {
          name: formData.name.trim(),
          phone: formData.contact.trim(),
          planId: selectedPlan._id,
        };
        response = await authService.register(otpData);
      }

      console.log("OTP sent successfully:", response);
      setOtpSent(true);
      setStep("otp");
      // showToast(
      //   "success",
      //   "OTP Sent",
      //   `Verification code sent to your ${
      //     formData.contactType === "email" ? "email" : "phone"
      //   }`
      // );
    } catch (error) {
      console.error("Failed to send OTP:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      setError(errorMessage);
      // showToast("error", "OTP Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    setStep("verifying");

    try {
      let response;

      if (formData.contactType === "email") {
        // Verify email OTP
        response = await verifyEmailOTP(formData.contact.trim(), otp.trim());
      } else {
        // Verify phone OTP
        const verificationData = {
          phone: formData.contact.trim(),
          otp: otp.trim(),
        };
        response = await authService.verifyOTP(verificationData);
      }

      console.log("OTP verified successfully:", response);

      // Success - call the parent callback with user data
      const userData = {
        name: formData.name.trim(),
        [formData.contactType]: formData.contact.trim(),
        contactType: formData.contactType,
        ...response.data?.user,
      };

      showToast(
        "success",
        "Verification Successful",
        "You can now proceed to payment"
      );

      // Small delay to show success message
      setTimeout(() => {
        onAuthSuccess(userData);
        resetModal();
      }, 1500);
    } catch (error) {
      console.error("OTP verification failed:", error);
      const errorMessage =
        error.response?.data?.message || "Invalid OTP. Please try again.";
      setError(errorMessage);
      setStep("otp"); // Go back to OTP input
      showToast("error", "Verification Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError("");
    setIsLoading(true);

    try {
      if (formData.contactType === "email") {
        await sendEmailOTP(formData.contact.trim());
      } else {
        await authService.resendOTP(formData.contact.trim());
      }

      showToast(
        "success",
        "OTP Resent",
        `New verification code sent to your ${
          formData.contactType === "email" ? "email" : "phone"
        }`
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to resend OTP";
      setError(errorMessage);
      showToast("error", "Resend Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      resetModal();
      onClose();
    }
  };

  // Handle OTP input (only numbers, max 6 digits)
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar modal-content">
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

        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#346870] to-[#2a5359] text-white rounded-t-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {step === "userInfo" && "Get Started"}
                {step === "otp" && "Verify Code"}
                {step === "verifying" && "Verifying..."}
              </h2>
              <p className="text-white/80 mt-1">
                {step === "userInfo" && `Selected: ${selectedPlan?.name}`}
                {step === "otp" &&
                  `Code sent to your ${
                    formData.contactType === "email" ? "email" : "phone"
                  }`}
                {step === "verifying" &&
                  "Please wait while we verify your code"}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white/80 hover:text-white disabled:opacity-50 p-2 rounded-full hover:bg-white/10 transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  step === "userInfo" ? "bg-white" : "bg-white/50"
                }`}
              ></div>
              <div
                className={`flex-1 h-1 rounded ${
                  step !== "userInfo" ? "bg-white/50" : "bg-white/20"
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full ${
                  step === "otp" || step === "verifying"
                    ? "bg-white"
                    : "bg-white/20"
                }`}
              ></div>
              <div
                className={`flex-1 h-1 rounded ${
                  step === "verifying" ? "bg-white/50" : "bg-white/20"
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full ${
                  step === "verifying" ? "bg-white" : "bg-white/20"
                }`}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>Details</span>
              <span>Verify</span>
              <span>Complete</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: User Info */}
          {step === "userInfo" && (
            <div className="space-y-6">
              {/* Plan Info */}
              <div className="bg-gradient-to-r from-[#346870]/5 to-[#BDCFD1]/10 border border-[#346870]/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#346870] text-lg">
                      {selectedPlan?.name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {selectedPlan?.sessions} sessions • Valid for{" "}
                      {selectedPlan?.duration} months
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#346870]">
                      ₹{selectedPlan?.price?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#346870] focus:border-[#346870] transition-colors"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Contact Type Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Contact Method *
                </label>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => handleContactTypeChange("phone")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      formData.contactType === "phone"
                        ? "bg-[#346870] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Phone
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleContactTypeChange("email")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      formData.contactType === "email"
                        ? "bg-[#346870] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Email
                    </div>
                  </button>
                </div>
              </div>

              {/* Contact Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {formData.contactType === "phone"
                    ? "Phone Number"
                    : "Email Address"}{" "}
                  *
                </label>
                <div className="relative">
                  <input
                    type={formData.contactType === "email" ? "email" : "tel"}
                    value={formData.contact}
                    onChange={handleContactChange}
                    placeholder={
                      formData.contactType === "phone"
                        ? "Enter 10-digit phone number"
                        : "Enter your email address"
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#346870] focus:border-[#346870] transition-colors"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {formData.contactType === "phone" ? (
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                {formData.contactType === "phone" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Enter a valid 10-digit Indian phone number (starting with
                    6-9)
                  </p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-start">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
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
                  {error}
                </div>
              )}

              {/* Send OTP Button */}
              <button
                onClick={handleSendOTP}
                disabled={
                  isLoading || !formData.name.trim() || !formData.contact.trim()
                }
                className="w-full bg-gradient-to-r from-[#346870] to-[#2a5359] text-white py-4 px-6 rounded-xl hover:from-[#2a5359] hover:to-[#1e3d42] focus:ring-2 focus:ring-[#346870] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg transition-all shadow-lg"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Sending Code...</span>
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
                    Send Verification Code
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-6">
              {/* Contact Info Display */}
              <div className="text-center">
                <div className="w-16 h-16 bg-[#346870]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {formData.contactType === "phone" ? (
                    <svg
                      className="w-8 h-8 text-[#346870]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-[#346870]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Check your{" "}
                  {formData.contactType === "phone" ? "phone" : "email"}
                </h3>
                <p className="text-gray-600 text-sm">
                  We've sent a 6-digit verification code to
                </p>
                <p className="font-medium text-[#346870] mt-1">
                  {formData.contact}
                </p>
              </div>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#346870] focus:border-[#346870] text-center text-2xl tracking-[0.5em] font-mono transition-colors"
                  maxLength={6}
                  disabled={isLoading}
                />
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your{" "}
                  {formData.contactType === "phone" ? "phone" : "email"}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-start">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
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
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-[#346870] to-[#2a5359] text-white py-4 px-6 rounded-xl hover:from-[#2a5359] hover:to-[#1e3d42] focus:ring-2 focus:ring-[#346870] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg transition-all shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Verifying...</span>
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Verify & Continue
                    </>
                  )}
                </button>

                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="w-full border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                >
                  <svg
                    className="w-4 h-4 mr-2 inline"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Resend Code
                </button>

                <button
                  onClick={() => setStep("userInfo")}
                  disabled={isLoading}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 py-2 font-medium"
                >
                  ← Change Contact Information
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verifying */}
          {step === "verifying" && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#346870]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <LoadingSpinner size="lg" color="[#346870]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Verifying Your Code
                </h3>
                <p className="text-gray-600">
                  Please wait while we verify your verification code
                </p>
                <div className="mt-4 flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-[#346870] rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-[#346870] rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-[#346870] rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamlinedAuthModal;
