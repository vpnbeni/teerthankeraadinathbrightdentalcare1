import cron from "node-cron";
import { Appointment, User } from "../models/index.js";
import { config } from "../config/environment.js";
import emailService from "./emailService.js";
import logger from "../utils/logger.js";

/**
 * Appointment Expiry Service
 * Automatically marks appointments as "expired" when their scheduled time has passed
 * without admin confirmation, but keeps them available for potential rescheduling
 */
class AppointmentExpiryService {
  constructor() {
    this.isProcessing = false;
    this.lastProcessedTime = new Date();
    this.config = config.APPOINTMENT_EXPIRY || {
      ENABLED: true,
      CHECK_INTERVAL: "*/10 * * * *", // Every 10 minutes
      GRACE_PERIOD_MINUTES: 15, // 15 minute grace period
      NOTIFY_PATIENTS: true,
    };
    this.stats = {
      totalProcessed: 0,
      totalExpired: 0,
      totalErrors: 0,
      lastRunTime: null,
    };

    // Delay initialization to ensure database is connected
    setTimeout(() => {
      // Start the expiry scheduler if enabled
      if (this.config.ENABLED) {
        this.startExpiryScheduler();
        logger.info(
          "Appointment Expiry Service initialized and enabled"
        );
      } else {
        logger.info(
          "Appointment Expiry Service initialized but disabled"
        );
      }
    }, 2000); // 2 second delay
  }

  /**
   * Start the automatic expiry scheduler
   */
  startExpiryScheduler() {
    if (!this.config.ENABLED) {
      logger.warn("Appointment expiry is disabled in configuration");
      return;
    }

    // Use configured interval or default to every 10 minutes
    const cronPattern = this.config.CHECK_INTERVAL;

    cron.schedule(cronPattern, async () => {
      if (!this.isProcessing) {
        await this.processExpiredAppointments();
      } else {
        logger.warn(
          "Appointment expiry process already running, skipping this interval"
        );
      }
    });

    // Also run immediately on service start (but delayed by 30 seconds to ensure all services are ready)
    if (config.NODE_ENV === "production") {
      setTimeout(() => {
        this.processExpiredAppointments();
      }, 30000);
    }

    logger.info(
      `Appointment expiry scheduler started - running with pattern: ${cronPattern}`
    );
  }

  /**
   * Process and expire past scheduled appointments
   */
  async processExpiredAppointments() {
    if (this.isProcessing) {
      logger.warn("Appointment expiry process already in progress");
      return;
    }

    this.isProcessing = true;
    const startTime = new Date();

    try {
      logger.info("Starting appointment expiry process...");

      // Find appointments that should be expired
      const expiredAppointments = await this.findExpiredAppointments();

      logger.info(
        `Found ${expiredAppointments.length} scheduled appointments to expire`
      );

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
          await this.expireAppointment(appointment);
          results.successful.push({
            appointmentId: appointment._id,
            patientName: appointment.userId.name,
            originalDateTime: appointment.appointmentDateTime,
          });
        } catch (error) {
          logger.error(
            `Failed to expire appointment ${appointment._id}:`,
            error.message
          );
          results.failed.push({
            appointmentId: appointment._id,
            error: error.message,
          });
          this.stats.totalErrors++;
        }
      }

      // Update statistics
      this.stats.totalProcessed += results.totalProcessed;
      this.stats.totalExpired += results.successful.length;
      this.stats.lastRunTime = startTime;

      // Log summary
      const duration = new Date() - startTime;
      logger.info(`Appointment expiry process completed in ${duration}ms`);
      logger.info(
        `Results: ${results.successful.length} expired, ${results.failed.length} failed`
      );

      if (results.successful.length > 0) {
        logger.info(
          `Successfully expired appointments: ${results.successful
            .map((r) => r.appointmentId)
            .join(", ")}`
        );
      }

      if (results.failed.length > 0) {
        logger.error(
          `Failed to expire appointments: ${results.failed
            .map((r) => r.appointmentId)
            .join(", ")}`
        );
      }
    } catch (error) {
      logger.error("Appointment expiry process failed:", error);
      this.stats.totalErrors++;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Find appointments that should be expired
   * Criteria: status = "scheduled" AND appointment time + grace period has passed
   */
  async findExpiredAppointments() {
    try {
      const now = new Date();
      const gracePeriodMs = (this.config.GRACE_PERIOD_MINUTES || 0) * 60 * 1000;

      // Find appointments that are still "scheduled" (no admin action taken)
      // and whose appointment time + grace period has already passed
      const expiredAppointments = await Appointment.find({
        status: "scheduled",
        // We need to check both date and time slot with grace period
        $expr: {
          $lt: [
            {
              $dateAdd: {
                startDate: {
                  $dateAdd: {
                    startDate: {
                      $dateFromParts: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" },
                      },
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
                                  {
                                    $arrayElemAt: [
                                      { $split: ["$timeSlot", "-"] },
                                      0,
                                    ],
                                  },
                                  0,
                                  2,
                                ],
                              },
                            },
                            60,
                          ],
                        },
                        // Extract start minute
                        {
                          $toInt: {
                            $substr: [
                              { $arrayElemAt: [{ $split: ["$timeSlot", "-"] }, 0] },
                              3,
                              2,
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                unit: "millisecond",
                amount: gracePeriodMs,
              },
            },
            now,
          ],
        },
      })
        .populate("userId", "name phone email subscription")
        .sort({ date: 1, timeSlot: 1 });

      // Additional filtering using the virtual field for accuracy and exclude deleted users
      const filteredAppointments = expiredAppointments.filter((appointment) => {
        if (!appointment.userId) return false;
        
        const appointmentDateTime = appointment.appointmentDateTime;
        if (!appointmentDateTime) return false;
        
        const graceTime = new Date(appointmentDateTime.getTime() + gracePeriodMs);
        return graceTime < now;
      });

      return filteredAppointments;
    } catch (error) {
      logger.error("Error finding expired appointments:", error);
      throw error;
    }
  }

  /**
   * Expire a specific appointment
   */
  async expireAppointment(appointment) {
    try {
      logger.info(
        `Expiring appointment ${appointment._id} for patient ${appointment.userId.name}`
      );

      // Expire the appointment using the new expire method
      const expiryReason =
        `Appointment expired - scheduled time passed without admin confirmation (Grace period: ${this.config.GRACE_PERIOD_MINUTES || 0} minutes)`;

      await appointment.expire(expiryReason);

      // Send email notification to patient if email is available and enabled
      if (this.config.NOTIFY_PATIENTS && appointment.userId.email) {
        try {
          await this.sendExpiryNotificationEmail(appointment);
          logger.info(`Expiry notification email sent to ${appointment.userId.email}`);
        } catch (error) {
          logger.error(
            `Failed to send expiry notification email for appointment ${appointment._id}:`,
            error.message
          );
          // Don't fail the expiry if email fails
        }
      }

      logger.info(`Successfully expired appointment ${appointment._id}`);

      return {
        success: true,
        appointmentId: appointment._id,
        emailSent: !!appointment.userId.email,
      };
    } catch (error) {
      logger.error(
        `Error expiring appointment ${appointment._id}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Send expiry notification email to patient
   */
  async sendExpiryNotificationEmail(appointment) {
    try {
      const user = appointment.userId;
      const clinicName = config.CLINIC_NAME || "Teerthanker Dental Care";
      const subject = `Appointment Update - ${clinicName}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">Appointment Status Update</h2>
          
          <p>Dear ${user.name},</p>
          
          <p>We wanted to inform you that your scheduled appointment has expired as the appointment time has passed without confirmation from our staff.</p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Appointment Details:</h3>
            <p><strong>Date:</strong> ${appointment.date.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.timeSlot}</p>
            <p><strong>Status:</strong> Expired</p>
          </div>
          
          <p><strong>What does this mean?</strong></p>
          <ul>
            <li>Your appointment slot is no longer reserved</li>
            <li>This appointment will not count towards your session quota</li>
            <li>You can book a new appointment for a future date</li>
          </ul>
          
          <p>If you would like to reschedule or book a new appointment, please contact us or use our online booking system.</p>
          
          <p>We apologize for any inconvenience and look forward to serving you soon.</p>
          
          <p>Best regards,<br>
          ${clinicName} Team</p>
        </div>
      `;

      const emailText = `
Dear ${user.name},

We wanted to inform you that your scheduled appointment has expired as the appointment time has passed without confirmation from our staff.

Appointment Details:
Date: ${appointment.date.toLocaleDateString()}
Time: ${appointment.timeSlot}
Status: Expired

What does this mean?
- Your appointment slot is no longer reserved
- This appointment will not count towards your session quota
- You can book a new appointment for a future date

If you would like to reschedule or book a new appointment, please contact us or use our online booking system.

We apologize for any inconvenience and look forward to serving you soon.

Best regards,
${clinicName} Team
      `;

      await emailService.sendEmail({
        to: user.email,
        subject,
        html: emailHtml,
        text: emailText,
      });

    } catch (error) {
      logger.error("Error sending expiry notification email:", error);
      throw error;
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
    logger.info("Manual trigger for appointment expiry process");
    await this.processExpiredAppointments();
  }

  /**
   * Stop the service (for graceful shutdown)
   */
  stop() {
    logger.info("Stopping Appointment Expiry Service");
    // Note: node-cron doesn't provide a direct way to stop specific jobs
    // In a production environment, you might want to keep track of the job references
  }
}

// Create and export a singleton instance
export const appointmentExpiryService = new AppointmentExpiryService();
export default appointmentExpiryService;
