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
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response;
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      return response;
    } finally {
      // Always clear localStorage token regardless of server response
      localStorage.removeItem("token");
    }
  },

  // Resend OTP
  resendOTP: async (phone) => {
    const response = await api.post("/auth/resend-otp", { phone });
    return response;
  },

  // Check if user is authenticated
  checkAuth: async () => {
    // Token is in localStorage, will be sent via Authorization header
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
    const response = await api.post("/auth/login-otp", data, {
      skipErrorMessage: true, // Skip global error toast
      skipRedirect: true, // Skip global redirect on 401
    });
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
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
 * Check phone availability
 */
export const checkPhoneAvailability = async (phone) => {
  try {
    const response = await api.get(
      `/auth/check-phone?phone=${encodeURIComponent(phone)}`
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
    const response = await api.post("/auth/send-email-otp", { email }, {
      skipSuccessMessage: true,
      skipErrorMessage: true,
    });
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
    const response = await api.post("/auth/verify-email-otp", { email, otp }, {
      skipSuccessMessage: true,
      skipErrorMessage: true,
    });
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
    // Store token in localStorage if provided
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Send OTP to phone for profile verification
 */
export const sendPhoneOTPForProfile = async (phone) => {
  try {
    const response = await api.post(
      "/auth/send-phone-otp-profile",
      { phone },
      {
        skipSuccessMessage: true,
        skipErrorMessage: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify phone OTP for profile
 */
export const verifyPhoneOTPForProfile = async (phone, otp) => {
  try {
    const response = await api.post(
      "/auth/verify-phone-otp-profile",
      {
        phone,
        otp,
      },
      {
        skipSuccessMessage: true,
        skipErrorMessage: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default authService;
