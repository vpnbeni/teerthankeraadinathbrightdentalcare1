/**
 * Payment Error Handler Utility
 * Provides comprehensive error handling and user-friendly messages for payment operations
 */

// Error types and their corresponding user-friendly messages
export const PaymentErrorTypes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  PLAN_ERROR: "PLAN_ERROR",
  GATEWAY_ERROR: "GATEWAY_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  SCRIPT_LOAD_ERROR: "SCRIPT_LOAD_ERROR",
  VERIFICATION_ERROR: "VERIFICATION_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

// Error messages mapping
const errorMessages = {
  [PaymentErrorTypes.VALIDATION_ERROR]: {
    title: "Validation Error",
    message: "Please check your input and try again.",
    retryable: false,
  },
  [PaymentErrorTypes.NETWORK_ERROR]: {
    title: "Network Error",
    message: "Please check your internet connection and try again.",
    retryable: true,
  },
  [PaymentErrorTypes.AUTHENTICATION_ERROR]: {
    title: "Authentication Required",
    message: "Your session has expired. Please log in again.",
    retryable: false,
  },
  [PaymentErrorTypes.AUTHORIZATION_ERROR]: {
    title: "Access Denied",
    message: "You don't have permission to perform this action.",
    retryable: false,
  },
  [PaymentErrorTypes.PLAN_ERROR]: {
    title: "Plan Error",
    message:
      "The selected plan is not available. Please choose a different plan.",
    retryable: false,
  },
  [PaymentErrorTypes.GATEWAY_ERROR]: {
    title: "Payment Gateway Error",
    message: "Payment gateway is temporarily unavailable. Please try again.",
    retryable: true,
  },
  [PaymentErrorTypes.SERVER_ERROR]: {
    title: "Server Error",
    message: "Our servers are experiencing issues. Please try again later.",
    retryable: true,
  },
  [PaymentErrorTypes.TIMEOUT_ERROR]: {
    title: "Request Timeout",
    message:
      "The request took too long. Please check your connection and try again.",
    retryable: true,
  },
  [PaymentErrorTypes.SCRIPT_LOAD_ERROR]: {
    title: "Payment Gateway Loading Failed",
    message: "Failed to load payment gateway. Please refresh and try again.",
    retryable: true,
  },
  [PaymentErrorTypes.VERIFICATION_ERROR]: {
    title: "Payment Verification Failed",
    message: "Payment verification failed. Please contact support.",
    retryable: false,
  },
  [PaymentErrorTypes.UNKNOWN_ERROR]: {
    title: "Unexpected Error",
    message:
      "An unexpected error occurred. Please try again or contact support.",
    retryable: true,
  },
};

/**
 * Classify error based on error object
 * @param {Error|Object} error - Error object from API or other sources
 * @returns {string} - Error type from PaymentErrorTypes
 */
export const classifyError = (error) => {
  if (!error) return PaymentErrorTypes.UNKNOWN_ERROR;

  // Handle API response errors
  if (error.response) {
    const status = error.response.status;

    switch (status) {
      case 400:
        // Check if it's a validation error or plan error
        const message = error.response.data?.message?.toLowerCase() || "";
        if (message.includes("plan") || message.includes("invalid plan")) {
          return PaymentErrorTypes.PLAN_ERROR;
        }
        return PaymentErrorTypes.VALIDATION_ERROR;

      case 401:
        return PaymentErrorTypes.AUTHENTICATION_ERROR;

      case 403:
        return PaymentErrorTypes.AUTHORIZATION_ERROR;

      case 404:
        return PaymentErrorTypes.PLAN_ERROR;

      case 408:
        return PaymentErrorTypes.TIMEOUT_ERROR;

      case 429:
        return PaymentErrorTypes.GATEWAY_ERROR;

      case 500:
      case 502:
      case 503:
      case 504:
        return PaymentErrorTypes.SERVER_ERROR;

      default:
        return PaymentErrorTypes.UNKNOWN_ERROR;
    }
  }

  // Handle network errors
  if (
    error.code === "NETWORK_ERROR" ||
    error.message?.includes("Network Error")
  ) {
    return PaymentErrorTypes.NETWORK_ERROR;
  }

  // Handle timeout errors
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return PaymentErrorTypes.TIMEOUT_ERROR;
  }

  // Handle script loading errors
  if (
    error.message?.includes("script") ||
    error.message?.includes("Razorpay")
  ) {
    return PaymentErrorTypes.SCRIPT_LOAD_ERROR;
  }

  // Handle verification errors
  if (
    error.message?.includes("verification") ||
    error.message?.includes("signature")
  ) {
    return PaymentErrorTypes.VERIFICATION_ERROR;
  }

  return PaymentErrorTypes.UNKNOWN_ERROR;
};

/**
 * Get user-friendly error message and metadata
 * @param {Error|Object} error - Error object
 * @returns {Object} - Error details with title, message, retryable flag
 */
export const getErrorDetails = (error) => {
  const errorType = classifyError(error);
  const baseDetails = errorMessages[errorType];

  // Try to get more specific message from the error response
  let specificMessage = baseDetails.message;
  if (
    error.response?.data?.message &&
    typeof error.response.data.message === "string"
  ) {
    // Use server message if it's user-friendly (not too technical)
    const serverMessage = error.response.data.message;
    if (
      serverMessage.length < 200 &&
      !serverMessage.includes("Error:") &&
      !serverMessage.includes("Exception")
    ) {
      specificMessage = serverMessage;
    }
  }

  return {
    type: errorType,
    title: baseDetails.title,
    message: specificMessage,
    retryable: baseDetails.retryable,
    originalError: error,
  };
};

/**
 * Check if an error is retryable
 * @param {Error|Object} error - Error object
 * @returns {boolean} - Whether the error is retryable
 */
export const isRetryableError = (error) => {
  const errorType = classifyError(error);
  return errorMessages[errorType].retryable;
};

/**
 * Get retry delay based on attempt number
 * @param {number} attempt - Current attempt number (1-based)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @returns {number} - Delay in milliseconds
 */
export const getRetryDelay = (attempt, baseDelay = 1000) => {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  return Math.min(exponentialDelay + jitter, 10000); // Max 10 seconds
};

/**
 * Format error for logging
 * @param {Error|Object} error - Error object
 * @param {Object} context - Additional context information
 * @returns {Object} - Formatted error for logging
 */
export const formatErrorForLogging = (error, context = {}) => {
  const errorDetails = getErrorDetails(error);

  return {
    timestamp: new Date().toISOString(),
    type: errorDetails.type,
    message: error.message || "Unknown error",
    stack: error.stack,
    response: error.response
      ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        }
      : null,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
};

/**
 * Create a standardized error object
 * @param {string} type - Error type from PaymentErrorTypes
 * @param {string} message - Custom error message
 * @param {Object} originalError - Original error object
 * @returns {Object} - Standardized error object
 */
export const createPaymentError = (type, message, originalError = null) => {
  const baseDetails =
    errorMessages[type] || errorMessages[PaymentErrorTypes.UNKNOWN_ERROR];

  return {
    type,
    title: baseDetails.title,
    message: message || baseDetails.message,
    retryable: baseDetails.retryable,
    originalError,
    timestamp: new Date().toISOString(),
  };
};

export default {
  PaymentErrorTypes,
  classifyError,
  getErrorDetails,
  isRetryableError,
  getRetryDelay,
  formatErrorForLogging,
  createPaymentError,
};
