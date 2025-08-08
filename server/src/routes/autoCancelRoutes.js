import express from "express";
import { auth } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminAuth.js";
import appointmentAutoCancelService from "../services/appointmentAutoCancelService.js";
import logger from "../utils/logger.js";

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(auth);
router.use(adminOnly);

/**
 * @desc    Get auto-cancellation service statistics
 * @route   GET /api/admin/auto-cancel/stats
 * @access  Private (Admin only)
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = appointmentAutoCancelService.getStats();
    
    res.status(200).json({
      success: true,
      data: stats,
      message: "Auto-cancellation statistics retrieved successfully",
    });
  } catch (error) {
    logger.error("Error retrieving auto-cancellation stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve auto-cancellation statistics",
      error: error.message,
    });
  }
});

/**
 * @desc    Manually trigger auto-cancellation process
 * @route   POST /api/admin/auto-cancel/trigger
 * @access  Private (Admin only)
 */
router.post("/trigger", async (req, res) => {
  try {
    logger.info(`Manual auto-cancellation trigger by admin: ${req.user.name} (${req.user._id})`);
    
    // Get stats before processing
    const statsBefore = appointmentAutoCancelService.getStats();
    
    // Trigger the process
    await appointmentAutoCancelService.manualTrigger();
    
    // Get stats after processing
    const statsAfter = appointmentAutoCancelService.getStats();
    
    const processed = statsAfter.totalProcessed - statsBefore.totalProcessed;
    const cancelled = statsAfter.totalCancelled - statsBefore.totalCancelled;
    
    res.status(200).json({
      success: true,
      data: {
        processed,
        cancelled,
        statsBefore,
        statsAfter,
      },
      message: `Manual trigger completed. Processed: ${processed}, Cancelled: ${cancelled}`,
    });
  } catch (error) {
    logger.error("Error in manual auto-cancellation trigger:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger auto-cancellation process",
      error: error.message,
    });
  }
});

/**
 * @desc    Get auto-cancellation configuration
 * @route   GET /api/admin/auto-cancel/config
 * @access  Private (Admin only)
 */
router.get("/config", async (req, res) => {
  try {
    const { config } = await import("../config/environment.js");
    
    res.status(200).json({
      success: true,
      data: {
        autoCancelConfig: config.AUTO_CANCEL,
        environment: config.NODE_ENV,
      },
      message: "Auto-cancellation configuration retrieved successfully",
    });
  } catch (error) {
    logger.error("Error retrieving auto-cancellation config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve auto-cancellation configuration",
      error: error.message,
    });
  }
});

/**
 * @desc    Get appointments that would be auto-cancelled (preview)
 * @route   GET /api/admin/auto-cancel/preview
 * @access  Private (Admin only)
 */
router.get("/preview", async (req, res) => {
  try {
    // Use the same logic as the auto-cancel service to find expired appointments
    const now = new Date();
    
    const expiredAppointments = await appointmentAutoCancelService.findExpiredAppointments();
    
    const preview = expiredAppointments.map(appointment => ({
      _id: appointment._id,
      patientName: appointment.userId.name,
      patientPhone: appointment.userId.phone,
      patientEmail: appointment.userId.email,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      appointmentDateTime: appointment.appointmentDateTime,
      status: appointment.status,
      minutesPastDue: Math.floor((now - appointment.appointmentDateTime) / (1000 * 60)),
      hasSubscription: !!appointment.userId.subscription,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        count: preview.length,
        appointments: preview,
        previewTime: now,
      },
      message: `Found ${preview.length} appointments that would be auto-cancelled`,
    });
  } catch (error) {
    logger.error("Error generating auto-cancellation preview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate auto-cancellation preview",
      error: error.message,
    });
  }
});

export default router;