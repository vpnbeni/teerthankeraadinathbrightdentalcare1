import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoadingSpinner } from "../../shared/components";
import settingsService from "../../services/settings";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const AdminNotificationConfig = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.settings);
  
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadNotificationEmail();
  }, []);

  const loadNotificationEmail = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getSettingsByCategory("general");
      const generalSettings = response.data.settings?.default?.generalSettings;
      
      if (generalSettings?.notificationEmail) {
        setNotificationEmail(generalSettings.notificationEmail);
      }
    } catch (error) {
      console.error("Failed to load notification email:", error);
      setMessage({
        type: "error",
        text: "Failed to load current notification email setting",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    // Reset errors and message
    setErrors({});
    setMessage(null);

    // Validate email if provided
    if (notificationEmail.trim() && !validateEmail(notificationEmail.trim())) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    try {
      setIsSaving(true);
      
      // Call the API to save notification email
      await settingsService.updateNotificationEmail(notificationEmail.trim());

      setMessage({
        type: "success",
        text: notificationEmail.trim() 
          ? "Admin notification email updated successfully"
          : "Admin notification email removed successfully",
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save notification email:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to save notification email setting",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setNotificationEmail(email);
    
    // Clear email error when user starts typing
    if (errors.email) {
      setErrors({ ...errors, email: null });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="medium" ariaLabel="Loading notification settings" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Admin Notification Email
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure a separate email address to receive appointment notifications. 
          This can be different from your login email.
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === "success" 
            ? "bg-green-50 border border-green-200" 
            : "bg-red-50 border border-red-200"
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === "success" ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === "success" ? "text-green-800" : "text-red-800"
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="notificationEmail" className="block text-sm font-medium text-gray-700">
              Notification Email Address
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="notificationEmail"
                name="notificationEmail"
                value={notificationEmail}
                onChange={handleEmailChange}
                placeholder="admin@yourcompany.com"
                className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.email
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-[#346870] focus:border-[#346870]"
                }`}
                disabled={isSaving}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              When patients book appointments, a notification will be sent to this email address. 
              Leave empty to disable admin notifications.
            </p>
          </div>

          {/* Current Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Configuration</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Admin notification email:</span>
                <span className="text-sm font-medium text-gray-900">
                  {notificationEmail.trim() || (
                    <span className="text-gray-400 italic">Not configured</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${
                  notificationEmail.trim() ? "text-green-600" : "text-yellow-600"
                }`}>
                  {notificationEmail.trim() ? "Active" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#346870] hover:bg-[#2a5459] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#346870] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How it works
            </h3>
            <div className="text-sm text-blue-700 mt-1">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  When a patient books an appointment, they will receive a confirmation email
                </li>
                <li>
                  If you configure a notification email here, a copy of the appointment details 
                  will also be sent to that address
                </li>
                <li>
                  This notification email is separate from your admin login credentials
                </li>
                <li>
                  You can change or remove this email at any time
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationConfig;
