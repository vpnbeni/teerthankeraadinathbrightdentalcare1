import React, { useState } from "react";
import {
  sendPhoneOTPForProfile,
  verifyPhoneOTPForProfile,
} from "../../services/auth";
import Toast from "../../shared/components/Toast";

const PhoneVerification = ({ user, onPhoneVerified }) => {
  const [step, setStep] = useState("phone"); // "phone" or "otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOTPForProfile(phone);
      setStep("otp");
      showToast("OTP sent to your phone number");

      // Start resend cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await verifyPhoneOTPForProfile(phone, otp);
      showToast("Phone number verified successfully!");
      onPhoneVerified(response.data.user);
    } catch (error) {
      showToast(error.response?.data?.message || "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await sendPhoneOTPForProfile(phone);
      showToast("OTP resent to your phone number");

      // Start resend cooldown
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to resend OTP",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtp("");
  };

  // If user already has a verified phone, show status
  if (user?.phone && user?.phoneVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-green-500 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-green-800 font-medium">Phone Verified</p>
            <p className="text-green-600 text-sm">{user.phone}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Add Phone Number
        </h3>
        <p className="text-gray-600 text-sm">
          Add and verify your phone number to enable phone-based login
        </p>
      </div>

      {step === "phone" ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 10-digit phone number"
              maxLength="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#346870] focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your 10-digit mobile number without country code
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full bg-[#346870] text-white py-2 px-4 rounded-lg hover:bg-[#2a5359] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              maxLength="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#346870] focus:border-transparent text-center text-lg tracking-widest"
              required
            />
            <p className="text-xs text-gray-500 mt-1">OTP sent to {phone}</p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !otp}
              className="flex-1 bg-[#346870] text-white py-2 px-4 rounded-lg hover:bg-[#2a5359] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || loading}
              className="text-[#346870] text-sm hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneVerification;
