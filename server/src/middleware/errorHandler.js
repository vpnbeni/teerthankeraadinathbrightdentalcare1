import mongoose from "mongoose";

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose CastError (Invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle Mongoose Duplicate Key Error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use another value.`;
  return new AppError(message, 400);
};

// Handle Mongoose Validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`;
  return new AppError(message, 400);
};

// Handle JWT Error
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

// Handle JWT Expired Error
const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("ERROR 💥", err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
      timestamp: new Date().toISOString(),
    });
  }
};

// Rate limiting error handler
const handleRateLimitError = (err) => {
  const message = "Too many requests from this IP, please try again later.";
  return new AppError(message, 429);
};

// File upload error handler
const handleMulterError = (err) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return new AppError("File too large. Maximum size is 5MB.", 400);
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return new AppError("Too many files. Maximum is 5 files.", 400);
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return new AppError("Unexpected file field.", 400);
  }
  return new AppError("File upload error.", 400);
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log error details
  console.error("Error Details:", {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (error.name === "MongoNetworkError") {
      error = new AppError(
        "Database connection error. Please try again later.",
        503
      );
    }
    if (error.type === "entity.too.large") {
      error = new AppError("Request entity too large.", 413);
    }
    if (error.code === "EBADCSRFTOKEN") {
      error = new AppError("Invalid CSRF token.", 403);
    }
    if (error.status === 429) error = handleRateLimitError(error);
    if (error.name === "MulterError") error = handleMulterError(error);

    sendErrorProd(error, res);
  }
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(err);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  const formatted = {};

  if (Array.isArray(errors)) {
    errors.forEach((error) => {
      if (error.path) {
        formatted[error.path] = error.message;
      }
    });
  } else if (typeof errors === "object") {
    Object.keys(errors).forEach((key) => {
      formatted[key] = errors[key].message || errors[key];
    });
  }

  return formatted;
};

// Success response helper
const sendSuccessResponse = (
  res,
  statusCode = 200,
  data = null,
  message = "Success"
) => {
  const response = {
    status: "success",
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

// Error response helper
const sendErrorResponse = (
  res,
  statusCode = 500,
  message = "Internal Server Error",
  errors = null
) => {
  const response = {
    status: "error",
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = formatValidationErrors(errors);
  }

  res.status(statusCode).json(response);
};

// Health check endpoint
const healthCheck = (req, res) => {
  const healthData = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
  };

  res.status(200).json(healthData);
};

export {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  sendSuccessResponse,
  sendErrorResponse,
  formatValidationErrors,
  healthCheck,
};
