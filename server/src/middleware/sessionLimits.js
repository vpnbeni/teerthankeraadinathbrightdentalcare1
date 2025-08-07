import { Appointment, User } from "../models/index.js";
import { syncUserSessionCount } from "../utils/sessionCalculator.js";

/**
 * Session Limits Middleware
 * Validates user session limits before allowing appointment booking
 */

/**
 * Middleware to check if user can book appointments based on session limits
 */
export const validateSessionLimits = async (req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  try {
    console.log(`🛡️ MIDDLEWARE ${requestId}: Session Limits Middleware START`);
    const user = req.user;

    // Skip session limits for admin users
    if (user.role === "admin") {
      console.log(
        `🛡️ MIDDLEWARE ${requestId}: ADMIN USER - Skipping session limits`
      );
      req.sessionLimits = {
        totalSessions: Infinity,
        sessionsRemaining: Infinity,
        confirmedAppointments: 0,
        availableBookings: Infinity,
      };
      return next();
    }

    // Sync user's session count to ensure accuracy
    const sessionInfo = await syncUserSessionCount(user._id);
    console.log(`🛡️ MIDDLEWARE ${requestId}: Session Info:`, sessionInfo);

    // Refresh user data after sync
    const updatedUser = await User.findById(user._id).populate(
      "subscription.planId"
    );
    req.user = updatedUser;

    // Check if user has active subscription
    if (!updatedUser.isSubscriptionActive()) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to book appointments",
        subscriptionStatus: updatedUser.subscription.status,
        sessionsRemaining: updatedUser.subscription.sessionsRemaining,
        requiresUpgrade: true,
      });
    }

    // Check if user has sessions remaining
    if (sessionInfo.sessionsRemaining <= 0) {
      return res.status(403).json({
        success: false,
        message:
          "No sessions remaining in your current plan. Please upgrade your subscription to book more appointments.",
        subscriptionStatus: updatedUser.subscription.status,
        sessionsRemaining: sessionInfo.sessionsRemaining,
        requiresUpgrade: true,
      });
    }

    // Check if user has available bookings
    if (sessionInfo.availableBookings <= 0) {
      console.log(
        `🛡️ MIDDLEWARE ${requestId}: BLOCKING - No available bookings`
      );
      return res.status(403).json({
        success: false,
        message:
          "You have already booked the maximum number of appointments allowed by your current plan.",
        subscriptionStatus: updatedUser.subscription.status,
        sessionsRemaining: sessionInfo.sessionsRemaining,
        confirmedAppointments: sessionInfo.confirmedAppointments,
        requiresUpgrade: true,
      });
    }

    // Add session limit info to request for use in controller
    req.sessionLimits = sessionInfo;

    console.log(
      `🛡️ MIDDLEWARE ${requestId}: ALLOWING - Proceeding to controller`
    );
    next();
  } catch (error) {
    console.error("Session limits validation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating session limits",
    });
  }
};

/**
 * Middleware to check session limits for appointment updates/cancellations
 * Less restrictive than booking validation
 */
export const validateSessionLimitsForUpdate = async (req, res, next) => {
  try {
    const user = req.user;

    // Skip session limits for admin users
    if (user.role === "admin") {
      console.log(
        "🛡️ MIDDLEWARE: ADMIN USER - Skipping session limits for update"
      );
      return next();
    }

    // Only check if user has active subscription for updates
    if (!user.subscription || user.subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to manage appointments",
        subscriptionStatus: user.subscription?.status || "none",
        requiresUpgrade: true,
      });
    }

    next();
  } catch (error) {
    console.error("Session limits update validation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating session limits",
    });
  }
};

/**
 * Get session limit information for a user
 */
export const getSessionLimitInfo = async (userId) => {
  try {
    const { calculateSessionInfo } = await import(
      "../utils/sessionCalculator.js"
    );
    const user = await User.findById(userId).populate("subscription.planId");

    if (!user || !user.subscription) {
      return {
        totalSessions: 0,
        sessionsRemaining: 0,
        confirmedAppointments: 0,
        canBookMore: false,
        availableBookings: 0,
      };
    }

    const sessionInfo = await calculateSessionInfo(user);

    return {
      totalSessions: sessionInfo.totalSessions,
      sessionsRemaining: sessionInfo.sessionsRemaining,
      confirmedAppointments: sessionInfo.confirmedAppointments,
      canBookMore: sessionInfo.availableBookings > 0,
      availableBookings: sessionInfo.availableBookings,
    };
  } catch (error) {
    console.error("Get session limit info error:", error);
    return {
      totalSessions: 0,
      sessionsRemaining: 0,
      confirmedAppointments: 0,
      canBookMore: false,
      availableBookings: 0,
    };
  }
};
