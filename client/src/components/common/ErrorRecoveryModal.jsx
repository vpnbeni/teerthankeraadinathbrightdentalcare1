import React, { useState } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Comprehensive Error Recovery Modal
 * Provides user-friendly error messages with actionable recovery steps
 */
const ErrorRecoveryModal = ({
  isOpen,
  onClose,
  errorInfo,
  onRetry,
  onContactSupport,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);

  if (!isOpen || !errorInfo) return null;

  const handleRetry = async () => {
    if (!onRetry || !errorInfo.canRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      onClose();
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContactSupport = () => {
    const subject = `Payment Error - ${
      errorInfo.details?.requestId || "Unknown"
    }`;
    const body = `
Hello Support Team,

I encountered an error while trying to make a payment:

Error Type: ${errorInfo.type}
Error Message: ${errorInfo.message}
Request ID: ${errorInfo.details?.requestId || "Not available"}
Timestamp: ${errorInfo.timestamp}
Error Code: ${errorInfo.details?.errorCode || "Not available"}

Please help me resolve this issue.

Thank you.
    `.trim();

    const mailtoUrl = `mailto:${
      errorInfo.details?.supportContact || "support@teerthankerdentalcare.com"
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (onContactSupport) {
      onContactSupport(mailtoUrl);
    } else {
      window.open(mailtoUrl);
    }
  };

  const getIconComponent = () => {
    switch (errorInfo.type) {
      case "NETWORK":
      case "TIMEOUT":
        return <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />;
      case "AUTHENTICATION":
      case "VALIDATION":
        return <InformationCircleIcon className="h-8 w-8 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />;
    }
  };

  const getModalColors = () => {
    switch (errorInfo.type) {
      case "NETWORK":
      case "TIMEOUT":
        return {
          border: "border-yellow-200",
          bg: "bg-yellow-50",
          button: "bg-yellow-600 hover:bg-yellow-700",
        };
      case "AUTHENTICATION":
      case "VALIDATION":
        return {
          border: "border-blue-200",
          bg: "bg-blue-50",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      default:
        return {
          border: "border-red-200",
          bg: "bg-red-50",
          button: "bg-red-600 hover:bg-red-700",
        };
    }
  };

  const colors = getModalColors();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all ${colors.border} border-2`}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getIconComponent()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {errorInfo.icon} {errorInfo.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {errorInfo.message}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Server-provided guidance */}
          {errorInfo.details?.serverGuidance && (
            <div className={`mt-4 rounded-md p-3 ${colors.bg}`}>
              <h4 className="text-sm font-medium text-gray-800">
                {errorInfo.details.serverGuidance.title}
              </h4>
              <p className="mt-1 text-sm text-gray-700">
                {errorInfo.details.serverGuidance.message}
              </p>
            </div>
          )}

          {/* Recovery Actions */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              What you can do:
            </h4>
            <ul className="space-y-2">
              {(
                errorInfo.details?.serverGuidance?.actions ||
                errorInfo.actions ||
                []
              ).map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-sm text-gray-500 mt-0.5">•</span>
                  <span className="text-sm text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Troubleshooting Steps */}
          {errorInfo.details?.troubleshootingSteps && (
            <div className="mt-4">
              <button
                onClick={() => setExpandedDetails(!expandedDetails)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <span>Troubleshooting Steps</span>
                <span
                  className={`transform transition-transform ${
                    expandedDetails ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {expandedDetails && (
                <div className="mt-2 space-y-1">
                  {errorInfo.details.troubleshootingSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-xs text-gray-400 mt-1">
                        {index + 1}.
                      </span>
                      <span className="text-xs text-gray-600">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {(errorInfo.details?.requestId || errorInfo.details?.errorCode) && (
            <div className="mt-4 rounded-md bg-gray-50 p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-1">
                Error Details
              </h4>
              <div className="space-y-1 text-xs text-gray-600">
                {errorInfo.details.requestId && (
                  <div>Request ID: {errorInfo.details.requestId}</div>
                )}
                {errorInfo.details.errorCode && (
                  <div>Error Code: {errorInfo.details.errorCode}</div>
                )}
                <div>
                  Time: {new Date(errorInfo.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            {/* Retry Button */}
            {errorInfo.canRetry && onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${colors.button} focus:ring-gray-500`}
              >
                {isRetrying ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Retrying...</span>
                  </div>
                ) : (
                  "Try Again"
                )}
              </button>
            )}

            {/* Contact Support Button */}
            <button
              onClick={handleContactSupport}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Contact Support
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>

          {/* Retry Information */}
          {errorInfo.details?.retryAfter && (
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                You can try again after{" "}
                {new Date(errorInfo.details.retryAfter).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorRecoveryModal;
