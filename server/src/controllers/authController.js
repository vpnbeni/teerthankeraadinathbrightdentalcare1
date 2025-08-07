import { authService } from "../services/authService.js";
import { otpService } from "../services/otpService.js";
import User from "../models/User.js";

/**
 * Authentication Controller
 * Handles all authentication-related HTTP requests
 */

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, phone, email, planId, address, gender } = req.body;

    // Validation
    if (!name || !phone || !planId) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and plan ID are required",
      });
    }

    // Phone number validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid Indian phone number",
      });
    }

    // Email validation (if provided)
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }
    }

    const result = await authService.register({
      name,
      phone,
      email,
      planId,
      address,
      gender,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Verify phone number with OTP
 * @route   POST /api/auth/verify-phone
 * @access  Public
 */
export const verifyPhone = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const result = await authService.verifyPhone(phone, otp);

    // Set token as HTTP-only cookie
    authService.setTokenCookie(res, result.token);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        message: "Phone number verified successfully",
      },
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Login user with phone and password
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const result = await authService.login(phone, password);

    // Set token as HTTP-only cookie
    authService.setTokenCookie(res, result.token);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        message: "Login successful",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Send OTP for login
 * @route   POST /api/auth/send-login-otp
 * @access  Public
 */
export const sendLoginOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const result = await authService.sendLoginOTP(phone);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Send login OTP error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Login with OTP
 * @route   POST /api/auth/login-otp
 * @access  Public
 */
export const loginWithOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const result = await authService.loginWithOTP(phone, otp);

    // Set token as HTTP-only cookie
    authService.setTokenCookie(res, result.token);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        message: "Login successful",
      },
    });
  } catch (error) {
    console.error("OTP login error:", error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Set password for user
 * @route   POST /api/auth/set-password
 * @access  Private
 */
export const setPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const result = await authService.setPassword(req.user._id, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Set password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password, and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const result = await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Send password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const result = await authService.sendPasswordResetOTP(phone);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword, confirmPassword } = req.body;

    if (!phone || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP, new password, and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const result = await authService.resetPassword(phone, otp, newPassword);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    const result = await authService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    // Clear token cookie
    authService.clearTokenCookie(res);

    const result = await authService.logout(req.user._id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const result = await otpService.resendOTP(phone);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Check authentication status
 * @route   GET /api/auth/check
 * @access  Private
 */
export const checkAuth = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
          role: req.user.role,
          isVerified: req.user.isVerified,
          subscription: req.user.subscription,
        },
        message: "User is authenticated",
      },
    });
  } catch (error) {
    console.error("Check auth error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Test OTP sending (development only)
 * @route   POST /api/auth/test-otp
 * @access  Public (development only)
 */
export const testOTP = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only available in development mode",
      });
    }

    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Phone number validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid Indian phone number",
      });
    }

    const result = await otpService.sendOTPToContact(phone);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Test OTP error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Check user password status (development only)
 * @route   POST /api/auth/check-password-status
 * @access  Public (development only)
 */
export const checkPasswordStatus = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only available in development mode",
      });
    }

    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({ phone }).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        phone: user.phone,
        hasPassword: !!user.passwordHash,
        isVerified: user.isVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Check password status error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Admin login
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const result = await authService.adminLogin({ email, password });

    // Set HTTP-only cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Admin login failed",
    });
  }
};

/**
 * Check if email is available for registration
 */
export const checkEmailAvailability = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate Gmail format
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Gmail address",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    const available = !existingUser;

    res.status(200).json({
      success: true,
      available,
      message: available 
        ? "Email is available" 
        : "Email is already registered",
    });
  } catch (error) {
    console.error("Email availability check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check email availability",
    });
  }
};

/**
 * Send OTP to email address
 */
export const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate Gmail format
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Gmail address",
      });
    }

    // Check if email is available
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Send OTP via email
    const { otpService } = await import("../services/otpService.js");
    await otpService.sendEmailOTP(email);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    console.error("Send email OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

/**
 * Verify email OTP
 */
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Validate Gmail format
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Gmail address",
      });
    }

    // Verify OTP
    const { otpService } = await import("../services/otpService.js");
    const isValidOTP = await otpService.verifyOTP(email, otp);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Check if email is available
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
    });
  }
};
