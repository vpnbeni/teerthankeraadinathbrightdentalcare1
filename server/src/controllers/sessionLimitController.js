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

    console.log("Session Limit Info:", sessionLimitInfo);

    res.status(200).json({
      success: true,
      data: {
        ...sessionLimitInfo,
        subscriptionStatus: req.user.subscription?.status || "none",
        planName: req.user.subscription?.planId?.name || null,
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

    const canBook =
      req.user.isSubscriptionActive() && sessionLimitInfo.canBookMore;

    let message = "";
    if (!canBook) {
      if (!req.user.isSubscriptionActive()) {
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
        subscriptionStatus: req.user.subscription?.status || "none",
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
