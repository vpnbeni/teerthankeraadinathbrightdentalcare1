import React, { useState } from "react";
import { useForm } from "react-hook-form";
import authService from "../../services/auth";
import { LoadingSpinner } from "../../shared/components";
import {
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "../../shared/constants";

const ForgotPasswordForm = ({ onBack, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("phone"); // 'phone', 'otp', 'reset'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch("password");

  const handlePhoneSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(data.phone);
      setPhone(data.phone);
      setStep("otp");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verify OTP (this would typically return a reset token)
      await authService.verifyOTP({ phone, otp: data.otp });
      setOtp(data.otp);
      setStep("reset");
    } catch (error) {
      setError(error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword({
        phone,
        otp,
        password: data.password,
      });
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <form onSubmit={handleSubmit(handlePhoneSubmit)} className="space-y-4">
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
          placeholder="Enter your registered phone number"
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

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Sending OTP...</span>
          </>
        ) : (
          "Send OTP"
        )}
      </button>
    </form>
  );

  const renderOtpStep = () => (
    <form onSubmit={handleSubmit(handleOtpSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="otp"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Enter OTP
        </label>
        <input
          id="otp"
          type="text"
          maxLength="6"
          className={`input-field ${errors.otp ? "border-red-500" : ""}`}
          placeholder="Enter 6-digit OTP"
          {...register("otp", {
            required: ERROR_MESSAGES.REQUIRED,
            pattern: {
              value: VALIDATION_RULES.OTP.PATTERN,
              message: VALIDATION_RULES.OTP.MESSAGE,
            },
          })}
        />
        {errors.otp && (
          <p className="text-red-500 text-sm mt-1">{errors.otp.message}</p>
        )}
        <p className="text-sm text-gray-600 mt-1">OTP sent to {phone}</p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
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
    </form>
  );

  const renderResetStep = () => (
    <form onSubmit={handleSubmit(handlePasswordReset)} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          New Password
        </label>
        <input
          id="password"
          type="password"
          className={`input-field ${errors.password ? "border-red-500" : ""}`}
          placeholder="Enter new password"
          {...register("password", {
            required: ERROR_MESSAGES.REQUIRED,
            minLength: {
              value: VALIDATION_RULES.PASSWORD.MIN_LENGTH,
              message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
            },
            pattern: {
              value: VALIDATION_RULES.PASSWORD.PATTERN,
              message: VALIDATION_RULES.PASSWORD.MESSAGE,
            },
          })}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={`input-field ${
            errors.confirmPassword ? "border-red-500" : ""
          }`}
          placeholder="Confirm new password"
          {...register("confirmPassword", {
            required: ERROR_MESSAGES.REQUIRED,
            validate: (value) =>
              value === password || ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
          })}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span className="ml-2">Resetting...</span>
          </>
        ) : (
          "Reset Password"
        )}
      </button>
    </form>
  );

  const getStepTitle = () => {
    switch (step) {
      case "phone":
        return "Reset Password";
      case "otp":
        return "Verify OTP";
      case "reset":
        return "Set New Password";
      default:
        return "Reset Password";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "phone":
        return "Enter your registered phone number to receive an OTP";
      case "otp":
        return "Enter the OTP sent to your phone number";
      case "reset":
        return "Create a new password for your account";
      default:
        return "";
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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{getStepTitle()}</h2>
        <p className="text-gray-600 mt-2">{getStepDescription()}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {step === "phone" && renderPhoneStep()}
      {step === "otp" && renderOtpStep()}
      {step === "reset" && renderResetStep()}

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
