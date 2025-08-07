import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { verifyOTP, clearError } from "../../store/authSlice";
import authService from "../../services/auth";
import { LoadingSpinner } from "../../shared/components";
import {
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../../shared/constants";
import phoneStorage from "../../utils/phoneStorage";

const OTPVerification = ({ onBack, onSuccess }) => {
  const dispatch = useDispatch();
  const { isLoading, error, tempUserData } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);

      // Focus last filled input or submit if complete
      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();

      if (pastedData.length === 6) {
        handleSubmit(pastedData);
      }
    }
  };

  const handleSubmit = async (otpValue = otp.join("")) => {
    if (otpValue.length !== 6) {
      return;
    }

    console.log("tempUserData:", tempUserData);
    console.log("phone from tempUserData:", tempUserData?.phone);

    // Get phone number from tempUserData or storage
    const phoneNumber = tempUserData?.phone || phoneStorage.get();

    if (!phoneNumber) {
      console.error("Phone number not found in tempUserData or storage");
      alert("Phone number not found. Please go back and register again.");
      onBack();
      return;
    }

    console.log("Using phone number for verification:", phoneNumber);

    dispatch(clearError());
    const result = await dispatch(
      verifyOTP({
        phone: phoneNumber,
        otp: otpValue,
      })
    );

    if (result.type === "auth/verifyOTP/fulfilled") {
      // Clear the stored phone number
      phoneStorage.clear();
      onSuccess();
    }
  };

  const handleResendOTP = async () => {
    const phoneNumber = tempUserData?.phone || phoneStorage.get();

    if (!canResend || !phoneNumber) {
      console.error("Cannot resend OTP: phone number not available");
      return;
    }

    setResendLoading(true);
    try {
      await authService.resendOTP(phoneNumber);
      setResendTimer(30);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error("Failed to resend OTP:", error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#346870] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Verify Phone Number
        </h2>
        <p className="text-gray-600 mt-2">
          We've sent a 6-digit code to{" "}
          <span className="font-medium text-gray-800">
            {tempUserData?.phone || phoneStorage.get() || "your phone"}
          </span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-center space-x-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-[#346870] focus:outline-none transition-colors"
              disabled={isLoading}
            />
          ))}
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={isLoading || otp.join("").length !== 6}
          className="btn-primary w-full flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Verifying...</span>
            </>
          ) : (
            "Verify OTP"
          )}
        </button>

        <div className="text-center space-y-3">
          <p className="text-gray-600">
            Didn't receive the code?{" "}
            {canResend ? (
              <button
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-[#346870] hover:text-[#2a5359] font-medium"
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
            ) : (
              <span className="text-gray-500">Resend in {resendTimer}s</span>
            )}
          </p>

          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
