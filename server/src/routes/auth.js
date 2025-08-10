import express from "express";
import {
  register,
  verifyPhone,
  login,
  sendLoginOTP,
  loginWithOTP,
  setPassword,
  changePassword,
  forgotPassword,
  resetPassword,
  getProfile,
  logout,
  resendOTP,
  checkAuth,
  testOTP,
  checkPasswordStatus,
  adminLogin,
  checkEmailAvailability,
  sendEmailOTP,
  verifyEmailOTP,
  registerWithEmail,
} from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { auditAuthAccess } from "../middleware/auditMiddleware.js";

const router = express.Router();

/**
 * Authentication Routes
 */

// Public routes
router.post(
  "/register",
  auditAuthAccess,
  validateRequest("register"),
  register
);
router.post(
  "/verify-phone",
  auditAuthAccess,
  validateRequest("verifyPhone"),
  verifyPhone
);
router.post("/login", auditAuthAccess, validateRequest("login"), login);
router.post(
  "/admin/login",
  auditAuthAccess,
  validateRequest("adminLogin"),
  adminLogin
);
router.post(
  "/send-login-otp",
  auditAuthAccess,
  validateRequest("sendOTP"),
  sendLoginOTP
);
router.post(
  "/login-otp",
  auditAuthAccess,
  validateRequest("loginOTP"),
  loginWithOTP
);
router.post(
  "/forgot-password",
  auditAuthAccess,
  validateRequest("sendOTP"),
  forgotPassword
);
router.post(
  "/reset-password",
  auditAuthAccess,
  validateRequest("resetPassword"),
  resetPassword
);
router.post(
  "/resend-otp",
  auditAuthAccess,
  validateRequest("sendOTP"),
  resendOTP
);

// Email validation routes
router.get("/check-email", checkEmailAvailability);
router.post("/send-email-otp", sendEmailOTP);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/register-with-email", registerWithEmail);

// Test endpoints (development only)
if (process.env.NODE_ENV === "development") {
  router.post("/test-msg91", async (req, res) => {
    try {
      const { otpService } = await import("../services/otpService.js");
      const result = await otpService.testConnection();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  router.post("/test-otp", testOTP);
}

// Protected routes
router.get("/check", auth, checkAuth);
router.get("/profile", auth, getProfile);
router.get("/me", auth, getProfile); // Alias for /profile for compatibility
router.post("/logout", auth, logout);
router.post("/set-password", auth, validateRequest("setPassword"), setPassword);
router.post(
  "/change-password",
  auth,
  validateRequest("changePassword"),
  changePassword
);
router.get("/password-status", auth, checkPasswordStatus);

export default router;
