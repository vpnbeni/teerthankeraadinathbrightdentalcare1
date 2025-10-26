import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { loginAdmin, clearError } from "../../store/authSlice";
import { LoadingSpinner } from "../../shared/components";

const AdminLoginForm = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    dispatch(clearError());
    await dispatch(loginAdmin(data));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
        {/* Email Field */}
        <div className="group">
          <label
            htmlFor="email"
            className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2.5 tracking-wide"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`relative w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                errors.email
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Enter your email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5 sm:mt-2 ml-1 flex items-center gap-1 animate-fade-in">
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="group">
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2.5 tracking-wide"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-primary transition-colors"
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
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`relative w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                errors.password
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              placeholder="Enter your password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center z-10"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5 sm:mt-2 ml-1 flex items-center gap-1 animate-fade-in">
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full mt-4 sm:mt-6 lg:mt-8 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-xl transition-all duration-300 group-hover:scale-105 group-disabled:scale-100 group-disabled:opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-600 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 text-white font-semibold tracking-wide text-sm sm:text-base">
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign In to Admin Portal</span>
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </div>
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </button>
      </form>
    </div>
  );
};

export default AdminLoginForm;
