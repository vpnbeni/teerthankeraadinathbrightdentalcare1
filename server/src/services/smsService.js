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
      this.bookingToClientTemplateId = config.MSG91.BOOKING_TO_CLIENT_TEMPLATE_ID;
      this.bookingToAdminTemplateId = config.MSG91.BOOKING_TO_ADMIN_TEMPLATE_ID;
      this.bookingConfirmedTemplateId = config.MSG91.BOOKING_CONFIRMED_TO_CLIENT_TEMPLATE_ID;
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
   * Send SMS via MSG91 (legacy sendhttp API)
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
   * Send SMS via MSG91 v5 Flow API (for DLT-compliant template-based messages)
   * @param {string} phone - Phone number
   * @param {string} templateId - MSG91 template ID
   * @param {object} variables - Template variables as object { "1": "value1", "2": "value2" }
   */
  async sendMsg91FlowSMS(phone, templateId, variables = {}) {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      if (config.NODE_ENV === "development") {
        console.log(`📱 [MSG91 Flow SMS] To: ${phone}`);
        console.log(`📋 Template ID: ${templateId}`);
        console.log(`📦 Variables:`, variables);
      }

      // Check if MSG91 credentials are available
      if (!this.authKey || this.authKey.includes("dummy") || this.authKey.length < 10) {
        console.warn("MSG91 credentials not configured, using mock mode");
        return {
          success: true,
          message: "SMS sent successfully (mock mode)",
        };
      }

      if (!templateId) {
        throw new Error("Template ID is required for Flow API");
      }

      // Prepare Flow API data
      const flowData = {
        template_id: templateId,
        sender: this.senderId,
        short_url: "0", // Disable URL shortening
        mobiles: `91${formattedPhone}`, // Flow API expects country code prefix
        authkey: this.authKey,
      };

      // Add variables if provided
      if (variables && Object.keys(variables).length > 0) {
        flowData.var = variables;
      }

      console.log("\n🔍 MSG91 FLOW API PAYLOAD:");
      console.log("═══════════════════════════════");
      console.log("📤 URL:", `${this.baseURL}/v5/flow/`);
      console.log("📋 Headers:", { "Content-Type": "application/json" });
      console.log("📦 JSON Payload:");
      console.log(JSON.stringify(flowData, null, 2));
      console.log("═══════════════════════════════\n");

      const response = await axios.post(
        `${this.baseURL}/v5/flow/`,
        flowData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("MSG91 Flow Response:", response.data);
      console.log("MSG91 Flow Response Type:", typeof response.data);

      // Handle response
      if (response.data?.type === "success" || response.data?.message === "success") {
        return {
          success: true,
          message: "SMS sent successfully via Flow API",
          requestId: response.data.request_id || response.data.data?.request_id,
        };
      } else if (response.data?.type === "error" || response.data?.message === "error") {
        throw new Error(`MSG91 Flow Error: ${response.data.message || JSON.stringify(response.data)}`);
      } else if (typeof response.data === "string") {
        if (response.data.includes("success") || response.data.includes("Success")) {
          return {
            success: true,
            message: "SMS sent successfully via Flow API",
            requestId: response.data,
          };
        } else {
          throw new Error(`MSG91 Flow Error: ${response.data}`);
        }
      }

      // Default success if we get here
      return {
        success: true,
        message: "SMS sent successfully via Flow API",
      };
    } catch (error) {
      console.error("MSG91 Flow SMS sending error:", error.message);
      
      if (error.response) {
        console.error("MSG91 Error Response:", error.response.data);
      }

      if (config.NODE_ENV === "development") {
        console.warn("MSG91 Flow SMS failed, but continuing in development mode");
        return {
          success: true,
          message: "SMS sent successfully (development mode - check console)",
        };
      }

      throw new Error(error.message || "Failed to send SMS via MSG91 Flow API");
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
    console.log(`📤 Sending appointment confirmation to user: ${userPhone}`);
    
    if (this.smsProvider === "twilio") {
      const formattedDate = this.formatDate(date);
      const message = `Dear ${userName}, your appointment at Teerthanker Dental Care is confirmed for ${formattedDate} at ${timeSlot}. We look forward to seeing you!`;
      return await this.sendTwilioSMS(userPhone, message);
    } else {
      // Use MSG91 Flow API with DLT-compliant template
      // Template: "Teerthanker Aadinath Bright Dental Care: Dear ##var##, your appointment has been booked successfully..."
      const variables = {
        "1": userName, // Patient name
      };
      
      return await this.sendMsg91FlowSMS(
        userPhone, 
        this.bookingToClientTemplateId, 
        variables
      );
    }
  }

  /**
   * Send appointment booking notification to admin (single phone)
   */
  async sendAppointmentBookingToAdmin(adminPhone, userName, userPhone, date, timeSlot, notes = "") {
    console.log(`📤 Sending new appointment notification to admin: ${adminPhone}`);
    
    if (this.smsProvider === "twilio") {
      const formattedDate = this.formatDate(date);
      let message = `New Appointment Booked!\nPatient: ${userName}\nPhone: ${userPhone}\nDate: ${formattedDate}\nTime: ${timeSlot}`;
      
      if (notes) {
        message += `\nNotes: ${notes}`;
      }
      
      return await this.sendTwilioSMS(adminPhone, message);
    } else {
      // Use MSG91 Flow API with DLT-compliant template
      // Template: "Teerthanker Aadinath Bright Dental Care: A new appointment has been booked by ##var##. Contact Number: ##var##..."
      const variables = {
        "1": userName,   // Patient name
        "2": userPhone,  // Contact number
      };
      
      return await this.sendMsg91FlowSMS(
        adminPhone, 
        this.bookingToAdminTemplateId, 
        variables
      );
    }
  }

  /**
   * Send appointment booking notification to multiple admins
   */
  async sendAppointmentBookingToAdmins(adminPhones, userName, userPhone, date, timeSlot, notes = "") {
    const results = [];
    
    for (const adminPhone of adminPhones) {
      if (adminPhone && adminPhone.trim()) {
        try {
          const result = await this.sendAppointmentBookingToAdmin(
            adminPhone,
            userName,
            userPhone,
            date,
            timeSlot,
            notes
          );
          results.push({ phone: adminPhone, success: true, result });
        } catch (error) {
          console.error(`Failed to send SMS to admin ${adminPhone}:`, error.message);
          results.push({ phone: adminPhone, success: false, error: error.message });
        }
      }
    }
    
    return results;
  }

  /**
   * Send appointment confirmation notification to user (when admin confirms)
   */
  async sendAppointmentConfirmationToUser(userName, userPhone, date, timeSlot) {
    console.log(`📤 Sending appointment confirmation to user: ${userPhone}`);
    
    if (this.smsProvider === "twilio") {
      const formattedDate = this.formatDate(date);
      const message = `Dear ${userName}, your appointment at Teerthanker Dental Care on ${formattedDate} at ${timeSlot} has been confirmed by our team. See you soon!`;
      return await this.sendTwilioSMS(userPhone, message);
    } else {
      // Use MSG91 Flow API with DLT-compliant template for booking confirmation
      // Template: "Teerthanker Aadinath Bright Dental Care: Dear ##var##, your appointment on ##var## has been confirmed..."
      // Format date and time together
      const appointmentDate = new Date(date);
      const day = appointmentDate.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[appointmentDate.getMonth()];
      const year = appointmentDate.getFullYear();
      const formattedDateTime = `${day}${this.getOrdinalSuffix(day)} ${month} ${year}, ${timeSlot}`;
      
      const variables = {
        "1": userName,           // Patient name
        "2": formattedDateTime,  // Date and time (e.g., "10th Oct 2025, 5:00 PM")
      };
      
      return await this.sendMsg91FlowSMS(
        userPhone, 
        this.bookingConfirmedTemplateId, 
        variables
      );
    }
  }

  /**
   * Helper to get ordinal suffix for day (1st, 2nd, 3rd, etc.)
   */
  getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  /**
   * Send follow-up notification to user
   */
  async sendFollowUpNotificationToUser(userName, userPhone, date, timeSlot, notes = "") {
    console.log(`📤 Sending follow-up notification to user: ${userPhone}`);
    
    if (this.smsProvider === "twilio") {
      const formattedDate = this.formatDate(date);
      let message = `Dear ${userName}, a follow-up appointment has been scheduled at Teerthanker Dental Care for ${formattedDate} at ${timeSlot}.`;
      
      if (notes) {
        message += ` Note: ${notes}`;
      }
      
      return await this.sendTwilioSMS(userPhone, message);
    } else {
      // If follow-up template ID is configured, use Flow API
      if (this.followUpTemplateId) {
        // Use MSG91 Flow API with DLT-compliant template
        // Adjust variables based on your follow-up template structure
        const formattedDate = this.formatDate(date);
        const variables = {
          "1": userName,        // Patient name
          "2": formattedDate,   // Date
          "3": timeSlot,        // Time slot
        };
        
        return await this.sendMsg91FlowSMS(
          userPhone, 
          this.followUpTemplateId, 
          variables
        );
      } else {
        // Fallback to legacy API if no template configured
        const formattedDate = this.formatDate(date);
        let message = `Dear ${userName}, a follow-up appointment has been scheduled at Teerthanker Dental Care for ${formattedDate} at ${timeSlot}.`;
        
        if (notes) {
          message += ` Note: ${notes}`;
        }
        
        return await this.sendMsg91SMS(userPhone, message);
      }
    }
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

