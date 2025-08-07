import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { loginUser, clearError } from "../../store/authSlice";
import { LoadingSpinner } from "../../shared/components";
import { VALIDATION_RULES, ERROR_MESSAGES } from "../../shared/constants";
import authService from "../../services/auth";

const LoginForm = ({ onClose, onSwitchToRegister, onForgotPassword }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const phoneValue = watch("phone");

  const onSubmit = async (data) => {
    dispatch(clearError());
    setOtpError(null);

    if (loginMethod === "password") {
      const result = await dispatch(loginUser(data));
      if (result.type === "auth/login/fulfilled") {
        onClose();
      }
    } else {
      // OTP login
      try {
        const response = await authService.loginWithOTP({
          phone: data.phone,
          otp: data.otp,
        });

        // Manually update auth state since we're not using the thunk
        dispatch({
          type: "auth/login/fulfilled",
          payload: response.data,
        });
        onClose();
      } catch (error) {
        setOtpError(error.response?.data?.message || "OTP login failed");
      }
    }
  };

  const handleSendOTP = async () => {
    if (!phoneValue) {
      setOtpError("Please enter your phone number first");
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);
      await authService.sendLoginOTP({ phone: phoneValue });
      setOtpSent(true);
    } catch (error) {
      setOtpError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to your account</p>
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

      {/* Login Method Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        <button
          type="button"
          onClick={() => {
            setLoginMethod("password");
            setOtpSent(false);
            setOtpError(null);
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMethod === "password"
              ? "bg-white text-[#346870] shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Password Login
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMethod("otp");
            setOtpSent(false);
            setOtpError(null);
            dispatch(clearError());
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMethod === "otp"
              ? "bg-white text-[#346870] shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          OTP Login
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {loginMethod === "password" ? (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`input-field pr-10 ${
                  errors.password ? "border-red-500" : ""
                }`}
                placeholder="Enter your password"
                {...register("password", {
                  required:
                    loginMethod === "password"
                      ? ERROR_MESSAGES.REQUIRED
                      : false,
                })}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        ) : (
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
                  errors.otp ? "border-red-500" : ""
                }`}
                placeholder="Enter 6-digit OTP"
                disabled={!otpSent}
                {...register("otp", {
                  required:
                    loginMethod === "otp" ? ERROR_MESSAGES.REQUIRED : false,
                  pattern: {
                    value: /^\d{6}$/,
                    message: "OTP must be 6 digits",
                  },
                })}
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading || !phoneValue}
                className="btn-secondary px-4 py-2 whitespace-nowrap disabled:opacity-50"
              >
                {otpLoading ? (
                  <LoadingSpinner size="sm" />
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
            {otpSent && (
              <p className="text-green-600 text-sm mt-1">
                OTP sent to your phone number
              </p>
            )}
          </div>
        )}

        {loginMethod === "password" && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-[#346870] hover:text-[#2a5359] font-medium"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (loginMethod === "otp" && !otpSent)}
          className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Signing In...</span>
            </>
          ) : (
            `Sign In ${loginMethod === "otp" ? "with OTP" : "with Password"}`
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
