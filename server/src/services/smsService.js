import axios from "axios";
import twilio from "twilio";
import { config } from "../config/environment.js";

/**
 * SMS Service for sending notifications
 * Handles appointment notifications, follow-up reminders, etc.
 */

class SMSService {
  constructor() {
    this.smsProvider = config.SMS_PROVIDER;

    if (this.smsProvider === "twilio") {
      this.twilioClient = twilio(config.TWILIO.ACCOUNT_SID, config.TWILIO.AUTH_TOKEN);
      this.twilioPhoneNumber = config.TWILIO.PHONE_NUMBER;
    } else {
      this.baseURL = "https://api.msg91.com/api";
      this.authKey = config.MSG91.AUTH_KEY;
      this.senderId = config.MSG91.SENDER_ID;
      // Template IDs for different notification types
      this.appointmentBookingTemplateId = config.MSG91.APPOINTMENT_BOOKING_TEMPLATE_ID;
      this.followUpTemplateId = config.MSG91.FOLLOWUP_TEMPLATE_ID;
    }
  }

  /**
   * Format phone number for API
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Remove +91 if present at start
    const without91 = cleaned.replace(/^91/, "");
    
    // Ensure it's 10 digits
    if (without91.length !== 10) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }
    
    return without91;
  }

  /**
   * Format date for display
   */
  formatDate(date) {
    const d = new Date(date);
    const options = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    };
    return d.toLocaleDateString('en-IN', options);
  }

  /**
   * Send SMS via Twilio
   */
  async sendTwilioSMS(phone, message) {
    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

      if (config.NODE_ENV === "development") {
        console.log(`📱 [TWILIO SMS] To: ${phone}`);
        console.log(`📝 Message: ${message}`);
      }

      await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: formattedPhone,
      });

      return {
        success: true,
        message: "SMS sent successfully",
      };
    } catch (error) {
      console.error("Twilio SMS sending error:", error.message);
      
      if (config.NODE_ENV === "development") {
        console.warn("Twilio SMS failed, but continuing in development mode");
        return {
          success: true,
          message: "SMS sent successfully (development mode - check console)",
        };
      }
      
      throw new Error(error.message || "Failed to send SMS via Twilio");
    }
  }

  /**
   * Send SMS via MSG91
   */
  async sendMsg91SMS(phone, message, templateId = null) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      if (config.NODE_ENV === "development") {
        console.log(`📱 [MSG91 SMS] To: ${phone}`);
        console.log(`📝 Message: ${message}`);
      }

      // Check if MSG91 credentials are available
      if (!this.authKey || this.authKey.includes("dummy") || this.authKey.length < 10) {
        console.warn("MSG91 credentials not configured, using mock mode");
        return {
          success: true,
          message: "SMS sent successfully (mock mode)",
        };
      }

      // Prepare SMS data
      const smsData = {
        authkey: this.authKey,
        mobiles: formattedPhone,
        sender: this.senderId,
        route: "4", // Transactional route
        country: "91",
        message: message,
      };

      // If template ID is provided, use template-based SMS
      if (templateId) {
        smsData.template_id = templateId;
      }

      console.log("\n🔍 MSG91 SMS PAYLOAD:");
      console.log("═══════════════════════════════");
      console.log("📤 URL:", `${this.baseURL}/sendhttp.php`);
      console.log("📦 Data:", smsData);
      console.log("═══════════════════════════════\n");

      const response = await axios.post(
        `${this.baseURL}/sendhttp.php`,
        new URLSearchParams(smsData),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        }
      );

      console.log("MSG91 Response:", response.data);

      // Handle different response formats from MSG91
      if (typeof response.data === "string") {
        if (response.data.includes("Message Sent Successfully") || 
            response.data.includes("successfully")) {
          return {
            success: true,
            message: "SMS sent successfully",
            requestId: response.data,
          };
        } else if (response.data.includes("Invalid authentication")) {
          throw new Error("Invalid MSG91 authentication key");
        } else if (response.data.includes("Invalid mobile")) {
          throw new Error("Invalid mobile number");
        } else {
          throw new Error(`MSG91 Error: ${response.data}`);
        }
      } else if (response.data?.type === "success" || response.data?.msgType === "success") {
        return {
          success: true,
          message: "SMS sent successfully",
          requestId: response.data.request_id || response.data.msg,
        };
      } else if (response.data?.type === "error" || response.data?.msgType === "error") {
        throw new Error(`MSG91 Error: ${response.data.message || response.data.msg}`);
      }

      return {
        success: true,
        message: "SMS sent successfully",
      };
    } catch (error) {
      console.error("MSG91 SMS sending error:", error.message);

      if (config.NODE_ENV === "development") {
        console.warn("MSG91 SMS failed, but continuing in development mode");
        return {
          success: true,
          message: "SMS sent successfully (development mode - check console)",
        };
      }

      throw new Error(error.message || "Failed to send SMS via MSG91");
    }
  }

  /**
   * Send SMS (unified method)
   */
  async sendSMS(phone, message, templateId = null) {
    if (!phone) {
      throw new Error("Phone number is required");
    }

    if (!message) {
      throw new Error("Message is required");
    }

    try {
      if (this.smsProvider === "twilio") {
        return await this.sendTwilioSMS(phone, message);
      } else {
        return await this.sendMsg91SMS(phone, message, templateId);
      }
    } catch (error) {
      console.error("SMS sending error:", error.message);
      
      // In development, don't throw error
      if (config.NODE_ENV === "development") {
        return {
          success: true,
          message: "SMS logged (development mode)",
        };
      }
      
      throw error;
    }
  }

  /**
   * Send appointment booking notification to user
   */
  async sendAppointmentBookingToUser(userName, userPhone, date, timeSlot) {
    const formattedDate = this.formatDate(date);
    const message = `Dear ${userName}, your appointment at Teerthanker Dental Care is confirmed for ${formattedDate} at ${timeSlot}. We look forward to seeing you!`;
    
    console.log(`📤 Sending appointment confirmation to user: ${userPhone}`);
    return await this.sendSMS(userPhone, message, this.appointmentBookingTemplateId);
  }

  /**
   * Send appointment booking notification to admin
   */
  async sendAppointmentBookingToAdmin(adminPhone, userName, userPhone, date, timeSlot, notes = "") {
    const formattedDate = this.formatDate(date);
    let message = `New Appointment Booked!\nPatient: ${userName}\nPhone: ${userPhone}\nDate: ${formattedDate}\nTime: ${timeSlot}`;
    
    if (notes) {
      message += `\nNotes: ${notes}`;
    }
    
    console.log(`📤 Sending new appointment notification to admin: ${adminPhone}`);
    return await this.sendSMS(adminPhone, message);
  }

  /**
   * Send follow-up notification to user
   */
  async sendFollowUpNotificationToUser(userName, userPhone, date, timeSlot, notes = "") {
    const formattedDate = this.formatDate(date);
    let message = `Dear ${userName}, a follow-up appointment has been scheduled at Teerthanker Dental Care for ${formattedDate} at ${timeSlot}.`;
    
    if (notes) {
      message += ` Note: ${notes}`;
    }
    
    console.log(`📤 Sending follow-up notification to user: ${userPhone}`);
    return await this.sendSMS(userPhone, message, this.followUpTemplateId);
  }

  /**
   * Send appointment cancellation notification
   */
  async sendCancellationNotification(userName, userPhone, date, timeSlot, reason = "") {
    const formattedDate = this.formatDate(date);
    let message = `Dear ${userName}, your appointment at Teerthanker Dental Care scheduled for ${formattedDate} at ${timeSlot} has been cancelled.`;
    
    if (reason) {
      message += ` Reason: ${reason}`;
    }
    
    console.log(`📤 Sending cancellation notification to user: ${userPhone}`);
    return await this.sendSMS(userPhone, message);
  }

  /**
   * Send appointment reminder (can be used with cron jobs)
   */
  async sendAppointmentReminder(userName, userPhone, date, timeSlot, hoursBeforeAppointment = 24) {
    const formattedDate = this.formatDate(date);
    const message = `Reminder: Dear ${userName}, you have an appointment at Teerthanker Dental Care tomorrow (${formattedDate}) at ${timeSlot}. Please arrive 10 minutes early.`;
    
    console.log(`📤 Sending appointment reminder to user: ${userPhone}`);
    return await this.sendSMS(userPhone, message);
  }

  /**
   * Test SMS connection
   */
  async testConnection(testPhone) {
    try {
      const message = "Test message from Teerthanker Dental Care. SMS service is working correctly.";
      const result = await this.sendSMS(testPhone, message);
      
      return {
        success: true,
        message: "SMS service is working correctly",
        details: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "SMS service test failed",
        error: error.message,
      };
    }
  }
}

// Export singleton instance
const smsService = new SMSService();
export { smsService };
export default smsService;

