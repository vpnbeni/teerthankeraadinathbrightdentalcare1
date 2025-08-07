import { User, Plan, Payment } from "../models/index.js";
import emailService from "../services/emailService.js";
import mongoose from "mongoose";

/**
 * @desc    Extend user subscription
 * @route   PUT /api/admin/users/:id/subscription/extend
 * @access  Private (Admin)
 */
export const extendSubscription = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { months, reason } = req.body;

    // Validation
    if (!months || months <= 0) {
      return res.status(400).json({
        success: false,
        message: "Extension months must be a positive number",
      });
    }

    // Find user with subscription
    const user = await User.findById(userId).populate("subscription.planId");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.subscription || !user.subscription.planId) {
      return res.status(400).json({
        success: false,
        message: "User does not have an active subscription",
      });
    }

    // Store original subscription data for email
    const originalEndDate = user.subscription.endDate;

    // Extend subscription
    const currentEndDate = new Date(user.subscription.endDate);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    user.subscription.endDate = newEndDate;

    // If subscription was expired, reactivate it
    if (user.subscription.status === "expired" && newEndDate > new Date()) {
      user.subscription.status = "active";
    }

    await user.save();

    // Send email notification
    if (user.email) {
      try {
        await emailService.sendSubscriptionExtensionEmail(
          user.email,
          user.name,
          user.subscription.planId.name,
          originalEndDate,
          newEndDate,
          months,
          reason
        );
      } catch (emailError) {
        console.error(
          "Failed to send subscription extension email:",
          emailError
        );
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Subscription extended successfully",
      data: {
        subscription: {
          planId: user.subscription.planId._id,
          planName: user.subscription.planId.name,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
          sessionsRemaining: user.subscription.sessionsRemaining,
          status: user.subscription.status,
        },
        extensionDetails: {
          months,
          reason,
          previousEndDate: originalEndDate,
          newEndDate,
        },
      },
    });
  } catch (error) {
    console.error("Extend subscription error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while extending subscription",
    });
  }
};

/**
 * @desc    Change user subscription plan
 * @route   PUT /api/admin/users/:id/subscription/change-plan
 * @access  Private (Admin)
 */
export const changeSubscriptionPlan = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { newPlanId, reason, adjustSessions = true } = req.body;

    // Validation
    if (!newPlanId) {
      return res.status(400).json({
        success: false,
        message: "New plan ID is required",
      });
    }

    // Find user and new plan
    const [user, newPlan] = await Promise.all([
      User.findById(userId).populate("subscription.planId"),
      Plan.findById(newPlanId),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!newPlan || !newPlan.isActive) {
      return res.status(404).json({
        success: false,
        message: "New plan not found or inactive",
      });
    }

    if (!user.subscription || !user.subscription.planId) {
      return res.status(400).json({
        success: false,
        message: "User does not have an active subscription",
      });
    }

    // Store original subscription data for email
    const originalPlan = user.subscription.planId;
    const originalSessions = user.subscription.sessionsRemaining;

    // Calculate new session count if adjustSessions is true
    let newSessionsRemaining = user.subscription.sessionsRemaining;
    if (adjustSessions) {
      // Calculate session ratio and adjust
      const sessionRatio = newPlan.sessions / originalPlan.sessions;
      newSessionsRemaining = Math.max(
        1,
        Math.round(originalSessions * sessionRatio)
      );
    }

    // Update subscription
    user.subscription.planId = newPlanId;
    user.subscription.sessionsRemaining = newSessionsRemaining;

    // If subscription was expired but new plan has sessions, reactivate
    if (
      user.subscription.status === "expired" &&
      newSessionsRemaining > 0 &&
      user.subscription.endDate > new Date()
    ) {
      user.subscription.status = "active";
    }

    await user.save();

    // Send email notification
    if (user.email) {
      try {
        await emailService.sendSubscriptionPlanChangeEmail(
          user.email,
          user.name,
          originalPlan.name,
          newPlan.name,
          originalSessions,
          newSessionsRemaining,
          reason
        );
      } catch (emailError) {
        console.error("Failed to send plan change email:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Subscription plan changed successfully",
      data: {
        subscription: {
          planId: user.subscription.planId,
          planName: newPlan.name,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
          sessionsRemaining: user.subscription.sessionsRemaining,
          status: user.subscription.status,
        },
        changeDetails: {
          previousPlan: originalPlan.name,
          newPlan: newPlan.name,
          previousSessions: originalSessions,
          newSessions: newSessionsRemaining,
          reason,
        },
      },
    });
  } catch (error) {
    console.error("Change subscription plan error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "User or plan not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while changing subscription plan",
    });
  }
};

/**
 * @desc    Cancel user subscription
 * @route   PUT /api/admin/users/:id/subscription/cancel
 * @access  Private (Admin)
 */
export const cancelSubscription = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const { reason, immediate = false } = req.body;

    // Find user with subscription
    const user = await User.findById(userId).populate("subscription.planId");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.subscription || !user.subscription.planId) {
      return res.status(400).json({
        success: false,
        message: "User does not have an active subscription",
      });
    }

    if (user.subscription.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled",
      });
    }

    // Store original subscription data for email
    const originalStatus = user.subscription.status;
    const originalEndDate = user.subscription.endDate;
    const planName = user.subscription.planId.name;
    const sessionsRemaining = user.subscription.sessionsRemaining;

    // Cancel subscription
    user.subscription.status = "cancelled";

    // If immediate cancellation, set end date to now
    if (immediate) {
      user.subscription.endDate = new Date();
      user.subscription.sessionsRemaining = 0;
    }

    await user.save();

    // Send email notification
    if (user.email) {
      try {
        await emailService.sendSubscriptionCancellationEmail(
          user.email,
          user.name,
          planName,
          originalEndDate,
          immediate,
          sessionsRemaining,
          reason
        );
      } catch (emailError) {
        console.error(
          "Failed to send subscription cancellation email:",
          emailError
        );
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: {
        subscription: {
          planId: user.subscription.planId._id,
          planName,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
          sessionsRemaining: user.subscription.sessionsRemaining,
          status: user.subscription.status,
        },
        cancellationDetails: {
          reason,
          immediate,
          previousStatus: originalStatus,
          previousEndDate: originalEndDate,
          previousSessions: sessionsRemaining,
        },
      },
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while cancelling subscription",
    });
  }
};
