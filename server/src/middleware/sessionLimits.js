import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

/**
 * Session Limits Middleware
 * Provides functions to check and validate user session limits for appointment booking
 */

/**
 * Get session limit information for a user
 * @param {String} userId - User ID
 * @returns {Object} - Object with session limit details
 */
export const getSessionLimitInfo = async (userId) => {
  try {
    // Get user with subscription and plan details
    const user = await User.findById(userId).populate("subscription.planId");

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's confirmed appointments (exclude expired appointments from count)
    const appointments = await Appointment.find({
      userId,
      status: { $in: ["scheduled", "confirmed"] },
    });

    const confirmedAppointments = appointments.length;

    // If user has no subscription, return default values
    if (!user.subscription) {
      return {
        totalSessions: 0,
        sessionsRemaining: 0,
        sessionsUsed: 0,
        confirmedAppointments,
        canBookMore: false,
        availableBookings: 0,
      };
    }

    // Get actual subscription data
    const sessionsRemaining = Number(user.subscription.sessionsRemaining) || 0;

    // Ensure we have the plan's sessions from DB even if not populated or missing
    let planSessions = 0;
    if (user.subscription.planId) {
      if (
        typeof user.subscription.planId === "object" &&
        user.subscription.planId !== null &&
        Object.prototype.hasOwnProperty.call(
          user.subscription.planId,
          "sessions"
        )
      ) {
        planSessions = Number(user.subscription.planId.sessions) || 0;
      } else {
        const Plan = (await import("../models/Plan.js")).default;
        const plan = await Plan.findById(user.subscription.planId);
        planSessions = Number(plan?.sessions) || 0;
      }
    }

    // Total sessions should primarily come from the plan details
    const totalSessions = planSessions || Number(user.subscription.totalSessions) || sessionsRemaining;
    const sessionsUsed = Math.max(0, totalSessions - sessionsRemaining);

    // Calculate available bookings (sessions remaining minus already confirmed appointments)
    const availableBookings = Math.max(
      0,
      sessionsRemaining - confirmedAppointments
    );
    const canBookMore = availableBookings > 0;

    return {
      totalSessions,
      sessionsRemaining,
      sessionsUsed,
      confirmedAppointments,
      canBookMore,
      availableBookings,
    };
  } catch (error) {
    console.error("Error getting session limit info:", error);
    throw error;
  }
};

/**
 * Check if user can book appointments based on their session limits
 * @param {String} userId - User ID
 * @returns {Object} - Object with canBook boolean and details
 */
export const canUserBookAppointment = async (userId) => {
  try {
    const sessionInfo = await getSessionLimitInfo(userId);

    if (!sessionInfo.canBookMore) {
      return {
        canBook: false,
        reason: "No sessions remaining in your current plan",
        ...sessionInfo,
      };
    }

    return {
      canBook: true,
      reason: `You can book ${sessionInfo.availableBookings} more appointment(s)`,
      ...sessionInfo,
    };
  } catch (error) {
    console.error("Error checking if user can book appointment:", error);
    throw error;
  }
};
