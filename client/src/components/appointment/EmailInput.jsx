import React, { useState, useEffect, useRef } from "react";
import { LoadingSpinner } from "../../shared/components";
import {
  checkEmailAvailability,
  sendEmailOTP,
  verifyEmailOTP,
} from "../../services/auth";

const EmailInput = ({
  value,
  onChange,
  onValidationChange,
  error,
  disabled = false,
  className = "",
}) => {
  const [email, setEmail] = useState(value || "");
  const [isValidating, setIsValidating] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [lastCheckedEmail, setLastCheckedEmail] = useState("");

  const debounceTimeout = useRef(null);

  // Email validation regex for any valid email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Check email availability
  const checkAvailability = async (emailToCheck) => {
    if (
      !emailToCheck ||
      !emailRegex.test(emailToCheck) ||
      emailToCheck === lastCheckedEmail
    ) {
      return;
    }

    setIsValidating(true);
    try {
      const response = await checkEmailAvailability(emailToCheck);
      setIsAvailable(response.available);
      setLastCheckedEmail(emailToCheck);
    } catch (error) {
      console.error("Email availability check failed:", error);
      setIsAvailable(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Debounced email availability check
  const debouncedCheckAvailability = (emailToCheck) => {
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      checkAvailability(emailToCheck);
    }, 800); // 800ms delay
  };

  // Send OTP
  const sendOTP = async () => {
    setIsSendingOtp(true);
    try {
      await sendEmailOTP(email);
      setOtpSent(true);
    } catch (error) {
      console.error("Failed to send OTP:", error);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (otpCode.length !== 6) return;

    setIsVerifyingOtp(true);
    try {
      await verifyEmailOTP(email, otpCode);
      setIsVerified(true);
      setOtpCode("");
      onChange(email);
      onValidationChange?.({ isValid: true, isVerified: true });
    } catch (error) {
      console.error("OTP verification failed:", error);
      setOtpCode("");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle email input change
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    onChange(newEmail);

    // Reset states when email changes
    setIsAvailable(null);
    setOtpSent(false);
    setIsVerified(false);
    setLastCheckedEmail("");

    // Clear any pending debounced calls
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Check availability with debounce if valid email
    if (emailRegex.test(newEmail)) {
      debouncedCheckAvailability(newEmail);
    }
  };

  // Update parent validation state
  useEffect(() => {
    const isValid = emailRegex.test(email);
    onValidationChange?.({
      isValid,
      isVerified: isValid, // Consider valid email as verified for appointment booking
      isAvailable,
    });
  }, [email, isVerified, isAvailable, onValidationChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const isValidEmail = emailRegex.test(email);
  const showSendOtpButton =
    isValidEmail && isAvailable === true && !otpSent && !isVerified;

  return (
    <div className="space-y-2">
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#346870] transition-colors z-10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          disabled={disabled || isVerified}
          className={`w-full pl-11 pr-24 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:border-[#346870] focus:ring-2 focus:ring-[#346870]/20 hover:border-gray-300 ${className} ${
            error ? "border-red-500" : ""
          } ${isVerified ? "bg-green-50 border-green-500" : ""}`}
          placeholder="Enter your email address"
        />

        {/* Loading spinner */}
        {isValidating && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <LoadingSpinner size="small" />
          </div>
        )}

        {/* Availability status */}
        {!isValidating && isAvailable !== null && isValidEmail && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isAvailable ? (
              <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded">
                Available
              </span>
            ) : (
              <span className="text-red-600 text-xs font-medium bg-red-100 px-2 py-1 rounded">
                In Use
              </span>
            )}
          </div>
        )}

        {/* Send OTP button */}
        {showSendOtpButton && (
          <button
            type="button"
            onClick={sendOTP}
            disabled={isSendingOtp}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSendingOtp ? "Sending..." : "Send OTP"}
          </button>
        )}

        {/* Verified indicator */}
        {isVerified && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded">
              ✓ Verified
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Invalid email warning */}
      {email && !isValidEmail && (
        <p className="text-orange-600 text-sm">
          Please enter a valid email address
        </p>
      )}

      {/* OTP input */}
      {otpSent && !isVerified && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              className="input-field flex-1"
              maxLength={6}
            />
            <button
              type="button"
              onClick={verifyOTP}
              disabled={otpCode.length !== 6 || isVerifyingOtp}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify"}
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Enter the 6-digit code sent to your email
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailInput;
