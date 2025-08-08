import cron from "node-cron";
import { Appointment, User } from "../models/index.js";
import { config } from "../config/environment.js";
import emailService from "./emailService.js";
import logger from "../utils/logger.js";

/**
 * Appointment Auto-Cancellation Service
 * Automatically cancels appointments that have passed their scheduled time
 * without any admin action (confirmation/completion)
 */
class AppointmentAutoCancelService {
  constructor() {
    this.isProcessing = false;
    this.lastProcessedTime = new Date();
    this.config = config.AUTO_CANCEL;
    this.stats = {
      totalProcessed: 0,
      totalCancelled: 0,
      totalErrors: 0,
      lastRunTime: null,
      sessionRestored: 0,
    };

    // Start the auto-cancellation scheduler if enabled
    if (this.config.ENABLED) {
      this.startAutoCancellationScheduler();
      logger.info("Appointment Auto-Cancellation Service initialized and enabled");
    } else {
      logger.info("Appointment Auto-Cancellation Service initialized but disabled");
    }
  }

  /**
   * Start the automatic cancellation scheduler
   */
  startAutoCancellationScheduler() {
    if (!this.config.ENABLED) {
      logger.warn("Auto-cancellation is disabled in configuration");
      return;
    }

    // Use configured interval or default to every 15 minutes
    const cronPattern = this.config.CHECK_INTERVAL;
    
    cron.schedule(cronPattern, async () => {
      if (!this.isProcessing) {
        await this.processExpiredAppointments();
      } else {
        logger.warn("Auto-cancellation process already running, skipping this interval");
      }
    });

    // Also run immediately on service start (but delayed by 30 seconds to ensure all services are ready)
    if (config.NODE_ENV === "production") {
      setTimeout(() => {
        this.processExpiredAppointments();
      }, 30000);
    }

    logger.info(`Auto-cancellation scheduler started - running with pattern: ${cronPattern}`);
  }

  /**
   * Process and cancel expired appointments
   */
  async processExpiredAppointments() {
    if (this.isProcessing) {
      logger.warn("Auto-cancellation process already in progress");
      return;
    }

    this.isProcessing = true;
    const startTime = new Date();
    
    try {
      logger.info("Starting auto-cancellation process...");

      // Find appointments that should be auto-cancelled
      const expiredAppointments = await this.findExpiredAppointments();
      
      logger.info(`Found ${expiredAppointments.length} expired appointments to process`);

      if (expiredAppointments.length === 0) {
        this.stats.lastRunTime = startTime;
        return;
      }

      const results = {
        successful: [],
        failed: [],
        totalProcessed: expiredAppointments.length,
      };

      // Process each expired appointment
      for (const appointment of expiredAppointments) {
        try {
          await this.autoCancelAppointment(appointment);
          results.successful.push({
            appointmentId: appointment._id,
            patientName: appointment.userId.name,
            originalDateTime: appointment.appointmentDateTime,
          });
        } catch (error) {
          logger.error(`Failed to auto-cancel appointment ${appointment._id}:`, error.message);
          results.failed.push({
            appointmentId: appointment._id,
            error: error.message,
          });
          this.stats.totalErrors++;
        }
      }

      // Update statistics
      this.stats.totalProcessed += results.totalProcessed;
      this.stats.totalCancelled += results.successful.length;
      this.stats.lastRunTime = startTime;

      // Log summary
      const duration = new Date() - startTime;
      logger.info(`Auto-cancellation process completed in ${duration}ms`);
      logger.info(`Results: ${results.successful.length} cancelled, ${results.failed.length} failed`);

      if (results.successful.length > 0) {
        logger.info(`Successfully auto-cancelled appointments: ${results.successful.map(r => r.appointmentId).join(', ')}`);
      }

      if (results.failed.length > 0) {
        logger.error(`Failed to auto-cancel appointments: ${results.failed.map(r => r.appointmentId).join(', ')}`);
      }

    } catch (error) {
      logger.error("Auto-cancellation process failed:", error);
      this.stats.totalErrors++;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Find appointments that should be auto-cancelled
   * Criteria: status = "scheduled" AND appointment time has passed
   */
  async findExpiredAppointments() {
    try {
      const now = new Date();
      
      // Find appointments that are still "scheduled" (no admin action taken)
      // and whose appointment time has already passed
      const expiredAppointments = await Appointment.find({
        status: "scheduled",
        // We need to check both date and time slot
        $expr: {
          $lt: [
            {
              $dateAdd: {
                startDate: {
                  $dateFromParts: {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" }
                  }
                },
                unit: "minute",
                amount: {
                  $add: [
                    // Extract start hour and convert to minutes
                    {
                      $multiply: [
                        {
                          $toInt: {
                            $substr: [
                              { $arrayElemAt: [{ $split: ["$timeSlot", "-"] }, 0] },
                              0,
                              2
                            ]
                          }
                        },
                        60
                      ]
                    },
                    // Extract start minute
                    {
                      $toInt: {
                        $substr: [
                          { $arrayElemAt: [{ $split: ["$timeSlot", "-"] }, 0] },
                          3,
                          2
                        ]
                      }
                    }
                  ]
                }
              }
            },
            now
          ]
        }
      })
      .populate("userId", "name phone email subscription")
      .sort({ date: 1, timeSlot: 1 });

      // Additional filtering using the virtual field for accuracy
      const filteredAppointments = expiredAppointments.filter(appointment => {
        return appointment.isPast;
      });

      return filteredAppointments;
    } catch (error) {
      logger.error("Error finding expired appointments:", error);
      throw error;
    }
  }

  /**
   * Auto-cancel a specific appointment
   */
  async autoCancelAppointment(appointment) {
    try {
      logger.info(`Auto-cancelling appointment ${appointment._id} for patient ${appointment.userId.name}`);

      // Cancel the appointment using the existing cancel method
      const cancellationReason = "Appointment automatically cancelled - no admin action taken and appointment time has passed";
      
      await appointment.cancel(cancellationReason, null); // null for system cancellation

      // Try to restore session if user has a subscription and restoration is enabled
      let sessionRestored = false;
      if (this.config.RESTORE_SESSIONS && appointment.userId.subscription) {
        try {
          await appointment.userId.restoreSession();
          sessionRestored = true;
          this.stats.sessionRestored++;

          // Update appointment record
          appointment.cancellationDetails.sessionRestored = true;
          await appointment.save();
          
          logger.info(`Session restored for user ${appointment.userId.name} after auto-cancellation`);
        } catch (error) {
          logger.error(`Session restoration failed for appointment ${appointment._id}:`, error.message);
          // Continue with cancellation even if session restoration fails
        }
      }

      // Send email notification to patient if email is available and enabled
      if (this.config.NOTIFY_PATIENTS && appointment.userId.email) {
        try {
          await emailService.sendAppointmentCancellationEmail(
            appointment.userId.email,
            appointment.userId.name,
            appointment.date,
            appointment.timeSlot,
            cancellationReason,
            sessionRestored
          );
          
          logger.info(`Cancellation email sent to ${appointment.userId.email}`);
        } catch (error) {
          logger.error(`Failed to send cancellation email for appointment ${appointment._id}:`, error.message);
          // Don't fail the cancellation if email fails
        }
      }

      // Send admin notification (optional - could be configured)
      try {
        await this.notifyAdminOfAutoCancellation(appointment, sessionRestored);
      } catch (error) {
        logger.error(`Failed to send admin notification for auto-cancelled appointment ${appointment._id}:`, error.message);
        // Don't fail the cancellation if admin notification fails
      }

      logger.info(`Successfully auto-cancelled appointment ${appointment._id}`);
      
      return {
        success: true,
        appointmentId: appointment._id,
        sessionRestored,
        emailSent: !!appointment.userId.email,
      };

    } catch (error) {
      logger.error(`Error auto-cancelling appointment ${appointment._id}:`, error);
      throw error;
    }
  }

  /**
   * Notify admin of auto-cancelled appointment
   */
  async notifyAdminOfAutoCancellation(appointment, sessionRestored) {
    try {
      // This could be enhanced to send to specific admin emails
      // For now, we'll just log it as an audit event
      
      const message = `
Appointment Auto-Cancellation Notification

Appointment Details:
- ID: ${appointment._id}
- Patient: ${appointment.userId.name}
- Phone: ${appointment.userId.phone}
- Email: ${appointment.userId.email || 'Not provided'}
- Date: ${appointment.date.toLocaleDateString()}
- Time: ${appointment.timeSlot}
- Session Restored: ${sessionRestored ? 'Yes' : 'No'}

Reason: Appointment time passed without admin confirmation.

This is an automated system notification.
      `;

      // Log as an important event
      logger.warn(`AUTO-CANCELLATION: ${message}`);

      // If you have admin email notification set up, you could send an email here
      // await emailService.sendAdminNotificationEmail(message);

    } catch (error) {
      logger.error("Error sending admin notification:", error);
      // Don't throw here as this is not critical
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      isProcessing: this.isProcessing,
      lastProcessedTime: this.lastProcessedTime,
      serviceUptime: new Date() - this.lastProcessedTime,
    };
  }

  /**
   * Manual trigger for testing purposes
   */
  async manualTrigger() {
    logger.info("Manual trigger for auto-cancellation process");
    await this.processExpiredAppointments();
  }

  /**
   * Stop the service (for graceful shutdown)
   */
  stop() {
    logger.info("Stopping Appointment Auto-Cancellation Service");
    // Note: node-cron doesn't provide a direct way to stop specific jobs
    // In a production environment, you might want to keep track of the job references
  }
}

// Create and export a singleton instance
export const appointmentAutoCancelService = new AppointmentAutoCancelService();
export default appointmentAutoCancelService;