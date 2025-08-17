import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { clearError } from "../../store/authSlice";
import { LoadingSpinner } from "../../shared/components";
import { VALIDATION_RULES, ERROR_MESSAGES } from "../../shared/constants";
import authService from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";

const LoginForm = ({ onClose, onSwitchToRegister }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const { handleSuccessfulLogin } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm();

  const [loginMethod, setLoginMethod] = useState("phone"); // 'phone' | 'email'
  const phoneValue = watch("phone");
  const emailValue = watch("email");

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && otpSent) {
      setCanResend(true);
    }
  }, [resendTimer, otpSent]);

  const onSubmit = async (data) => {
    dispatch(clearError());
    setOtpError(null);
    try {
      setSigningIn(true);
      const response = await authService.loginWithOTP(
        loginMethod === "phone"
          ? { phone: data.phone, otp: data.otp }
          : { email: data.email, otp: data.otp }
      );

      // Use the new handleSuccessfulLogin function to properly set auth state
      await handleSuccessfulLogin(response);
      
      console.log('🔐 Login successful, authentication state updated');
      
      // The AuthModal will automatically close and redirect to dashboard
      // when it detects the authentication state change
    } catch (error) {
      // Set error message and don't redirect - stay on the form
      const errorMessage = error.response?.data?.message || "Invalid OTP. Please try again.";
      setOtpError(errorMessage);
      // Clear the OTP field so user can enter again
      reset({ ...data, otp: "" });
    } finally {
      setSigningIn(false);
    }
  };

  const handleSendOTP = async () => {
    if (loginMethod === "phone" && !phoneValue) {
      setOtpError("Please enter your phone number first");
      return;
    }
    if (loginMethod === "email" && !emailValue) {
      setOtpError("Please enter your email address first");
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);
      await authService.sendLoginOTP(
        loginMethod === "phone" ? { phone: phoneValue } : { email: emailValue }
      );
      setOtpSent(true);
      setResendTimer(60); // Start 60-second countdown
      setCanResend(false);
    } catch (error) {
      setOtpError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSwitchMethod = (method) => {
    if (method === loginMethod) return;
    setLoginMethod(method);
    setOtpSent(false);
    setOtpError(null);
    setResendTimer(0);
    setCanResend(true);
    // Reset relevant fields when switching
    reset({ phone: "", email: "", otp: "" });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
      </div>

      <div className="bg-gray-100 rounded-lg p-1 mb-6 flex">
        <button
          type="button"
          onClick={() => handleSwitchMethod("phone")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            loginMethod === "phone"
              ? "bg-white shadow text-[#346870]"
              : "text-gray-600 hover:text-gray-800"
          }`}
          aria-pressed={loginMethod === "phone"}
        >
          Phone
        </button>
        <button
          type="button"
          onClick={() => handleSwitchMethod("email")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            loginMethod === "email"
              ? "bg-white shadow text-[#346870]"
              : "text-gray-600 hover:text-gray-800"
          }`}
          aria-pressed={loginMethod === "email"}
        >
          Email
        </button>
      </div>

      {(error || otpError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0"
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
            <div>
              <p>{error || otpError}</p>
              {(error || otpError)?.includes("No password set") && (
                <p className="text-sm mt-1">
                  Try using "OTP Login" instead, or contact support to set up a
                  password.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP Login with Phone/Email toggle */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {loginMethod === "phone" ? (
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className={`input-field ${errors.phone ? "border-red-500" : ""}`}
              placeholder="Enter your phone number"
              {...register("phone", {
                required: ERROR_MESSAGES.REQUIRED,
                pattern: {
                  value: VALIDATION_RULES.PHONE.PATTERN,
                  message: VALIDATION_RULES.PHONE.MESSAGE,
                },
              })}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`input-field ${errors.email ? "border-red-500" : ""}`}
              placeholder="Enter your email address"
              {...register("email", {
                required: ERROR_MESSAGES.REQUIRED,
                pattern: {
                  value: VALIDATION_RULES.EMAIL.PATTERN,
                  message: VALIDATION_RULES.EMAIL.MESSAGE,
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            OTP
          </label>
          <div className="flex space-x-2">
            <input
              id="otp"
              type="text"
              maxLength="6"
              className={`input-field flex-1 ${
                errors.otp || otpError ? "border-red-500" : ""
              }`}
              placeholder="Enter 6-digit OTP"
              disabled={!otpSent}
              {...register("otp", {
                required: ERROR_MESSAGES.REQUIRED,
                pattern: {
                  value: /^\d{6}$/,
                  message: "OTP must be 6 digits",
                },
              })}
            />
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={
                otpLoading ||
                !canResend ||
                (loginMethod === "phone" ? !phoneValue : !emailValue)
              }
              className="btn-secondary px-4 py-2 whitespace-nowrap disabled:opacity-50"
            >
              {otpLoading ? (
                <LoadingSpinner size="sm" />
              ) : otpSent && !canResend ? (
                `Resend (${resendTimer}s)`
              ) : otpSent ? (
                "Resend"
              ) : (
                "Send OTP"
              )}
            </button>
          </div>
          {errors.otp && (
            <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
          )}
          {otpSent && !otpError && (
            <p className="text-green-600 text-sm mt-1">
              {loginMethod === "phone"
                ? "OTP sent to your phone number"
                : "OTP sent to your email address"}
            </p>
          )}
        </div>

        {/* Forgot Password removed in OTP-only login */}

        <button
          type="submit"
          disabled={signingIn || !otpSent}
          className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
        >
          {signingIn ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Signing In...</span>
            </>
          ) : (
            "Sign In with OTP"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-[#346870] hover:text-[#2a5359] font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
