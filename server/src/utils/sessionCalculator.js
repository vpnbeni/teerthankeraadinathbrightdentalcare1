import { Appointment } from "../models/index.js";

/**
 * Session Calculator Utility
 * Provides accurate session calculations based on appointments and plan data
 */

/**
 * Calculate accurate session information for a user
 * @param {Object} user - User object with subscription details
 * @returns {Object} - Accurate session information
 */
export const calculateSessionInfo = async (user) => {
  console.log("🔍 DEBUG: Session Calculator");
  console.log("User ID:", user?._id);

  if (!user || !user.subscription || !user.subscription.planId) {
    console.log("❌ No user/subscription/plan found");
    return {
      totalSessions: 0,
      sessionsRemaining: 0,
      sessionsUsed: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      availableBookings: 0,
      isActive: false,
    };
  }

  const planSessions = user.subscription.planId.sessions || 0;
  console.log("Plan Sessions:", planSessions);

  // Count completed appointments (these consume sessions)
  const completedAppointments = await Appointment.countDocuments({
    userId: user._id,
    status: "completed",
  });

  // Count confirmed/scheduled appointments (these are booked but not yet completed)
  const confirmedAppointments = await Appointment.countDocuments({
    userId: user._id,
    status: { $in: ["scheduled", "confirmed"] },
  });

  console.log("Completed Appointments (Calculator):", completedAppointments);
  console.log("Confirmed Appointments (Calculator):", confirmedAppointments);

  // Calculate sessions used (only completed appointments consume sessions)
  const sessionsUsed = Math.min(completedAppointments, planSessions);

  // Calculate sessions remaining
  const sessionsRemaining = Math.max(0, planSessions - sessionsUsed);

  // Calculate available bookings (sessions remaining minus already confirmed appointments)
  const availableBookings = Math.max(
    0,
    sessionsRemaining - confirmedAppointments
  );

  console.log("Sessions Used (Calculator):", sessionsUsed);
  console.log("Sessions Remaining (Calculator):", sessionsRemaining);
  console.log("Available Bookings (Calculator):", availableBookings);

  // Check if subscription is active
  const now = new Date();
  const isActive =
    user.subscription.status === "active" &&
    user.subscription.endDate > now &&
    sessionsRemaining > 0;

  return {
    totalSessions: planSessions,
    sessionsRemaining,
    sessionsUsed,
    confirmedAppointments,
    completedAppointments,
    availableBookings,
    isActive,
  };
};

/**
 * Update user's session remaining count in database
 * @param {String} userId - User ID
 * @returns {Object} - Updated session information
 */
export const syncUserSessionCount = async (userId) => {
  try {
    const User = (await import("../models/index.js")).User;

    const user = await User.findById(userId).populate("subscription.planId");
    if (!user) {
      throw new Error("User not found");
    }

    const sessionInfo = await calculateSessionInfo(user);

    // Update the user's sessionsRemaining in the database
    if (user.subscription) {
      user.subscription.sessionsRemaining = sessionInfo.sessionsRemaining;

      // Update subscription status if needed
      if (
        sessionInfo.sessionsRemaining === 0 &&
        user.subscription.status === "active"
      ) {
        user.subscription.status = "expired";
      }

      await user.save();
    }

    return sessionInfo;
  } catch (error) {
    console.error("Sync user session count error:", error);
    throw error;
  }
};

/**
 * Get enhanced user profile with accurate session information
 * @param {String} userId - User ID
 * @returns {Object} - User profile with accurate session data
 */
export const getUserProfileWithSessionInfo = async (userId) => {
  try {
    const User = (await import("../models/index.js")).User;

    const user = await User.findById(userId)
      .select("-passwordHash")
      .populate("subscription.planId");

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate accurate session information
    const sessionInfo = await calculateSessionInfo(user);

    // Update the user's sessionsRemaining if it's different
    if (
      user.subscription &&
      user.subscription.sessionsRemaining !== sessionInfo.sessionsRemaining
    ) {
      user.subscription.sessionsRemaining = sessionInfo.sessionsRemaining;

      // Update subscription status if needed
      if (
        sessionInfo.sessionsRemaining === 0 &&
        user.subscription.status === "active"
      ) {
        user.subscription.status = "expired";
      }

      await user.save();
    }

    // Return user profile with enhanced session information
    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: user.address,
        gender: user.gender,
        alternativePhone: user.alternativePhone,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription,
        medicalInfo: user.medicalInfo,
        documents: user.documents,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error("Get user profile with session info error:", error);
    throw error;
  }
};

/**
 * Sync all users' session counts (utility for maintenance)
 * @returns {Object} - Summary of sync operation
 */
export const syncAllUsersSessionCounts = async () => {
  try {
    const User = (await import("../models/index.js")).User;

    const users = await User.find({
      "subscription.status": "active",
      "subscription.planId": { $exists: true },
    }).populate("subscription.planId");

    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of users) {
      try {
        const sessionInfo = await calculateSessionInfo(user);

        if (
          user.subscription.sessionsRemaining !== sessionInfo.sessionsRemaining
        ) {
          user.subscription.sessionsRemaining = sessionInfo.sessionsRemaining;

          // Update subscription status if needed
          if (
            sessionInfo.sessionsRemaining === 0 &&
            user.subscription.status === "active"
          ) {
            user.subscription.status = "expired";
          }

          await user.save();
          syncedCount++;
        }
      } catch (error) {
        errorCount++;
        errors.push({
          userId: user._id,
          error: error.message,
        });
      }
    }

    console.log(
      `Session sync completed: ${syncedCount} users synced, ${errorCount} errors`
    );

    return {
      totalUsers: users.length,
      syncedCount,
      errorCount,
      errors: errors.slice(0, 10), // Return first 10 errors
    };
  } catch (error) {
    console.error("Sync all users session counts error:", error);
    throw error;
  }
};
