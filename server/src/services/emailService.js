import nodemailer from "nodemailer";
import { emailConfig } from "../config/environment.js";
import logger from "../utils/logger.js";
import AdminNotificationPreferences from "../models/AdminNotificationPreferences.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";

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

  /**
   * Get admin notification email from settings
   */
  async getAdminNotificationEmail() {
    try {
      const setting = await Settings.getSetting("general", "admin-config");
      if (setting?.generalSettings?.has("notificationEmail")) {
        const email = setting.generalSettings.get("notificationEmail");
        return email?.trim() || null;
      }
      return null;
    } catch (error) {
      logger.error("Failed to get admin notification email:", error);
      return null;
    }
  }

  /**
   * Send admin notification copy for transactional emails
   */
  async sendAdminNotificationCopy({
    patientEmail,
    patientName,
    appointmentDate,
    appointmentTime,
    type,
    clinicName = "Teerthanker Dental Care",
    additionalInfo = "",
  }) {
    try {
      const adminEmail = await this.getAdminNotificationEmail();
      
      if (!adminEmail) {
        logger.info("Admin notification email not configured, skipping admin notification");
        return { skipped: true, reason: "not_configured" };
      }

      const typeMap = {
        booking: "New Appointment Booking",
        confirmation: "Appointment Confirmed",
        cancellation: "Appointment Cancelled",
        completion: "Appointment Completed",
        reschedule: "Appointment Rescheduled",
      };

      const subject = `${typeMap[type] || "Appointment Update"} - ${clinicName}`;

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
          .header { background-color: #346870; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .notification-details { background-color: #f0f8ff; padding: 15px; border-left: 4px solid #346870; margin: 20px 0; }
          .patient-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${typeMap[type] || "Appointment Update"}</h1>
            <p>Admin Notification</p>
          </div>
          <div class="content">
            <h2>Dear Admin,</h2>
            <p>This is an automated notification regarding a ${type} in the system.</p>
            
            <div class="patient-details">
              <h3>Patient Information</h3>
              <p><strong>Name:</strong> ${patientName}</p>
              <p><strong>Email:</strong> ${patientEmail}</p>
            </div>
            
            <div class="notification-details">
              <h3>Appointment Details</h3>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Action:</strong> ${typeMap[type] || "Updated"}</p>
              ${additionalInfo ? `<p><strong>Additional Info:</strong> ${additionalInfo}</p>` : ""}
            </div>
            
            <p>Please review the appointment details and take appropriate action if needed.</p>
          </div>
          <div class="footer">
            <p>This is an automated admin notification from ${clinicName} Management System.</p>
            <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
      `;

      const text = `
      ${typeMap[type] || "Appointment Update"} - Admin Notification

      Dear Admin,

      This is an automated notification regarding a ${type} in the system.

      Patient Information:
      - Name: ${patientName}
      - Email: ${patientEmail}

      Appointment Details:
      - Date: ${appointmentDate}
      - Time: ${appointmentTime}
      - Action: ${typeMap[type] || "Updated"}
      ${additionalInfo ? `- Additional Info: ${additionalInfo}` : ""}

      Please review the appointment details and take appropriate action if needed.

      This is an automated admin notification from ${clinicName} Management System.
      `;

      await this.sendEmail({
        to: adminEmail,
        subject,
        html,
        text,
      });

      logger.info("Admin notification sent", {
        adminEmail,
        type,
        patientName,
        appointmentDate,
        appointmentTime,
      });

      return { sent: true, adminEmail };
    } catch (error) {
      logger.error("Failed to send admin notification copy:", error);
      // Don't throw error - admin notification failure shouldn't break patient email
      return { error: error.message };
    }
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
      // Find the first admin user to get their ObjectId
      const adminUser = await User.findOne({ role: "admin" });
      if (!adminUser) {
        logger.warn("No admin user found for notification preferences");
        // Fallback: send to default email without preferences
        return await this.sendEmailWithQueue({
          ...emailData,
          to: "support@teerthankeraadinathbrightdentalcare.in",
        }, priority);
      }

      // Get admin notification preferences using the admin user's ObjectId
      const adminPrefs = await AdminNotificationPreferences.getPreferences(
        adminUser._id
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

  async sendAppointmentScheduledEmail(
    email,
    name,
    date,
    timeSlot,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Appointment Scheduled - ${clinicName}`;
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
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .appointment-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Scheduled!</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>Your appointment with <strong>${clinicName}</strong> has been scheduled and is pending approval. We will notify you once it's confirmed.</p>
          <div class="appointment-details">
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Status:</strong> Pending Approval</p>
          </div>
          <p>You will receive a confirmation email once our team approves your appointment. If you need to reschedule or have any questions, please contact us at your earliest convenience.</p>
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

    Your appointment with ${clinicName} has been scheduled and is pending approval.

    Appointment Details:
    - Date: ${formattedDate}
    - Time: ${timeSlot}
    - Status: Pending Approval

    You will receive a confirmation email once our team approves your appointment.

    If you need to reschedule, please contact us.

    Regards,
    ${clinicName}
    `;

    // Send email to patient
    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    // Send admin notification if configured
    await this.sendAdminNotificationCopy({
      patientEmail: email,
      patientName: name,
      appointmentDate: formattedDate,
      appointmentTime: timeSlot,
      type: "booking",
      clinicName,
    });
  }

  async sendAppointmentConfirmationEmail(
    email,
    name,
    date,
    timeSlot,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Appointment Confirmed - ${clinicName}`;
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
          <p>Great news! Your appointment with <strong>${clinicName}</strong> has been confirmed by our team. We look forward to seeing you!</p>
          <div class="appointment-details">
            <h3>Confirmed Appointment Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          <p>Your appointment is now confirmed and secured. Please arrive 10-15 minutes early for check-in. If you need to reschedule or have any questions, please contact us at your earliest convenience.</p>
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

    Great news! Your appointment with ${clinicName} has been confirmed by our team.

    Confirmed Appointment Details:
    - Date: ${formattedDate}
    - Time: ${timeSlot}
    - Status: Confirmed

    Your appointment is now confirmed and secured. Please arrive 10-15 minutes early for check-in.

    If you need to reschedule, please contact us.

    Regards,
    ${clinicName}
    `;

    // Send email to patient
    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    // Send admin notification if configured
    await this.sendAdminNotificationCopy({
      patientEmail: email,
      patientName: name,
      appointmentDate: formattedDate,
      appointmentTime: timeSlot,
      type: "confirmation",
      clinicName,
    });
  }

  async sendAppointmentCancellationEmail(
    email,
    name,
    date,
    timeSlot,
    reason = null,
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

    We apologize for any inconvenience caused. Please feel free to book a new appointment or contact us if you have any questions.

    Regards,
    ${clinicName}
    `;

    // Send email to patient
    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    // Send admin notification if configured
    await this.sendAdminNotificationCopy({
      patientEmail: email,
      patientName: name,
      appointmentDate: formattedDate,
      appointmentTime: timeSlot,
      type: "cancellation",
      clinicName,
      additionalInfo: reason || "",
    });
  }

  async sendAppointmentCompletionEmail(
    email,
    name,
    date,
    timeSlot,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Appointment Completed - ${clinicName}`;
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
        .thank-you { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Appointment Completed!</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>Thank you for visiting <strong>${clinicName}</strong>! Your appointment has been successfully completed.</p>
          <div class="appointment-details">
            <h3>Completed Appointment Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Status:</strong> Completed</p>
          </div>
          <div class="thank-you">
            <h3>Thank You for Choosing Us!</h3>
            <p>We hope you had a positive experience with our dental care services. Your oral health is our priority, and we're glad we could assist you today.</p>
          </div>
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Follow any post-treatment instructions provided by your dentist</li>
            <li>Schedule your next appointment if recommended</li>
            <li>Contact us if you have any questions or concerns</li>
            <li>Consider leaving us a review to help other patients</li>
          </ul>
          <p>If you need to schedule a follow-up appointment or have any questions about your treatment, please don't hesitate to contact us.</p>
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

    Thank you for visiting ${clinicName}! Your appointment has been successfully completed.

    Completed Appointment Details:
    - Date: ${formattedDate}
    - Time: ${timeSlot}
    - Status: Completed

    Thank You for Choosing Us!
    We hope you had a positive experience with our dental care services. Your oral health is our priority, and we're glad we could assist you today.

    What's Next:
    - Follow any post-treatment instructions provided by your dentist
    - Schedule your next appointment if recommended
    - Contact us if you have any questions or concerns
    - Consider leaving us a review to help other patients

    If you need to schedule a follow-up appointment or have any questions about your treatment, please don't hesitate to contact us.

    Regards,
    ${clinicName}
    `;

    // Send email to patient
    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    // Send admin notification if configured
    await this.sendAdminNotificationCopy({
      patientEmail: email,
      patientName: name,
      appointmentDate: formattedDate,
      appointmentTime: timeSlot,
      type: "completion",
      clinicName,
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

  async sendFollowUpNotificationEmail(
    email,
    name,
    date,
    timeSlot,
    notes,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Follow-up Appointment Scheduled - ${clinicName}`;
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
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .followup-details { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px; }
        .highlight { background-color: #dcfce7; padding: 10px; border-radius: 4px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .icon { width: 20px; height: 20px; display: inline-block; margin-right: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Follow-up Appointment Scheduled!</h1>
        </div>
        <div class="content">
          <h2>Dear ${name},</h2>
          <p>A follow-up appointment has been scheduled for you at <strong>${clinicName}</strong>. This is to ensure your continued care and monitor your progress.</p>
          
          <div class="followup-details">
            <h3>📅 Follow-up Appointment Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Type:</strong> Follow-up Consultation</p>
            <p><strong>Status:</strong> Scheduled</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>

          <div class="highlight">
            <h3>🔄 Important Information</h3>
            <ul>
              <li><strong>No session deduction:</strong> This follow-up appointment does not count against your session limit</li>
              <li><strong>Continuation of care:</strong> This is a continuation of your previous treatment</li>
              <li><strong>Please arrive:</strong> 10-15 minutes early for check-in</li>
            </ul>
          </div>

          <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
          
          <p>We look forward to seeing you and ensuring your treatment progresses smoothly.</p>
          
          <p>Best regards,<br>
          <strong>${clinicName} Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`;

    const text = `
Follow-up Appointment Scheduled - ${clinicName}

Dear ${name},

A follow-up appointment has been scheduled for you at ${clinicName}. This is to ensure your continued care and monitor your progress.

Follow-up Appointment Details:
Date: ${formattedDate}
Time: ${timeSlot}
Type: Follow-up Consultation
Status: Scheduled
${notes ? `Notes: ${notes}` : ''}

Important Information:
- No session deduction: This follow-up appointment does not count against your session limit
- Continuation of care: This is a continuation of your previous treatment
- Please arrive: 10-15 minutes early for check-in

If you need to reschedule or have any questions, please contact us as soon as possible.

We look forward to seeing you and ensuring your treatment progresses smoothly.

Best regards,
${clinicName} Team

This is an automated notification. Please do not reply to this email.
`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendAdminFollowUpNotificationEmail(
    patientName,
    date,
    timeSlot,
    appointmentId,
    notes,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Follow-up Scheduled - ${patientName}`;
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
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .followup-details { background-color: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Follow-up Appointment Scheduled</h1>
        </div>
        <div class="content">
          <h2>Hello Team,</h2>
          <p>A follow-up appointment has been scheduled for patient <strong>${patientName}</strong>.</p>
          
          <div class="followup-details">
            <h3>Follow-up Details</h3>
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Original Appointment ID:</strong> ${appointmentId}</p>
            <p><strong>Type:</strong> Follow-up Consultation</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>

          <p>The patient has been automatically notified via email.</p>
          
          <p>Best regards,<br>
          <strong>${clinicName} System</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated notification from the appointment management system.</p>
        </div>
      </div>
    </body>
    </html>`;

    const text = `
Follow-up Appointment Scheduled

Hello Team,

A follow-up appointment has been scheduled for patient ${patientName}.

Follow-up Details:
Patient: ${patientName}
Date: ${formattedDate}
Time: ${timeSlot}
Original Appointment ID: ${appointmentId}
Type: Follow-up Consultation
${notes ? `Notes: ${notes}` : ''}

The patient has been automatically notified via email.

Best regards,
${clinicName} System
`;

    // Send to admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@teerthankerdentalcare.com';
    
    return this.sendEmail({
      to: adminEmail,
      subject,
      html,
      text,
    });
  }

  async sendFollowUpCompletionEmail(
    email,
    name,
    date,
    timeSlot,
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Follow-up Appointment Completed - ${clinicName}`;
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
      <title>Follow-up Completed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .completion-details { background-color: #f0fdf4; padding: 20px; border-left: 4px solid #10b981; margin: 25px 0; border-radius: 6px; }
        .completion-details h3 { color: #065f46; margin: 0 0 15px 0; font-size: 18px; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #64748b; margin: 0; font-size: 14px; }
        .cta-section { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
        .icon { font-size: 24px; margin-right: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="icon">✅</span>Follow-up Completed!</h1>
        </div>
        
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          
          <p>Thank you for attending your follow-up appointment at <strong>${clinicName}</strong>! Your follow-up consultation has been successfully completed.</p>
          
          <div class="completion-details">
            <h3><span class="icon">📅</span>Completed Follow-up Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Type:</strong> Follow-up Consultation</p>
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">Completed</span></p>
          </div>
          
          <div class="cta-section">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">What's Next?</h3>
            <ul style="text-align: left; color: #374151; margin: 0; padding-left: 20px;">
              <li><strong>Follow post-treatment care instructions</strong> as discussed during your visit</li>
              <li><strong>Continue your prescribed treatment regimen</strong> if applicable</li>
              <li><strong>Schedule your next appointment</strong> if recommended by your dentist</li>
              <li><strong>Contact us</strong> if you have any questions or concerns</li>
            </ul>
          </div>
          
          <p>We're pleased that we could continue monitoring your oral health progress. Your well-being is our priority, and we appreciate your commitment to maintaining excellent dental health.</p>
          
          <p>If you have any questions about today's consultation or need to schedule any additional appointments, please don't hesitate to contact us.</p>
          
          <p>Warm regards,<br><strong>${clinicName}</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    Thank you for attending your follow-up appointment at ${clinicName}! Your follow-up consultation has been successfully completed.

    Completed Follow-up Details:
    - Date: ${formattedDate}
    - Time: ${timeSlot}
    - Type: Follow-up Consultation
    - Status: Completed

    What's Next:
    - Follow post-treatment care instructions as discussed during your visit
    - Continue your prescribed treatment regimen if applicable
    - Schedule your next appointment if recommended by your dentist
    - Contact us if you have any questions or concerns

    We're pleased that we could continue monitoring your oral health progress. Your well-being is our priority, and we appreciate your commitment to maintaining excellent dental health.

    If you have any questions about today's consultation or need to schedule any additional appointments, please don't hesitate to contact us.

    Warm regards,
    ${clinicName}
    `;

    // Send email to patient
    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    // Send admin notification if configured
    await this.sendAdminNotificationCopy({
      patientEmail: email,
      patientName: name,
      appointmentDate: formattedDate,
      appointmentTime: timeSlot,
      type: "follow-up completion",
      clinicName,
    });
  }

  async sendFollowUpCancellationEmail(
    email,
    name,
    date,
    timeSlot,
    reason = "Not specified",
    clinicName = "Teerthanker Dental Care"
  ) {
    const subject = `Follow-up Appointment Cancelled - ${clinicName}`;
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
      <title>Follow-up Cancelled</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f7fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .cancellation-details { background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin: 25px 0; border-radius: 6px; }
        .cancellation-details h3 { color: #991b1b; margin: 0 0 15px 0; font-size: 18px; }
        .footer { background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #64748b; margin: 0; font-size: 14px; }
        .cta-section { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
        .icon { font-size: 24px; margin-right: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1><span class="icon">❌</span>Follow-up Cancelled</h1>
        </div>
        
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          
          <p>We regret to inform you that your follow-up appointment at <strong>${clinicName}</strong> has been cancelled.</p>
          
          <div class="cancellation-details">
            <h3><span class="icon">📅</span>Cancelled Follow-up Details</h3>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
            <p><strong>Type:</strong> Follow-up Consultation</p>
            <p><strong>Status:</strong> <span style="color: #ef4444; font-weight: 600;">Cancelled</span></p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          
          <div class="cta-section">
            <h3 style="color: #1e40af; margin: 0 0 15px 0;">Need to Reschedule?</h3>
            <p style="color: #374151; margin: 0;">Please contact us to schedule a new follow-up appointment at your convenience. We're here to continue supporting your dental health journey.</p>
          </div>
          
          <p>We apologize for any inconvenience this may cause. Your oral health remains our priority, and we're committed to providing you with the best possible care.</p>
          
          <p>If you have any questions or concerns, or if you'd like to schedule a new follow-up appointment, please don't hesitate to contact us.</p>
          
          <p>Thank you for your understanding.</p>
          
          <p>Best regards,<br><strong>${clinicName}</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 ${clinicName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `
    Dear ${name},

    We regret to inform you that your follow-up appointment at ${clinicName} has been cancelled.

    Cancelled Follow-up Details:
    - Date: ${formattedDate}
    - Time: ${timeSlot}
    - Type: Follow-up Consultation
    - Status: Cancelled
    - Reason: ${reason}

    Need to Reschedule?
    Please contact us to schedule a new follow-up appointment at your convenience. We're here to continue supporting your dental health journey.

    We apologize for any inconvenience this may cause. Your oral health remains our priority, and we're committed to providing you with the best possible care.

    If you have any questions or concerns, or if you'd like to schedule a new follow-up appointment, please don't hesitate to contact us.

    Thank you for your understanding.

    Best regards,
    ${clinicName}
    `;

    // Send email to patient
    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });

    // Send admin notification if configured
    await this.sendAdminNotificationCopy({
      patientEmail: email,
      patientName: name,
      appointmentDate: formattedDate,
      appointmentTime: timeSlot,
      type: "follow-up cancellation",
      reason,
      clinicName,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
