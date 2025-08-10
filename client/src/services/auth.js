import api from "./api";

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response;
  },

  // Verify OTP
  verifyOTP: async (otpData) => {
    const response = await api.post("/auth/verify-phone", otpData);
    // Token is set as HTTP-only cookie by server, no need to store in localStorage
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    // Token is set as HTTP-only cookie by server, no need to store in localStorage
    return response;
  },

  // Logout user
  logout: async () => {
    const response = await api.post("/auth/logout");
    // Token is cleared by server via cookie, no localStorage to clear
    return response;
  },

  // Resend OTP
  resendOTP: async (phone) => {
    const response = await api.post("/auth/resend-otp", { phone });
    return response;
  },

  // Check if user is authenticated
  checkAuth: async () => {
    // Token is in HTTP-only cookie, server will validate automatically
    const response = await api.get("/auth/check");
    return response;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response;
  },

  // Request password reset
  requestPasswordReset: async (phone) => {
    const response = await api.post("/auth/forgot-password", { phone });
    return response;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await api.post("/auth/reset-password", resetData);
    return response;
  },

  // Send OTP for login
  sendLoginOTP: async (data) => {
    const response = await api.post("/auth/send-login-otp", data);
    return response;
  },

  // Login with OTP
  loginWithOTP: async (data) => {
    const response = await api.post("/auth/login-otp", data);
    return response;
  },
};

/**
 * Check email availability
 */
export const checkEmailAvailability = async (email) => {
  try {
    const response = await api.get(
      `/auth/check-email?email=${encodeURIComponent(email)}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Send OTP to email
 */
export const sendEmailOTP = async (email) => {
  try {
    const response = await api.post("/auth/send-email-otp", { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify email OTP
 */
export const verifyEmailOTP = async (email, otp) => {
  try {
    const response = await api.post("/auth/verify-email-otp", { email, otp });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const registerWithEmail = async (email, name, planId, otp) => {
  try {
    const response = await api.post("/auth/register-with-email", {
      email,
      name,
      planId,
      otp,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default authService;
