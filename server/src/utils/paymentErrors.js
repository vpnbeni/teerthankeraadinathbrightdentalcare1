/**
 * Payment Error Classes and Constants
 * Comprehensive error handling for payment operations
 */

/**
 * Payment Error Codes
 */
export const PaymentErrorCodes = {
  // Authentication and Authorization
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  ACCOUNT_NOT_VERIFIED: "ACCOUNT_NOT_VERIFIED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Input Validation
  MISSING_PLAN_ID: "MISSING_PLAN_ID",
  INVALID_PLAN_ID_FORMAT: "INVALID_PLAN_ID_FORMAT",
  INVALID_USER_ID_FORMAT: "INVALID_USER_ID_FORMAT",
  MISSING_REQUIRED_FIELDS: "MISSING_REQUIRED_FIELDS",

  // Plan Validation
  PLAN_NOT_FOUND: "PLAN_NOT_FOUND",
  PLAN_INACTIVE: "PLAN_INACTIVE",
  PLAN_UNAVAILABLE: "PLAN_UNAVAILABLE",

  // User Validation
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_INACTIVE: "USER_INACTIVE",

  // Payment Processing
  RAZORPAY_CONFIG_ERROR: "RAZORPAY_CONFIG_ERROR",
  RAZORPAY_API_ERROR: "RAZORPAY_API_ERROR",
  ORDER_CREATION_FAILED: "ORDER_CREATION_FAILED",
  DUPLICATE_PAYMENT: "DUPLICATE_PAYMENT",
  PAYMENT_VERIFICATION_FAILED: "PAYMENT_VERIFICATION_FAILED",

  // Database Operations
  DATABASE_ERROR: "DATABASE_ERROR",
  PAYMENT_RECORD_CREATION_FAILED: "PAYMENT_RECORD_CREATION_FAILED",
  SUBSCRIPTION_UPDATE_FAILED: "SUBSCRIPTION_UPDATE_FAILED",

  // General Errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
};

/**
 * Base Payment Error Class
 */
export class PaymentError extends Error {
  constructor(message, code, statusCode = 400, details = {}) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError);
    }
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      details: this.details,
    };
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends PaymentError {
  constructor(
    message = "Authentication required",
    code = PaymentErrorCodes.AUTHENTICATION_REQUIRED,
    details = {}
  ) {
    super(message, code, 401, details);
    this.name = "AuthenticationError";
  }
}

/**
 * Account Not Verified Error
 */
export class AccountNotVerifiedError extends AuthenticationError {
  constructor(
    message = "Account not verified. Please verify your phone number first.",
    details = {}
  ) {
    super(message, PaymentErrorCodes.ACCOUNT_NOT_VERIFIED, details);
    this.name = "AccountNotVerifiedError";
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends PaymentError {
  constructor(message = "Insufficient permissions", details = {}) {
    super(message, PaymentErrorCodes.INSUFFICIENT_PERMISSIONS, 403, details);
    this.name = "AuthorizationError";
  }
}

/**
 * Validation Error
 */
export class ValidationError extends PaymentError {
  constructor(
    message,
    code = PaymentErrorCodes.MISSING_REQUIRED_FIELDS,
    details = {}
  ) {
    super(message, code, 400, details);
    this.name = "ValidationError";
  }
}

/**
 * Plan Error
 */
export class PlanError extends PaymentError {
  constructor(message, code = PaymentErrorCodes.PLAN_NOT_FOUND, details = {}) {
    super(message, code, 404, details);
    this.name = "PlanError";
  }
}

/**
 * Razorpay Error
 */
export class RazorpayError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PaymentErrorCodes.RAZORPAY_API_ERROR, 400, details);
    this.name = "RazorpayError";
  }
}

/**
 * Database Error
 */
export class DatabaseError extends PaymentError {
  constructor(message, details = {}) {
    super(message, PaymentErrorCodes.DATABASE_ERROR, 500, details);
    this.name = "DatabaseError";
  }
}

/**
 * Error Response Mappings
 */
export const ErrorResponseMappings = {
  [PaymentErrorCodes.AUTHENTICATION_REQUIRED]: {
    statusCode: 401,
    userMessage: "Please log in to continue with payment",
    retryable: false,
  },
  [PaymentErrorCodes.ACCOUNT_NOT_VERIFIED]: {
    statusCode: 401,
    userMessage: "Please verify your account to make payments",
    retryable: false,
  },
  [PaymentErrorCodes.PLAN_NOT_FOUND]: {
    statusCode: 404,
    userMessage: "Selected plan is not available",
    retryable: false,
  },
  [PaymentErrorCodes.PLAN_INACTIVE]: {
    statusCode: 400,
    userMessage: "Selected plan is currently unavailable",
    retryable: false,
  },
  [PaymentErrorCodes.RAZORPAY_API_ERROR]: {
    statusCode: 400,
    userMessage: "Payment service temporarily unavailable. Please try again.",
    retryable: true,
  },
  [PaymentErrorCodes.DATABASE_ERROR]: {
    statusCode: 500,
    userMessage: "Service temporarily unavailable. Please try again later.",
    retryable: true,
  },
  [PaymentErrorCodes.INTERNAL_SERVER_ERROR]: {
    statusCode: 500,
    userMessage: "An unexpected error occurred. Please try again later.",
    retryable: true,
  },
};

/**
 * Get user-friendly error message
 * @param {string} errorCode - Error code
 * @returns {Object} Error response mapping
 */
export const getErrorMapping = (errorCode) => {
  return (
    ErrorResponseMappings[errorCode] || {
      statusCode: 500,
      userMessage: "An unexpected error occurred. Please try again later.",
      retryable: false,
    }
  );
};

/**
 * Check if error is retryable
 * @param {string} errorCode - Error code
 * @returns {boolean} True if error is retryable
 */
export const isRetryableError = (errorCode) => {
  const mapping = getErrorMapping(errorCode);
  return mapping.retryable;
};

/**
 * Create standardized error response
 * @param {PaymentError} error - Payment error instance
 * @param {string} requestId - Request ID for tracking
 * @returns {Object} Standardized error response
 */
export const createPaymentErrorResponse = (error, requestId = null) => {
  const mapping = getErrorMapping(error.code);

  const response = {
    success: false,
    message: error.message,
    code: error.code,
    userMessage: mapping.userMessage,
    retryable: mapping.retryable,
    timestamp: error.timestamp,
  };

  if (requestId) {
    response.requestId = requestId;
  }

  if (Object.keys(error.details).length > 0) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return response;
};
