export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details = {}
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }   
}

export class ValidationError extends Error {
  constructor(message, code = "VALIDATION_ERROR", details = {}) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.statusCode = 400;
    this.details = details;
  }
}

export class PaymentError extends Error {
  constructor(message, code = "PAYMENT_ERROR", details = {}) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = 400;
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AuthenticationError";
    this.code = "AUTHENTICATION_ERROR";
    this.statusCode = 401;
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "NotFoundError";
    this.code = "NOT_FOUND";
    this.statusCode = 404;
    this.details = details;
  }
}

export function createErrorResponse(
  message,
  code,
  statusCode,
  requestId,
  details = {}
) {
  return {
    success: false,
    error: {
      message,
      code,
      requestId,
      details,
    },
    statusCode,
  };
}

export function createPaymentErrorResponse(error, requestId) {
  return createErrorResponse(
    error.message,
    error.code,
    error.statusCode,
    requestId,
    error.details
  );
}
