import nodemailer from "nodemailer";
import { emailConfig } from "../config/environment.js";
import logger from "../utils/logger.js";
import AdminNotificationPreferences from "../models/AdminNotificationPreferences.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!emailConfig.auth) {
      logger.warn("Email configuration not available, emails will not be sent");
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth,
      });

      logger.info("Email transporter initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize email transporter", error);
    }
  }

  isAvailable() {
    return !!this.transporter;
  }

  async sendEmail(options) {
    if (!this.transporter) {
      throw new Error("Email service is not available");
    }

    try {
      const mailOptions = {
        from: emailConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent successfully", {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });
      return info;
    } catch (error) {
      logger.error("Failed to send email", error, {
        to: options.to,
        subject: options.subject,
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send email with queue support for reliable delivery
   */
  async sendEmailWithQueue(options, priority = "normal") {
    try {
      // Try to send immediately first
      return await this.sendEmail(options);
    } catch (error) {
      // If immediate send fails, queue for retry
      logger.warn("Immediate email send failed, queuing for retry", {
        to: options.to,
        subject: options.subject,
        error: error.message,
      });

      // Import queue service dynamically to avoid circular dependency
      const { emailQueueService } = await import("./emailQueueService.js");
      return await emailQueueService.queueEmail(options, priority);
    }
  }

  /**
   * Send admin notification with preferences check
   */
  async sendAdminNotification(
    notificationType,
    emailData,
    priority = "normal"
  ) {
    try {
      // Get admin notification preferences
      const adminPrefs = await AdminNotificationPreferences.getPreferences(
        "admin"
      );

      if (!adminPrefs.shouldSendNotification(notificationType)) {
        logger.info(
          `Admin notification skipped due to preferences: ${notificationType}`
        );
        return { skipped: true, reason: "preferences" };
      }

      const recipients = adminPrefs.getNotificationRecipients(notificationType);
      const results = [];

      // Send to all configured recipients
      for (const recipient of recipients) {
        try {
          const result = await this.sendEmailWithQueue(
            {
              ...emailData,
              to: recipient.email,
            },
            priority
          );

          results.push({
            recipient: recipient.email,
            success: true,
            result,
          });
        } catch (error) {
          logger.error(
            `Failed to send admin notification to ${recipient.email}`,
            error
          );
          results.push({
            recipient: recipient.email,
            success: false,
            error: error.message,
          });
        }
      }

      return { sent: true, results };
    } catch (error) {
      logger.error(
        `Failed to send admin notification: ${notificationType}`,
        error
      );
      throw error;
    }
  }

  async sendCredentialsEmail(
    email,
    firstName,
    lastName,
    loginEmail,
    password,
    planName
  ) {
    const subject = "Welcome to Dental Clinic - Your Login Credentials";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Dental Clinic</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .credentials { background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Dental Clinic</h1>
        </div>

        <div class="content">
          <h2>Hello ${firstName} ${lastName}!</h2>

          <p>Thank you for purchasing the <strong>${planName}</strong> subscription plan. Your payment has been processed successfully.</p>

          <p>Your account has been created and you can now access our dental clinic management system using the credentials below:</p>

          <div class="credentials">
            <h3>Your Login Credentials</h3>
            <p><strong>Email:</strong> ${loginEmail}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>

          <p><strong>Important:</strong> Please keep these credentials safe and consider changing your password after your first login.</p>

          <a href="${
            process.env.CORS_ORIGIN || "http://localhost:5173"
          }/login" class="button">Login to Your Account</a>

          <h3>What's Next?</h3>
          <ul>
            <li>Log in to your account using the credentials above</li>
            <li>Complete your profile information</li>
            <li>Book your dental appointments based on your subscription plan</li>
            <li>Manage your appointments and health records</li>
          </ul>

          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>

        <div class="footer">
          <p>This email was sent from Dental Clinic Management System.<br>
          If you didn't purchase a subscription plan, please contact our support team immediately.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Welcome to Dental Clinic!

    Hello ${firstName} ${lastName}!

    Thank you for purchasing the ${planName} subscription plan. Your payment has been processed successfully.

    Your Login Credentials:
    Email: ${loginEmail}
    Password: ${password}

    Please keep these credentials safe and consider changing your password after your first login.

    Login URL: ${process.env.CORS_ORIGIN || "http://localhost:5173"}/login

    What's Next:
    - Log in to your account using the credentials above
    - Complete your profile information
    - Book your dental appointments based on your subscription plan
    - Manage your appointments and health records

    If you have any questions or need assistance, please contact our support team.
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendPaymentConfirmationEmail(
    email,
    firstName,
    lastName,
    planName,
    amount,
    orderId
  ) {
    const subject = "Payment Confirmation - Dental Clinic Subscription";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8f9fa; }
        .payment-details { background-color: white; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Successful!</h1>
        </div>

        <div class="content">
          <h2>Hello ${firstName} ${lastName}!</h2>

          <p>Your payment has been successfully processed. Thank you for choosing our dental clinic services!</p>

          <div class="payment-details">
            <h3>Payment Details</h3>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Amount:</strong> ₹${amount}</p>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString(
              "en-IN"
            )}</p>
          </div>

          <p>You will receive your login credentials in a separate email shortly. Once you receive them, you can start using our services immediately.</p>

          <p>If you have any questions about your subscription or need assistance, please feel free to contact our support team.</p>
        </div>

        <div class="footer">
          <p>Thank you for choosing Dental Clinic Management System!</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Payment Successful!

    Hello ${firstName} ${lastName}!

    Your payment has been successfully processed. Thank you for choosing our dental clinic services!

    Payment Details:
    Plan: ${planName}
    Amount: ₹${amount}
    Order ID: ${orderId}
    Date: ${new Date().toLocaleDateString("en-IN")}

    You will receive your login credentials in a separate email shortly.
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendAppointmentConfirmationEmail(
    email,
    name,
    date,
    timeSlot,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Appointment Confirmation - ${clinicName}`;
    const formattedDate = new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>Your appointment with <strong>${clinicName}</strong> is confirmed. We look forward to seeing you!</p>
          <div class="appointment-details">
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
          </div>
          <p>If you need to reschedule or have any questions, please contact us at your earliest convenience.</p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    Your appointment with ${clinicName} is confirmed.

    Appointment Details:
    - Date: ${formattedDate}
    - Time: ${timeSlot}

    If you need to reschedule, please contact us.

    Regards,
    ${clinicName}
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendAppointmentCancellationEmail(
    email,
    name,
    date,
    timeSlot,
    reason = null,
    sessionRestored = false,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Appointment Cancelled - ${clinicName}`;
    const formattedDate = new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .session-info { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Cancelled</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>We regret to inform you that your appointment with <strong>${clinicName}</strong> has been cancelled.</p>
          <div class="appointment-details">
            <h3>Cancelled Appointment Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>
          ${
            sessionRestored
              ? `
          <div class="session-info">
            <h3>Session Restored</h3>
            <p>Good news! Your session has been restored to your subscription and you can book a new appointment at your convenience.</p>
          </div>
          `
              : ""
          }
          <p>We apologize for any inconvenience caused. Please feel free to book a new appointment or contact us if you have any questions.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    We regret to inform you that your appointment with ${clinicName} has been cancelled.

    Cancelled Appointment Details:
    - Date: ${formattedDate}
    - Time: ${timeSlot}
    ${reason ? `- Reason: ${reason}` : ""}

    ${
      sessionRestored
        ? "Good news! Your session has been restored to your subscription and you can book a new appointment at your convenience."
        : ""
    }

    We apologize for any inconvenience caused. Please feel free to book a new appointment or contact us if you have any questions.

    Regards,
    ${clinicName}
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendAdminBookingNotificationEmail(
    appointmentData,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `New Appointment Booked - ${clinicName}`;
    const formattedDate = new Date(appointmentData.date).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .patient-details { background-color: #f0f8ff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Appointment Booked</h1>
        </div>
        <div class="content">
          <h2>New Appointment Alert</h2>
          <p>A new appointment has been booked in the system.</p>
          <div class="appointment-details">
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${appointmentData.timeSlot}</p>
            <p><strong>Session Number:</strong> ${
              appointmentData.sessionNumber || "N/A"
            }</p>
            ${
              appointmentData.notes
                ? `<p><strong>Notes:</strong> ${appointmentData.notes}</p>`
                : ""
            }
          </div>
          <div class="patient-details">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${appointmentData.userId.name}</p>
            <p><strong>Phone:</strong> ${appointmentData.userId.phone}</p>
            <p><strong>Email:</strong> ${appointmentData.userId.email}</p>
          </div>
          <p>Please review the appointment details and prepare accordingly.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ${clinicName} Management System.</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    New Appointment Booked - ${clinicName}

    A new appointment has been booked in the system.

    Appointment Details:
    - Date: ${formattedDate}
    - Time: ${appointmentData.timeSlot}
    - Session Number: ${appointmentData.sessionNumber || "N/A"}
    ${appointmentData.notes ? `- Notes: ${appointmentData.notes}` : ""}

    Patient Information:
    - Name: ${appointmentData.userId.name}
    - Phone: ${appointmentData.userId.phone}
    - Email: ${appointmentData.userId.email}

    Please review the appointment details and prepare accordingly.
    `;

    // Send admin notification with preferences check
    return await this.sendAdminNotification(
      "new_booking",
      {
        subject,
        html,
        text,
      },
      "high"
    );
  }

  async sendAppointmentRescheduleNotificationEmail(
    email,
    name,
    oldDate,
    oldTimeSlot,
    newDate,
    newTimeSlot,
    reason = null,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Appointment Rescheduled - ${clinicName}`;
    const formattedOldDate = new Date(oldDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedNewDate = new Date(newDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
        .old-details { background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .new-details { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Rescheduled</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>Your appointment with <strong>${clinicName}</strong> has been rescheduled.</p>
          
          <div class="old-details">
            <h3>Previous Appointment</h3>
            <p><strong>Date:</strong> ${formattedOldDate}</p>
            <p><strong>Time:</strong> ${oldTimeSlot}</p>
          </div>
          
          <div class="new-details">
            <h3>New Appointment</h3>
            <p><strong>Date:</strong> ${formattedNewDate}</p>
            <p><strong>Time:</strong> ${newTimeSlot}</p>
          </div>
          
          ${
            reason
              ? `
          <div class="appointment-details">
            <h3>Reason for Reschedule</h3>
            <p>${reason}</p>
          </div>
          `
              : ""
          }
          
          <p>We apologize for any inconvenience caused. Please make note of your new appointment time.</p>
          <p>If you have any questions or need to make further changes, please contact us.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    Your appointment with ${clinicName} has been rescheduled.

    Previous Appointment:
    - Date: ${formattedOldDate}
    - Time: ${oldTimeSlot}

    New Appointment:
    - Date: ${formattedNewDate}
    - Time: ${newTimeSlot}

    ${reason ? `Reason for Reschedule: ${reason}` : ""}

    We apologize for any inconvenience caused. Please make note of your new appointment time.

    If you have any questions or need to make further changes, please contact us.

    Regards,
    ${clinicName}
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendAdminRescheduleNotificationEmail(
    appointmentData,
    oldDate,
    oldTimeSlot,
    reason = null,
    clinicName = "Teerthanker Dental Care"
  ) {
    const adminEmail = "support@teerthankeraadinathbrightdentalcare.in";
    const subject = `Appointment Rescheduled - ${clinicName}`;
    const formattedOldDate = new Date(oldDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedNewDate = new Date(appointmentData.date).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .old-details { background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .new-details { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .patient-details { background-color: #f0f8ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Rescheduled</h1>
        </div>
        <div class="content">
          <h2>Appointment Reschedule Alert</h2>
          <p>An appointment has been rescheduled in the system.</p>
          
          <div class="patient-details">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${appointmentData.userId.name}</p>
            <p><strong>Phone:</strong> ${appointmentData.userId.phone}</p>
            <p><strong>Email:</strong> ${appointmentData.userId.email}</p>
          </div>
          
          <div class="old-details">
            <h3>Previous Appointment</h3>
            <p><strong>Date:</strong> ${formattedOldDate}</p>
            <p><strong>Time:</strong> ${oldTimeSlot}</p>
          </div>
          
          <div class="new-details">
            <h3>New Appointment</h3>
            <p><strong>Date:</strong> ${formattedNewDate}</p>
            <p><strong>Time:</strong> ${appointmentData.timeSlot}</p>
            <p><strong>Session Number:</strong> ${
              appointmentData.sessionNumber || "N/A"
            }</p>
          </div>
          
          ${
            reason
              ? `
          <div class="appointment-details">
            <h3>Reason for Reschedule</h3>
            <p>${reason}</p>
          </div>
          `
              : ""
          }
          
          <p>Please update your schedule accordingly.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from ${clinicName} Management System.</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Appointment Rescheduled - ${clinicName}

    An appointment has been rescheduled in the system.

    Patient Information:
    - Name: ${appointmentData.userId.name}
    - Phone: ${appointmentData.userId.phone}
    - Email: ${appointmentData.userId.email}

    Previous Appointment:
    - Date: ${formattedOldDate}
    - Time: ${oldTimeSlot}

    New Appointment:
    - Date: ${formattedNewDate}
    - Time: ${appointmentData.timeSlot}
    - Session Number: ${appointmentData.sessionNumber || "N/A"}

    ${reason ? `Reason for Reschedule: ${reason}` : ""}

    Please update your schedule accordingly.
    `;

    await this.sendEmail({
      to: adminEmail,
      subject,
      html,
      text,
    });
  }

  async sendSubscriptionExtensionEmail(
    email,
    name,
    planName,
    previousEndDate,
    newEndDate,
    months,
    reason = null,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Subscription Extended - ${clinicName}`;
    const formattedPreviousDate = new Date(previousEndDate).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    const formattedNewDate = new Date(newEndDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .extension-details { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Extended!</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>Great news! Your <strong>${planName}</strong> subscription has been extended.</p>
          
          <div class="extension-details">
            <h3>Extension Details</h3>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Extension Period:</strong> ${months} month${
      months > 1 ? "s" : ""
    }</p>
            <p><strong>Previous End Date:</strong> ${formattedPreviousDate}</p>
            <p><strong>New End Date:</strong> ${formattedNewDate}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>
          
          <p>You can continue to enjoy all the benefits of your subscription plan until the new end date.</p>
          <p>If you have any questions about your subscription, please feel free to contact us.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing ${clinicName}!</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    Great news! Your ${planName} subscription has been extended.

    Extension Details:
    - Plan: ${planName}
    - Extension Period: ${months} month${months > 1 ? "s" : ""}
    - Previous End Date: ${formattedPreviousDate}
    - New End Date: ${formattedNewDate}
    ${reason ? `- Reason: ${reason}` : ""}

    You can continue to enjoy all the benefits of your subscription plan until the new end date.

    If you have any questions about your subscription, please feel free to contact us.

    Thank you for choosing ${clinicName}!
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendSubscriptionPlanChangeEmail(
    email,
    name,
    previousPlan,
    newPlan,
    previousSessions,
    newSessions,
    reason = null,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Subscription Plan Changed - ${clinicName}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .plan-details { background-color: #f0f8ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .session-info { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Plan Changed</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>Your subscription plan has been successfully changed.</p>
          
          <div class="plan-details">
            <h3>Plan Change Details</h3>
            <p><strong>Previous Plan:</strong> ${previousPlan}</p>
            <p><strong>New Plan:</strong> ${newPlan}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>
          
          <div class="session-info">
            <h3>Session Information</h3>
            <p><strong>Previous Sessions Remaining:</strong> ${previousSessions}</p>
            <p><strong>New Sessions Remaining:</strong> ${newSessions}</p>
            ${
              newSessions !== previousSessions
                ? `<p><em>Your session count has been adjusted based on the new plan.</em></p>`
                : `<p><em>Your session count remains unchanged.</em></p>`
            }
          </div>
          
          <p>You can now enjoy the benefits of your new subscription plan. All changes are effective immediately.</p>
          <p>If you have any questions about your new plan, please feel free to contact us.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing ${clinicName}!</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    Your subscription plan has been successfully changed.

    Plan Change Details:
    - Previous Plan: ${previousPlan}
    - New Plan: ${newPlan}
    ${reason ? `- Reason: ${reason}` : ""}

    Session Information:
    - Previous Sessions Remaining: ${previousSessions}
    - New Sessions Remaining: ${newSessions}
    ${
      newSessions !== previousSessions
        ? "Your session count has been adjusted based on the new plan."
        : "Your session count remains unchanged."
    }

    You can now enjoy the benefits of your new subscription plan. All changes are effective immediately.

    If you have any questions about your new plan, please feel free to contact us.

    Thank you for choosing ${clinicName}!
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendSubscriptionCancellationEmail(
    email,
    name,
    planName,
    endDate,
    immediate,
    sessionsRemaining,
    reason = null,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Subscription Cancelled - ${clinicName}`;
    const formattedEndDate = new Date(endDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .cancellation-details { background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Cancelled</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>We're sorry to inform you that your <strong>${planName}</strong> subscription has been cancelled.</p>
          
          <div class="cancellation-details">
            <h3>Cancellation Details</h3>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Cancellation Type:</strong> ${
              immediate ? "Immediate" : "End of Period"
            }</p>
            <p><strong>Access Until:</strong> ${
              immediate ? "Immediately" : formattedEndDate
            }</p>
            <p><strong>Sessions Remaining:</strong> ${
              immediate ? "0 (forfeited)" : sessionsRemaining
            }</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>
          
          ${
            immediate
              ? `<p>Your subscription has been cancelled immediately and you no longer have access to the services.</p>`
              : `<p>Your subscription will remain active until ${formattedEndDate}. You can continue to use your remaining ${sessionsRemaining} sessions until then.</p>`
          }
          
          <p>If you believe this cancellation was made in error or if you have any questions, please contact us immediately.</p>
          <p>We hope to serve you again in the future.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing ${clinicName}.</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    We're sorry to inform you that your ${planName} subscription has been cancelled.

    Cancellation Details:
    - Plan: ${planName}
    - Cancellation Type: ${immediate ? "Immediate" : "End of Period"}
    - Access Until: ${immediate ? "Immediately" : formattedEndDate}
    - Sessions Remaining: ${immediate ? "0 (forfeited)" : sessionsRemaining}
    ${reason ? `- Reason: ${reason}` : ""}

    ${
      immediate
        ? "Your subscription has been cancelled immediately and you no longer have access to the services."
        : `Your subscription will remain active until ${formattedEndDate}. You can continue to use your remaining ${sessionsRemaining} sessions until then.`
    }

    If you believe this cancellation was made in error or if you have any questions, please contact us immediately.

    We hope to serve you again in the future.

    Thank you for choosing ${clinicName}.
    `;

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
