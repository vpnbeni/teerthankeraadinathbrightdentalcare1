import { User } from "../models/index.js";
import {
  AuthenticationError,
  AccountNotVerifiedError,
  ValidationError,
  DatabaseError,
  PaymentErrorCodes,
} from "./paymentErrors.js";
import { isValidObjectId } from "./requestUtils.js";

/**
 * User Validation Utilities
 * Comprehensive validation for user authentication and authorization
 */

/**
 * Validate user ID format
 * @param {string} userId - User ID to validate
 * @throws {ValidationError} If user ID format is invalid
 */
export const validateUserIdFormat = (userId) => {
  if (!userId) {
    throw new ValidationError(
      "User ID is required",
      PaymentErrorCodes.INVALID_USER_ID_FORMAT,
      { userId }
    );
  }

  if (typeof userId !== "string") {
    throw new ValidationError(
      "User ID must be a string",
      PaymentErrorCodes.INVALID_USER_ID_FORMAT,
      { userId, type: typeof userId }
    );
  }

  if (!isValidObjectId(userId)) {
    throw new ValidationError(
      "Invalid user ID format",
      PaymentErrorCodes.INVALID_USER_ID_FORMAT,
      { userId }
    );
  }
};

/**
 * Validate user existence and status
 * @param {string} userId - User ID to validate
 * @param {string} requestId - Request ID for tracking
 * @returns {Promise<Object>} User object if valid
 * @throws {AuthenticationError} If user is not found or inactive
 * @throws {DatabaseError} If database operation fails
 */
export const validateUserExistenceAndStatus = async (
  userId,
  requestId = null
) => {
  let user;

  try {
    user = await User.findById(userId).select("-passwordHash");
  } catch (dbError) {
    const errorMessage = `Database error while fetching user: ${dbError.message}`;

    if (requestId) {
      console.error(`[${requestId}] ${errorMessage}`, {
        userId,
        error: dbError.message,
        stack: dbError.stack,
      });
    }

    throw new DatabaseError("Failed to validate user details", {
      userId,
      originalError: dbError.message,
      requestId,
    });
  }

  if (!user) {
    throw new AuthenticationError("User not found", { userId, requestId });
  }

  if (!user.isVerified) {
    throw new AccountNotVerifiedError(
      "Account not verified. Please verify your phone number first.",
      {
        userId,
        isVerified: user.isVerified,
        phone: user.phone,
        requestId,
      }
    );
  }

  return user;
};

/**
 * Validate user authentication from request
 * @param {Object} req - Express request object
 * @param {string} requestId - Request ID for tracking
 * @returns {Object} Authenticated user object
 * @throws {AuthenticationError} If user is not authenticated
 */
export const validateUserAuthentication = (req, requestId = null) => {
  if (!req.user) {
    throw new AuthenticationError("Authentication required", { requestId });
  }

  if (!req.user._id) {
    throw new AuthenticationError("Invalid user session", { requestId });
  }

  if (!req.user.isVerified) {
    throw new AccountNotVerifiedError(
      "Account not verified. Please verify your phone number first.",
      {
        userId: req.user._id,
        isVerified: req.user.isVerified,
        phone: req.user.phone,
        requestId,
      }
    );
  }

  return req.user;
};

/**
 * Comprehensive user validation for payment operations
 * @param {Object} req - Express request object
 * @param {string} requestId - Request ID for tracking
 * @returns {Object} Validated user object
 * @throws {AuthenticationError|ValidationError|DatabaseError} Various validation errors
 */
export const validateUserForPayment = async (req, requestId = null) => {
  // Step 1: Validate user authentication from request
  const sessionUser = validateUserAuthentication(req, requestId);

  // Step 2: Validate user ID format
  validateUserIdFormat(sessionUser._id.toString());

  // Step 3: Re-fetch and validate user from database for latest status
  const user = await validateUserExistenceAndStatus(sessionUser._id, requestId);

  // Step 4: Additional payment-specific validation
  validateUserPaymentEligibility(user, requestId);

  if (requestId) {
    console.log(`[${requestId}] User validation successful`, {
      userId: user._id,
      phone: user.phone,
      name: user.name,
      isVerified: user.isVerified,
      subscriptionStatus: user.subscription?.status,
    });
  }

  return user;
};

/**
 * Validate user eligibility for payment operations
 * @param {Object} user - User object to validate
 * @param {string} requestId - Request ID for tracking
 * @throws {AuthenticationError} If user is not eligible for payments
 */
export const validateUserPaymentEligibility = (user, requestId = null) => {
  // Check if user account is active
  if (user.status && user.status !== "active") {
    throw new AuthenticationError(
      "Account is not active. Please contact support.",
      {
        userId: user._id,
        status: user.status,
        requestId,
      }
    );
  }

  // Additional eligibility checks can be added here
  // For example: payment restrictions, geographic limitations, etc.
};

/**
 * Get user summary for logging and responses
 * @param {Object} user - User object
 * @returns {Object} User summary
 */
export const getUserSummary = (user) => {
  return {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    isVerified: user.isVerified,
    status: user.status,
    subscriptionStatus: user.subscription?.status,
    sessionsRemaining: user.subscription?.sessionsRemaining,
  };
};

/**
 * Validate user authorization for specific operations
 * @param {Object} user - User object
 * @param {string} operation - Operation being performed
 * @param {Object} resource - Resource being accessed
 * @param {string} requestId - Request ID for tracking
 * @throws {AuthenticationError} If user is not authorized
 */
export const validateUserAuthorization = (
  user,
  operation,
  resource = {},
  requestId = null
) => {
  // Admin users have access to all operations
  if (user.role === "admin") {
    return;
  }

  // For regular users, validate they can only access their own resources
  if (resource.userId && resource.userId.toString() !== user._id.toString()) {
    throw new AuthenticationError(
      "Access denied. You can only access your own resources.",
      {
        userId: user._id,
        operation,
        resourceUserId: resource.userId,
        requestId,
      }
    );
  }
};

/**
 * Check if user has active subscription
 * @param {Object} user - User object
 * @returns {boolean} True if user has active subscription
 */
export const hasActiveSubscription = (user) => {
  return (
    user.subscription &&
    user.subscription.status === "active" &&
    user.subscription.sessionsRemaining > 0
  );
};

/**
 * Validate user session consistency
 * @param {Object} sessionUser - User from session/token
 * @param {Object} dbUser - User from database
 * @param {string} requestId - Request ID for tracking
 * @throws {AuthenticationError} If session is inconsistent
 */
export const validateSessionConsistency = (
  sessionUser,
  dbUser,
  requestId = null
) => {
  if (sessionUser._id.toString() !== dbUser._id.toString()) {
    throw new AuthenticationError("Session inconsistency detected", {
      sessionUserId: sessionUser._id,
      dbUserId: dbUser._id,
      requestId,
    });
  }

  if (sessionUser.isVerified !== dbUser.isVerified) {
    throw new AuthenticationError(
      "User verification status has changed. Please log in again.",
      {
        userId: dbUser._id,
        sessionVerified: sessionUser.isVerified,
        dbVerified: dbUser.isVerified,
        requestId,
      }
    );
  }
};

export default {
  validateUserIdFormat,
  validateUserExistenceAndStatus,
  validateUserAuthentication,
  validateUserForPayment,
  validateUserPaymentEligibility,
  getUserSummary,
  validateUserAuthorization,
  hasActiveSubscription,
  validateSessionConsistency,
};
