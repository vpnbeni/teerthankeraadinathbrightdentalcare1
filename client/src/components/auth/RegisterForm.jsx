import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { registerUser, clearError } from "../../store/authSlice";
import { LoadingSpinner } from "../../shared/components";
import { VALIDATION_RULES, ERROR_MESSAGES } from "../../shared/constants";
import phoneStorage from "../../utils/phoneStorage";
import paymentService from "../../services/payments";

const RegisterForm = ({ onClose, onSwitchToLogin, selectedPlan }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      dispatch(clearError());
      setPaymentError(null);

      if (selectedPlan) {
        // Initialize payment if plan is selected
        try {
          await paymentService.initializePayment(selectedPlan.id, data);
        } catch (error) {
          setPaymentError("Payment failed. Please try again.");
          return;
        }
      }

      const userData = {
        ...data,
        planId: selectedPlan?.id,
      };

      // Store phone number for OTP verification
      phoneStorage.store(data.phone);

      const result = await dispatch(registerUser(userData));
      if (result.type === "auth/register/fulfilled") {
        // Registration successful, OTP verification will be handled by parent component
        console.log("Registration successful, phone stored:", data.phone);
      }
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
        <p className="text-gray-600 mt-2">Join us for better dental care</p>
        {selectedPlan && (
          <div className="mt-3 p-3 bg-[#346870] bg-opacity-10 rounded-lg">
            <p className="text-sm text-[#346870] font-medium">
              Selected Plan: {selectedPlan.name}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {paymentError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {paymentError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            className={`input-field ${errors.name ? "border-red-500" : ""}`}
            placeholder="Enter your full name"
            {...register("name", {
              required: ERROR_MESSAGES.REQUIRED,
              minLength: {
                value: VALIDATION_RULES.NAME.MIN_LENGTH,
                message: `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`,
              },
              maxLength: {
                value: VALIDATION_RULES.NAME.MAX_LENGTH,
                message: `Name cannot exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`,
              },
              pattern: {
                value: VALIDATION_RULES.NAME.PATTERN,
                message: VALIDATION_RULES.NAME.MESSAGE,
              },
            })}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone Number *
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

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address (Optional)
          </label>
          <input
            id="email"
            type="email"
            className={`input-field ${errors.email ? "border-red-500" : ""}`}
            placeholder="Enter your email address"
            {...register("email", {
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

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password *
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={`input-field pr-10 ${
                errors.password ? "border-red-500" : ""
              }`}
              placeholder="Create a password"
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className={`input-field pr-10 ${
                errors.confirmPassword ? "border-red-500" : ""
              }`}
              placeholder="Confirm your password"
              {...register("confirmPassword", {
                required: ERROR_MESSAGES.REQUIRED,
                validate: (value) =>
                  value === password || ERROR_MESSAGES.PASSWORDS_DONT_MATCH,
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
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
              <span className="ml-2">Creating Account...</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-[#346870] hover:text-[#2a5359] font-medium"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
