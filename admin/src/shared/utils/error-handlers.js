// Enhanced error handling utilities for admin panel
import { showToast } from "./toast";

// Error types
export const ERROR_TYPES = {
  VALIDATION: "validation",
  NETWORK: "network",
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  SERVER: "server",
  CLIENT: "client",
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

// Simple error handler
export const handleApiError = (error, context = null, customMessage = null) => {
  let message = customMessage || "An error occurred";
  let type = "error";

  if (error.response) {
    const status = error.response.status;
    if (status === 400) {
      message = error.response.data?.message || "Invalid request";
      type = "warning";
    } else if (status === 401) {
      message = "Authentication required";
    } else if (status === 403) {
      message = "Access denied";
    } else if (status === 404) {
      message = "Resource not found";
    } else if (status >= 500) {
      message = "Server error occurred";
    }
  } else if (error.request) {
    message = "Network connection failed";
  }

  showToast[type](message);
  console.error("API Error:", error);

  return { error, message, context };
};

// Form validation error handler
export const handleFormValidationError = (errors, formName = null) => {
  if (typeof errors === "object" && errors !== null) {
    const errorMessages = Object.values(errors).filter(Boolean);
    const message =
      errorMessages.length > 0
        ? `Validation failed: ${errorMessages.join(", ")}`
        : "Please check your input and try again";

    showToast.warning(message);
    return { errors, message };
  }

  const message = "Form validation failed";
  showToast.warning(message);
  return { errors, message };
};

// Format validation errors
export const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== "object") {
    return {};
  }

  const formatted = {};
  Object.entries(errors).forEach(([field, error]) => {
    if (error) {
      formatted[field] =
        typeof error === "string" ? error : error.message || "Invalid value";
    }
  });

  return formatted;
};

// Async operation wrapper with error handling
export const withErrorHandling = (asyncFn, context = null, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleApiError(error, context, options.customMessage);
      throw error;
    }
  };
};

// Error boundary helper
export const createErrorBoundary = (fallbackComponent) => {
  return {
    fallbackComponent,
    onError: (error, errorInfo) => {
      console.error("Component Error:", error, errorInfo);
      showToast.error("A component error occurred");
    },
  };
};

// Simple error handler class
export class AdminErrorHandler {
  constructor(options = {}) {
    this.options = {
      logErrors: true,
      showToasts: true,
      ...options,
    };
  }

  handleError(error, context = null, customMessage = null) {
    return handleApiError(error, context, customMessage);
  }
}

export const adminErrorHandler = new AdminErrorHandler();

export default {
  AdminErrorHandler,
  adminErrorHandler,
  handleApiError,
  handleFormValidationError,
  formatValidationErrors,
  withErrorHandling,
  createErrorBoundary,
  ERROR_TYPES,
  ERROR_SEVERITY,
};
