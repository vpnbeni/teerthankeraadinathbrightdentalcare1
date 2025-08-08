import { getSessionLimitInfo } from "../middleware/sessionLimits.js";

/**
 * Session Limit Controller
 * Handles session limit related requests
 */

/**
 * @desc    Get user's session limit information
 * @route   GET /api/session-limits
 * @access  Private
 */
export const getSessionLimits = async (req, res) => {
  try {
    console.log("🔍 DEBUG: Session Limits API Call");
    console.log("User ID:", req.user._id);

    // Admin users have unlimited session limits
    if (req.user.role === "admin") {
      return res.status(200).json({
        success: true,
        data: {
          totalSessions: Infinity,
          sessionsRemaining: Infinity,
          confirmedAppointments: 0,
          canBookMore: true,
          availableBookings: Infinity,
          subscriptionStatus: "admin",
          planName: "Admin Access",
        },
      });
    }

    const sessionLimitInfo = await getSessionLimitInfo(req.user._id);

    // Get fresh user data to get accurate subscription status
    const User = (await import("../models/User.js")).default;
    const freshUser = await User.findById(req.user._id).populate(
      "subscription.planId"
    );

    console.log("Session Limit Info:", sessionLimitInfo);

    res.status(200).json({
      success: true,
      data: {
        ...sessionLimitInfo,
        subscriptionStatus: freshUser.subscription?.status || "none",
        planName: freshUser.subscription?.planId?.name || null,
      },
    });
  } catch (error) {
    console.error("Get session limits error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching session limits",
    });
  }
};

/**
 * @desc    Check if user can book appointments
 * @route   GET /api/session-limits/can-book
 * @access  Private
 */
export const canBookAppointment = async (req, res) => {
  try {
    // Admin users can always book appointments
    if (req.user.role === "admin") {
      return res.status(200).json({
        success: true,
        data: {
          canBook: true,
          message: "Admin users have unlimited booking privileges",
          totalSessions: Infinity,
          sessionsRemaining: Infinity,
          confirmedAppointments: 0,
          availableBookings: Infinity,
          subscriptionStatus: "admin",
        },
      });
    }

    const sessionLimitInfo = await getSessionLimitInfo(req.user._id);

    // Get fresh user data to check subscription status
    const User = (await import("../models/User.js")).default;
    const freshUser = await User.findById(req.user._id).populate(
      "subscription.planId"
    );

    const isSubscriptionActive = freshUser.isSubscriptionActive();
    // Allow booking when subscription is active and either sessionsRemaining > 0
    // or there are available bookings after considering already scheduled/confirmed
    const canBook =
      isSubscriptionActive &&
      (sessionLimitInfo.sessionsRemaining > 0 || sessionLimitInfo.canBookMore);

    let message = "";
    if (!canBook) {
      if (!isSubscriptionActive) {
        message = "Active subscription required to book appointments";
      } else if (sessionLimitInfo.sessionsRemaining <= 0) {
        message = "No sessions remaining in your current plan";
      } else if (!sessionLimitInfo.canBookMore) {
        message =
          "You have already booked the maximum number of appointments allowed";
      }
    } else {
      message = `You can book ${sessionLimitInfo.availableBookings} more appointment(s)`;
    }

    res.status(200).json({
      success: true,
      data: {
        canBook,
        message,
        ...sessionLimitInfo,
        subscriptionStatus: freshUser.subscription?.status || "none",
      },
    });
  } catch (error) {
    console.error("Can book appointment check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking booking eligibility",
    });
  }
};
