import api from "./api";

const analyticsService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get("/analytics/dashboard");
    return response;
  },

  // Get payment analytics (using revenue endpoint)
  getPaymentAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/revenue", { params });
    return response;
  },

  // Get session analytics
  getSessionAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/sessions", { params });
    return response;
  },

  // Get booking analytics (using appointments endpoint)
  getBookingAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/appointments", { params });
    return response;
  },

  // Get revenue analytics
  getRevenueAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/revenue", { params });
    return response;
  },

  // Get user growth analytics
  getUserGrowthAnalytics: async (params = {}) => {
    const response = await api.get("/analytics/users", { params });
    return response;
  },

  // Get plan distribution analytics (part of revenue analytics)
  getPlanDistributionAnalytics: async () => {
    const response = await api.get("/analytics/revenue");
    return response;
  },

  // Get appointment patterns
  getAppointmentPatterns: async (params = {}) => {
    const response = await api.get("/analytics/appointments", {
      params,
    });
    return response;
  },

  // Get time slot utilization (part of appointment analytics)
  getTimeSlotUtilization: async (params = {}) => {
    const response = await api.get("/analytics/appointments", {
      params,
    });
    return response;
  },

  // Get cancellation rates (part of appointment analytics)
  getCancellationRates: async (params = {}) => {
    const response = await api.get("/analytics/appointments", {
      params,
    });
    return response;
  },

  // Get completion rates (part of session analytics)
  getCompletionRates: async (params = {}) => {
    const response = await api.get("/analytics/sessions", {
      params,
    });
    return response;
  },

  // Export analytics data
  exportAnalytics: async (type, params = {}) => {
    const response = await api.get(`/analytics/export/${type}`, {
      params,
      responseType: "blob",
    });
    return response;
  },

  // Get custom report
  getCustomReport: async (reportConfig) => {
    const response = await api.post("/analytics/custom-report", reportConfig);
    return response;
  },
};

export default analyticsService;
