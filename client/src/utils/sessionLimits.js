/**
 * Session Limits Utility
 * Provides functions to check and validate user session limits for appointment booking
 */

/**
 * Check if user can book appointments based on their subscription and session limits
 * @param {Object} user - User object with subscription details
 * @param {Array} appointments - Array of user's appointments (optional, for more accurate checking)
 * @returns {Object} - Object with canBook boolean and reason string
 */
export const canUserBookAppointment = (user, appointments = []) => {
  // Check if user has subscription
  if (!user?.subscription) {
    return {
      canBook: false,
      reason: "No active subscription found",
      requiresUpgrade: true,
    };
  }

  // Check if subscription is active
  if (user.subscription.status !== "active") {
    return {
      canBook: false,
      reason: "Subscription is not active",
      requiresUpgrade: true,
    };
  }

  // Check if user has sessions remaining
  if (user.subscription.sessionsRemaining <= 0) {
    return {
      canBook: false,
      reason: "No sessions remaining in your current plan",
      requiresUpgrade: true,
    };
  }

  // If appointments array is provided, check if user has already booked max appointments
  if (appointments.length > 0) {
    const confirmedAppointments = appointments.filter(
      (apt) => apt.status === "scheduled" || apt.status === "confirmed"
    ).length;

    if (confirmedAppointments >= user.subscription.sessionsRemaining) {
      return {
        canBook: false,
        reason:
          "You have already booked the maximum number of appointments allowed by your current plan",
        requiresUpgrade: true,
      };
    }
  }

  return {
    canBook: true,
    reason: null,
    requiresUpgrade: false,
  };
};

/**
 * Get session limit information for display
 * @param {Object} user - User object with subscription details
 * @param {Array} appointments - Array of user's appointments (optional)
 * @returns {Object} - Object with session limit details
 */
export const getSessionLimitInfo = (user, appointments = []) => {
  if (!user?.subscription) {
    return {
      totalSessions: 0,
      sessionsRemaining: 0,
      sessionsUsed: 0,
      confirmedAppointments: 0,
      canBookMore: false,
    };
  }

  const sessionsRemaining = user.subscription.sessionsRemaining || 0;
  const confirmedAppointments = appointments.filter(
    (apt) => apt.status === "scheduled" || apt.status === "confirmed"
  ).length;

  // Calculate total sessions from plan or estimate
  const totalSessions =
    user.subscription.planId?.sessions ||
    sessionsRemaining + confirmedAppointments;

  const sessionsUsed = totalSessions - sessionsRemaining;
  const canBookMore = sessionsRemaining > confirmedAppointments;

  return {
    totalSessions,
    sessionsRemaining,
    sessionsUsed,
    confirmedAppointments,
    canBookMore,
  };
};

/**
 * Get user-friendly message for session limit status
 * @param {Object} user - User object with subscription details
 * @param {Array} appointments - Array of user's appointments (optional)
 * @returns {String} - User-friendly message
 */
export const getSessionLimitMessage = (user, appointments = []) => {
  const { canBook, reason } = canUserBookAppointment(user, appointments);

  if (canBook) {
    const { sessionsRemaining, confirmedAppointments } = getSessionLimitInfo(
      user,
      appointments
    );
    const availableBookings = sessionsRemaining - confirmedAppointments;

    if (availableBookings === 1) {
      return "You can book 1 more appointment";
    } else {
      return `You can book ${availableBookings} more appointments`;
    }
  }

  return reason;
};

/**
 * Check if user needs to upgrade their plan
 * @param {Object} user - User object with subscription details
 * @param {Array} appointments - Array of user's appointments (optional)
 * @returns {Boolean} - True if user needs to upgrade
 */
export const needsUpgrade = (user, appointments = []) => {
  const { requiresUpgrade } = canUserBookAppointment(user, appointments);
  return requiresUpgrade;
};
