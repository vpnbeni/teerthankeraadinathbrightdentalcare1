import api from "./api";

/**
 * Session Limits Service
 * Handles API calls related to session limits and booking eligibility
 */

const sessionLimitsService = {
  /**
   * Get user's session limit information
   */
  getSessionLimits: async () => {
    try {
      const response = await api.get("/session-limits");
      return response.data;
    } catch (error) {
      console.error("Get session limits error:", error);
      throw error;
    }
  },

  /**
   * Check if user can book appointments
   */
  canBookAppointment: async () => {
    try {
      const response = await api.get("/session-limits/can-book");
      return response.data;
    } catch (error) {
      console.error("Can book appointment check error:", error);
      throw error;
    }
  },
};

export default sessionLimitsService;
