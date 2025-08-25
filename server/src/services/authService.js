import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { config } from "../config/environment.js";
import { otpService } from "./otpService.js";

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 */

class AuthService {
  /**
   * Generate JWT token for user
   */
  generateToken(userId) {
    return jwt.sign({ id: userId }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRE,
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign({ id: userId, type: "refresh" }, config.JWT_SECRET, {
      expiresIn: "30d",
    });
  }

  /**
   * Set JWT token as HTTP-only cookie
   */
  setTokenCookie(res, token) {
    const cookieOptions = {
      expires: new Date(
        Date.now() + config.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: config.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      // Don't set domain for Vercel deployments to avoid cross-domain issues
      domain: undefined,
    };

    res.cookie("token", token, cookieOptions);
  }

  /**
   * Clear authentication cookie
   */
  clearTokenCookie(res) {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
  }

  /**
   * Register new user with phone verification
   */
  async register(userData) {
    const { name, phone, email, planId, address, gender } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      // If user exists with suspended subscription, allow them to continue payment
      if (existingUser.subscription?.status === "suspended") {
        // Update user details and return for payment completion
        existingUser.name = name;
        existingUser.email = email || existingUser.email;
        existingUser.address = address || existingUser.address;
        existingUser.gender = gender || existingUser.gender;
        
        // Update subscription plan if different
        if (planId && planId !== existingUser.subscription.planId.toString()) {
          const Plan = (await import("../models/Plan.js")).default;
          const plan = await Plan.findById(planId);
          if (!plan || !plan.isActive) {
            throw new Error("Please provide a valid plan ID");
          }
          
          const startDate = new Date();
          const endDate = plan.calculateEndDate(startDate);
          const totalSessions = Number(plan.sessions) || 0;
          
          existingUser.subscription.planId = planId;
          existingUser.subscription.startDate = startDate;
          existingUser.subscription.endDate = endDate;
          existingUser.subscription.totalSessions = totalSessions;
          existingUser.subscription.sessionsRemaining = totalSessions;
        }
        
        await existingUser.save();
        
        // Send OTP for phone verification
        await otpService.sendOTPToContact(phone);
        
        return {
          user: {
            id: existingUser._id,
            name: existingUser.name,
            phone: existingUser.phone,
            email: existingUser.email,
            isVerified: existingUser.isVerified,
          },
          message: "Please verify your phone number to complete payment.",
        };
      }
      throw new Error("User with this phone number already exists");
    }

    // Check if email is provided and already exists
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        // If user exists with suspended subscription, allow them to continue payment
        if (existingEmail.subscription?.status === "suspended") {
          // Update user details and return for payment completion
          existingEmail.name = name;
          existingEmail.phone = phone;
          existingEmail.address = address || existingEmail.address;
          existingEmail.gender = gender || existingEmail.gender;
          
          // Update subscription plan if different
          if (planId && planId !== existingEmail.subscription.planId.toString()) {
            const Plan = (await import("../models/Plan.js")).default;
            const plan = await Plan.findById(planId);
            if (!plan || !plan.isActive) {
              throw new Error("Please provide a valid plan ID");
            }
            
            const startDate = new Date();
            const endDate = plan.calculateEndDate(startDate);
            const totalSessions = Number(plan.sessions) || 0;
            
            existingEmail.subscription.planId = planId;
            existingEmail.subscription.startDate = startDate;
            existingEmail.subscription.endDate = endDate;
            existingEmail.subscription.totalSessions = totalSessions;
            existingEmail.subscription.sessionsRemaining = totalSessions;
          }
          
          await existingEmail.save();
          
          // Send OTP for phone verification
          await otpService.sendOTPToContact(phone);
          
          return {
            user: {
              id: existingEmail._id,
              name: existingEmail.name,
              phone: existingEmail.phone,
              email: existingEmail.email,
              isVerified: existingEmail.isVerified,
            },
            message: "Please verify your phone number to complete payment.",
          };
        }
        throw new Error("User with this email already exists");
      }
    }

    // Validate plan ID
    const Plan = (await import("../models/Plan.js")).default;
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new Error("Please provide a valid plan ID");
    }

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = plan.calculateEndDate(startDate);
    const totalSessions = Number(plan.sessions) || 0;

    // Create user (unverified initially)
    const user = await User.create({
      name,
      phone,
      email,
      address,
      gender,
      subscription: {
        planId,
        startDate,
        endDate,
        totalSessions,
        sessionsRemaining: totalSessions,
        status: "suspended", // Will be activated after payment
      },
      isVerified: false,
    });

    // Send OTP for phone verification
    await otpService.sendOTPToContact(phone);

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isVerified: user.isVerified,
      },
      message: "Registration successful. Please verify your phone number.",
    };
  }

  /**
   * Verify phone number with OTP
   */
  async verifyPhone(phone, otp) {
    // Verify OTP
    const isValidOTP = await otpService.verifyOTP(phone, otp);
    if (!isValidOTP) {
      throw new Error("Invalid or expired OTP");
    }

    // Update user verification status
    const user = await User.findOneAndUpdate(
      { phone },
      { isVerified: true, phoneVerified: true },
      { new: true }
    ).select("-passwordHash");

    if (!user) {
      throw new Error("User not found");
    }

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription,
      },
      token,
    };
  }

  /**
   * Login user with phone and password
   */
  async login(phone, password) {
    // Find user and include password for comparison
    const user = await User.findOne({ phone }).select("+passwordHash");

    if (!user) {
      throw new Error("No account found with this phone number");
    }

    if (!user.isVerified) {
      throw new Error("Please verify your phone number first");
    }

    // Check if password is provided
    if (!password) {
      throw new Error("Password is required");
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      throw new Error(
        "No password set for this account. Please use OTP login or set a password first"
      );
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      throw new Error("Incorrect password");
    }

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription,
      },
      token,
    };
  }

  /**
   * Login with OTP (passwordless login)
   */
  async loginWithOTP(contact, otp) {
    // Verify OTP for phone or email
    const isValidOTP = await otpService.verifyOTP(contact, otp);
    if (!isValidOTP) {
      throw new Error("Invalid or expired OTP");
    }

    // Determine whether contact is email or phone
    const isEmail = String(contact).includes("@");

    // Find user by phone or email
    const user = await User.findOne(
      isEmail ? { email: contact.toLowerCase() } : { phone: contact }
    ).select("-passwordHash");

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isVerified) {
      // Verify user if OTP is valid
      user.isVerified = true;
      await user.save();
    }

    // Generate token
    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription,
      },
      token,
    };
  }

  /**
   * Send OTP for login
   */
  async sendLoginOTP(contact) {
    const isEmail = String(contact).includes("@");
    // Check if user exists based on contact type
    const user = await User.findOne(
      isEmail ? { email: contact.toLowerCase() } : { phone: contact }
    );
    if (!user) {
      throw new Error(
        isEmail
          ? "User not found with this email"
          : "User not found with this phone number"
      );
    }

    // Send OTP
    await otpService.sendOTPToContact(contact);

    return {
      message: "OTP sent successfully",
      contact: isEmail
        ? contact.replace(/(^.).+(@.*$)/, "$1***$2")
        : String(contact).replace(/(\d{6})(\d{4})/, "******$2"),
    };
  }

  /**
   * Set password for user
   */
  async setPassword(userId, password) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.passwordHash = password; // Will be hashed by pre-save middleware
    await user.save();

    return {
      message: "Password set successfully",
    };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    if (user.passwordHash) {
      const isCurrentPasswordValid = await user.matchPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }
    }

    // Set new password
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    return {
      message: "Password changed successfully",
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(phone, otp, newPassword) {
    // Verify OTP
    const isValidOTP = await otpService.verifyOTP(phone, otp);
    if (!isValidOTP) {
      throw new Error("Invalid or expired OTP");
    }

    // Find user and update password
    const user = await User.findOne({ phone });
    if (!user) {
      throw new Error("User not found");
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    return {
      message: "Password reset successfully",
    };
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetOTP(phone) {
    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      throw new Error("User not found with this phone number");
    }

    // Send OTP
    await otpService.sendOTPToContact(phone);

    return {
      message: "Password reset OTP sent successfully",
      phone: phone.replace(/(\d{6})(\d{4})/, "******$2"), // Mask phone number
    };
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

      if (decoded.type !== "refresh") {
        throw new Error("Invalid refresh token");
      }

      const user = await User.findById(decoded.id).select("-passwordHash");
      if (!user || !user.isVerified) {
        throw new Error("User not found or not verified");
      }

      const newToken = this.generateToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          subscription: user.subscription,
        },
      };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    return await User.findById(userId).select("-passwordHash");
  }

  /**
   * Logout user
   */
  async logout(userId) {
    // In a more complex system, you might want to blacklist the token
    // For now, we'll just return success as the client will remove the token
    return {
      message: "Logged out successfully",
    };
  }
  /**
   * Admin login
   */
  async adminLogin({ email, password }) {
    try {
      // Find admin user by email
      const user = await User.findOne({
        email: email.toLowerCase(),
        role: "admin",
      }).select("+passwordHash");

      if (!user) {
        const error = new Error("Invalid admin credentials");
        error.statusCode = 401;
        throw error;
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        const error = new Error("Invalid admin credentials");
        error.statusCode = 401;
        throw error;
      }

      // Generate token
      const token = this.generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Return user data without password
      const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      };

      return {
        user: userResponse,
        token,
      };
    } catch (error) {
      console.error("Admin login service error:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
