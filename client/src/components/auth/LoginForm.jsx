import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { clearError } from "../../store/authSlice";
import { LoadingSpinner } from "../../shared/components";
import { VALIDATION_RULES, ERROR_MESSAGES } from "../../shared/constants";
import authService from "../../services/auth";
import { useLoginAuth } from "../../hooks/useLoginAuth";

const LoginForm = ({ onClose, onSwitchToRegister }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const { handleSuccessfulLogin } = useLoginAuth();
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

      {/* Premium Toggle Switcher */}
      <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 mb-4 lg:mb-8 flex shadow-inner border border-gray-200/50">
        <button
          type="button"
          onClick={() => handleSwitchMethod("phone")}
          className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
            loginMethod === "phone"
              ? "bg-white shadow-lg text-primary scale-105 ring-2 ring-primary/20"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
          }`}
          aria-pressed={loginMethod === "phone"}
        >
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Phone
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleSwitchMethod("email")}
          className={`flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
            loginMethod === "email"
              ? "bg-white shadow-lg text-primary scale-105 ring-2 ring-primary/20"
              : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
          }`}
          aria-pressed={loginMethod === "email"}
        >
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </div>
        </button>
      </div>

      {(error || otpError) && (
        <div className="relative bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200/50 rounded-xl lg:rounded-2xl px-3 sm:px-5 py-3 sm:py-4 mb-4 lg:mb-6 shadow-lg shadow-red-100/50 animate-fade-in">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
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
            </div>
            <div className="flex-1">
              <p className="text-red-700 font-medium text-xs sm:text-sm">{error || otpError}</p>
              {(error || otpError)?.includes("No password set") && (
                <p className="text-red-600 text-xs mt-1 sm:mt-1.5 leading-relaxed">
                  Try using "OTP Login" instead, or contact support to set up a password.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTP Login with Phone/Email toggle */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
        {loginMethod === "phone" ? (
          <div className="group">
            <label
              htmlFor="phone"
              className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2.5 tracking-wide"
            >
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="phone"
                type="tel"
                className={`relative w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-base bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                  errors.phone ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 hover:border-gray-300"
                }`}
                placeholder="Enter your phone number"
                {...register("phone", {
                  required: ERROR_MESSAGES.REQUIRED,
                  pattern: {
                    value: VALIDATION_RULES.PHONE.PATTERN,
                    message: VALIDATION_RULES.PHONE.MESSAGE,
                  },
                })}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1.5 sm:mt-2 ml-1 flex items-center gap-1 animate-fade-in">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.phone.message}
              </p>
            )}
          </div>
        ) : (
          <div className="group">
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2.5 tracking-wide"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                className={`relative w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-base bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                  errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 hover:border-gray-300"
                }`}
                placeholder="Enter your email address"
                {...register("email", {
                  required: ERROR_MESSAGES.REQUIRED,
                  pattern: {
                    value: VALIDATION_RULES.EMAIL.PATTERN,
                    message: VALIDATION_RULES.EMAIL.MESSAGE,
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5 sm:mt-2 ml-1 flex items-center gap-1 animate-fade-in">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>
        )}

        <div className="group">
          <label
            htmlFor="otp"
            className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2.5 tracking-wide"
          >
            One-Time Password
          </label>
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-20">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="otp"
                type="text"
                maxLength="6"
                className={`relative w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 tracking-widest text-center font-semibold text-base sm:text-lg ${
                  errors.otp || otpError 
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100" 
                    : otpSent 
                    ? "border-gray-200 hover:border-gray-300" 
                    : "border-gray-200 opacity-60 cursor-not-allowed"
                }`}
                placeholder="• • • • • •"
                disabled={!otpSent}
                {...register("otp", {
                  required: ERROR_MESSAGES.REQUIRED,
                  pattern: {
                    value: /^\d{6}$/,
                    message: "OTP must be 6 digits",
                  },
                })}
              />
            </div>
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={
                otpLoading ||
                !canResend ||
                (loginMethod === "phone" ? !phoneValue : !emailValue)
              }
              className="px-3 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm bg-gradient-to-r from-secondary to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-gray-800 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 hover:scale-105 active:scale-95"
            >
              {otpLoading ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <LoadingSpinner size="sm" />
                  <span className="hidden sm:inline">Sending...</span>
                </div>
              ) : otpSent && !canResend ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {resendTimer}s
                </div>
              ) : otpSent ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Resend</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="hidden sm:inline">Send</span> OTP
                </div>
              )}
            </button>
          </div>
          {errors.otp && (
            <p className="text-red-500 text-xs mt-1.5 sm:mt-2 ml-1 flex items-center gap-1 animate-fade-in">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.otp.message}
            </p>
          )}
          {otpSent && !otpError && (
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-lg sm:rounded-xl animate-fade-in">
              <p className="text-green-700 text-xs font-medium flex items-center gap-1.5 sm:gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {loginMethod === "phone"
                  ? "OTP sent to your phone number"
                  : "OTP sent to your email address"}
              </p>
            </div>
          )}
        </div>

        {/* Premium Submit Button */}
        <button
          type="submit"
          disabled={signingIn || !otpSent}
          className="relative w-full mt-4 sm:mt-6 lg:mt-8 group overflow-hidden rounded-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-xl transition-all duration-300 group-hover:scale-105 group-disabled:scale-100 group-disabled:opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 text-white font-semibold tracking-wide text-sm sm:text-base">
            {signingIn ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Sign In Securely</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </div>
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>
      </form>

      {/* Premium Footer */}
      <div className="mt-4 sm:mt-6 lg:mt-8 text-center space-y-3 sm:space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 sm:px-4 bg-white text-gray-500 font-medium">New to our platform?</span>
          </div>
        </div>
        
        <a
          href="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-primary font-semibold transition-all duration-300 group"
        >
          <span className="relative">
            Choose a Plan & Sign Up
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary-700 group-hover:w-full transition-all duration-300"></span>
          </span>
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default LoginForm;
