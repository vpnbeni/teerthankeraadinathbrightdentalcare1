import axios from "axios";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { config } from "../config/environment.js";

/**
 * OTP Service using MSG91
 * Handles OTP generation, sending, and verification
 */

class OTPService {
  constructor() {
    this.smsProvider = config.SMS_PROVIDER;

    if (this.smsProvider === "twilio") {
      this.twilioClient = twilio(config.TWILIO.ACCOUNT_SID, config.TWILIO.AUTH_TOKEN);
      this.twilioPhoneNumber = config.TWILIO.PHONE_NUMBER;
    } else {
      this.baseURL = "https://api.msg91.com/api";
      this.authKey = config.MSG91.AUTH_KEY;
      this.templateId = config.MSG91.TEMPLATE_ID;
    }

    // In-memory OTP storage (in production, use Redis)
    this.otpStore = new Map();
    this.otpExpiry = 5 * 60 * 1000; // 5 minutes

    // Email transporter setup
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.EMAIL?.USER,
        pass: config.EMAIL?.PASS
      }
    });
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via Email
   */
  async sendEmailOTP(email) {
    try {
      const otp = this.generateOTP();

      // Store OTP with expiry
      this.otpStore.set(email, {
        otp,
        expiresAt: Date.now() + this.otpExpiry,
        attempts: 0,
      });

      // Log OTP in development
      if (config.NODE_ENV === "development") {
        console.log(`📧 OTP for ${email}: ${otp}`);
      }

      // Check if email credentials are available
      if (!config.EMAIL?.USER || !config.EMAIL?.PASS) {
        console.warn("Email credentials not configured, using mock mode");
        return {
          success: true,
          message: "OTP sent successfully (mock mode)",
          ...(config.NODE_ENV === "development" && { otp: otp }),
        };
      }

      // Send OTP via email
      const mailOptions = {
        from: {
          name: 'Teerthanker Aadinath Bright Dental Care',
          address: config.EMAIL.USER
        },
        to: email,
        subject: 'Your Verification Code - Teerthanker Dental Care',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #346870; color: white; padding: 20px; text-align: center;">
              <h1>Teerthanker Aadinath Bright Dental Care</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #346870;">Your Verification Code</h2>
              <p>Your verification code is:</p>
              <div style="background-color: white; padding: 20px; text-align: center; border: 2px solid #346870; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #346870; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p>This code will expire in 5 minutes. Please do not share this code with anyone.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div style="background-color: #346870; color: white; padding: 10px; text-align: center; font-size: 12px;">
              <p>© 2024 Teerthanker Aadinath Bright Dental Care. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: "OTP sent to your email successfully"
      };

    } catch (error) {
      console.error("Email OTP sending error:", error.message);

      // In development, still return success so testing can continue
      if (config.NODE_ENV === "development") {
        console.warn("Email OTP sending failed, but allowing development mode verification");
        return {
          success: true,
          message: "OTP sent successfully (development mode - check console)",
          otp: this.otpStore.get(email)?.otp,
        };
      }

      throw new Error(error.message || "Failed to send email OTP");
    }
  }

  /**
   * Send OTP via Twilio
   */
  async sendTwilioOTP(phone) {
    try {
      const otp = this.generateOTP();

      // Store OTP with expiry
      this.otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + this.otpExpiry,
        attempts: 0,
      });

      // Format phone number (add +91 if not present)
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;

      if (config.NODE_ENV === "development") {
        console.log(`🔐 OTP for ${phone}: ${otp}`);
      }

      await this.twilioClient.messages.create({
        body: `Your OTP for Teerthanker Dental Care is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
        from: this.twilioPhoneNumber,
        to: formattedPhone,
      });

      return {
        success: true,
        message: "OTP sent successfully",
      };
    } catch (error) {
      console.error("Twilio OTP sending error:", error.message);
      if (config.NODE_ENV === "production") {
        this.otpStore.delete(phone);
      }
      if (config.NODE_ENV === "development") {
        console.warn(
          "Twilio OTP sending failed, but allowing development mode verification"
        );
        return {
          success: true,
          message: "OTP sent successfully (development mode - check console)",
          otp: this.otpStore.get(phone)?.otp,
        };
      }
      throw new Error(
        error.response?.data || error.message || "Failed to send OTP"
      );
    }
  }

  /**
   * Send OTP via SMS (MSG91)
   */
  async sendMsg91OTP(phone) {
    try {
      const otp = this.generateOTP();

      // Store OTP with expiry
      this.otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + this.otpExpiry,
        attempts: 0,
      });

      // Format phone number (remove +91 if present, ensure 10 digits)
      const formattedPhone = phone.replace(/^\+91/, "").replace(/\D/g, "");

      if (formattedPhone.length !== 10) {
        throw new Error("Invalid phone number format");
      }

      // In development, log OTP but still try to send via MSG91
      if (config.NODE_ENV === "development") {
        console.log(`🔐 OTP for ${phone}: ${otp}`);
      }

      // Check if MSG91 credentials are available
      if (
        !this.authKey ||
        this.authKey.includes("dummy") ||
        this.authKey.length < 10
      ) {
        console.warn("MSG91 credentials not configured, using mock mode");
        return {
          success: true,
          message: "OTP sent successfully (mock mode)",
          ...(config.NODE_ENV === "development" && { otp: otp }),
        };
      }

      // Send OTP via MSG91 SMS API
      const smsData = {
        authkey: this.authKey,
        mobiles: formattedPhone,
        sender: "DENTAL",
        route: "4", // Transactional route
        country: "91",
      };

      // Use template if available, otherwise use direct message
      if (this.templateId) {
        // Using template-based SMS
        smsData.template_id = this.templateId;
        smsData.var1 = otp; // OTP variable for template
      } else {
        // Using direct message
        smsData.message = `Your OTP for Teerthanker Dental Care is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      }

      const response = await axios.post(
        `${this.baseURL}/sendhttp.php`,
        new URLSearchParams(smsData),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("MSG91 Response:", response.data);

      // Handle different response formats from MSG91
      if (typeof response.data === "string") {
        if (response.data.includes("Message Sent Successfully")) {
          return {
            success: true,
            message: "OTP sent successfully",
            requestId: response.data,
          };
        } else if (response.data.includes("Invalid authentication")) {
          throw new Error("Invalid MSG91 authentication key");
        } else if (response.data.includes("Invalid mobile")) {
          throw new Error("Invalid mobile number");
        } else {
          throw new Error(`MSG91 Error: ${response.data}`);
        }
      } else if (
        typeof response.data === "object" &&
        response.data.msgType === "error"
      ) {
        // Handle JSON error responses
        const errorCodes = {
          418: "Invalid MSG91 authentication key",
          419: "Route not allowed for your account",
          420: "Invalid mobile number",
          421: "Invalid sender ID",
          422: "Invalid message",
          423: "Invalid country code",
          424: "SMS sending failed",
          425: "Insufficient balance in MSG91 account",
        };

        const errorMessage =
          errorCodes[response.data.msg] ||
          `MSG91 Error Code: ${response.data.msg}`;
        throw new Error(errorMessage);
      } else if (
        typeof response.data === "object" &&
        response.data.msgType === "success"
      ) {
        return {
          success: true,
          message: "OTP sent successfully",
          requestId: response.data.msg,
        };
      } else {
        throw new Error("Unexpected response format from MSG91");
      }
    } catch (error) {
      console.error("OTP sending error:", error.message);

      // Don't remove OTP from store if it's just a sending error
      // This allows users to still verify with the generated OTP in development
      if (config.NODE_ENV === "production") {
        this.otpStore.delete(phone);
      }

      // In development, still return success so testing can continue
      if (config.NODE_ENV === "development") {
        console.warn(
          "OTP sending failed, but allowing development mode verification"
        );
        return {
          success: true,
          message: "OTP sent successfully (development mode - check console)",
          otp: this.otpStore.get(phone)?.otp,
        };
      }

      throw new Error(
        error.response?.data || error.message || "Failed to send OTP"
      );
    }
  }

  /**
   * Send OTP to phone or email (unified method)
   */
  async sendOTPToContact(contact) {
    // Check if contact is email or phone
    const isEmail = contact.includes('@');
    
    if (isEmail) {
      return await this.sendEmailOTP(contact);
    } else {
      if (this.smsProvider === 'twilio') {
        return await this.sendTwilioOTP(contact);
      } else {
        return await this.sendMsg91OTP(contact);
      }
    }
  }

  /**
   * Verify OTP for phone or email
   */
  async verifyOTP(contact, otp) {
    try {
      const storedOTPData = this.otpStore.get(contact);

      if (!storedOTPData) {
        throw new Error("OTP not found or expired");
      }

      // Check if OTP has expired
      if (Date.now() > storedOTPData.expiresAt) {
        this.otpStore.delete(contact);
        throw new Error("OTP has expired");
      }

      // Check attempt limit
      if (storedOTPData.attempts >= 3) {
        this.otpStore.delete(contact);
        throw new Error("Maximum OTP verification attempts exceeded");
      }

      // Increment attempt count
      storedOTPData.attempts += 1;

      // Verify OTP (ensure both are strings for comparison)
      if (String(storedOTPData.otp) !== String(otp)) {
        if (storedOTPData.attempts >= 3) {
          this.otpStore.delete(contact);
        }
        throw new Error("Invalid OTP");
      }

      // OTP is valid, remove from store
      this.otpStore.delete(contact);

      return true;
    } catch (error) {
      console.error("OTP verification error:", error.message);
      throw error;
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(phone) {
    // Remove existing OTP
    this.otpStore.delete(phone);

    // Send new OTP
    if (this.smsProvider === 'twilio') {
      return await this.sendTwilioOTP(phone);
    } else {
      return await this.sendMsg91OTP(phone);
    }
  }

  /**
   * Check if OTP exists for phone number
   */
  hasOTP(phone) {
    const storedOTPData = this.otpStore.get(phone);
    return storedOTPData && Date.now() <= storedOTPData.expiresAt;
  }

  /**
   * Get remaining time for OTP
   */
  getOTPRemainingTime(phone) {
    const storedOTPData = this.otpStore.get(phone);

    if (!storedOTPData) {
      return 0;
    }

    const remainingTime = storedOTPData.expiresAt - Date.now();
    return Math.max(0, Math.ceil(remainingTime / 1000)); // Return in seconds
  }

  /**
   * Clean expired OTPs (should be called periodically)
   */
  cleanExpiredOTPs() {
    const now = Date.now();

    for (const [phone, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(phone);
      }
    }
  }

  /**
   * Get OTP statistics (for admin)
   */
  getOTPStats() {
    const activeOTPs = Array.from(this.otpStore.entries()).filter(
      ([_, otpData]) => Date.now() <= otpData.expiresAt
    ).length;

    return {
      activeOTPs,
      totalStored: this.otpStore.size,
    };
  }

  /**
   * Test MSG91 connection
   */
  async testConnection() {
    try {
      if (!this.authKey || this.authKey === "dummy-auth-key") {
        return {
          success: false,
          message: "MSG91 credentials not configured",
        };
      }

      // Test with balance check API
      const response = await axios.post(
        `${this.baseURL}/balance.php`,
        new URLSearchParams({
          authkey: this.authKey,
          type: "4", // SMS type
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 5000,
        }
      );

      // Handle different response formats
      if (typeof response.data === "string") {
        if (response.data.includes("Invalid")) {
          return {
            success: false,
            message: "MSG91 authentication failed",
            error: response.data,
          };
        } else {
          return {
            success: true,
            message: "MSG91 connection successful",
            balance: response.data,
          };
        }
      } else if (
        typeof response.data === "object" &&
        response.data.msgType === "error"
      ) {
        const errorCodes = {
          418: "Invalid authentication key",
          419: "Route not allowed for your account",
          420: "Invalid mobile number",
          421: "Invalid sender ID",
          422: "Invalid message",
          423: "Invalid country code",
          424: "SMS sending failed",
          425: "Insufficient balance",
        };

        const errorMessage = errorCodes[response.data.msg] || "Unknown error";
        return {
          success: false,
          message: "MSG91 API error",
          error: `${response.data.msg}: ${errorMessage}`,
        };
      } else {
        return {
          success: true,
          message: "MSG91 connection successful",
          data: response.data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "MSG91 connection failed",
        error: error.message,
      };
    }
  }
}

// Clean expired OTPs every 10 minutes
const otpService = new OTPService();
setInterval(() => {
  otpService.cleanExpiredOTPs();
}, 10 * 60 * 1000);

export { otpService };
