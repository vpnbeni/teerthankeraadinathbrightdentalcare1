import api from "./api";

/**
 * Appointment Service
 * Clean API calls for appointment management
 */

const appointmentService = {
  // Get all appointments with pagination and filters
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get("/appointments", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch appointments"
      );
    }
  },

  // Get all appointments (Admin only)
  getAllAppointments: async (params = {}) => {
    try {
      const response = await api.get("/appointments/admin/all", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch appointments"
      );
    }
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch appointment"
      );
    }
  },

  // Create new appointment
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post("/appointments", appointmentData);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create appointment"
      );
    }
  },

  // Update appointment
  updateAppointment: async (appointmentId, updateData) => {
    try {
      const response = await api.put(
        `/appointments/${appointmentId}`,
        updateData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update appointment"
      );
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, rescheduleData) => {
    try {
      const response = await api.put(
        `/appointments/admin/${appointmentId}/reschedule`,
        rescheduleData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to reschedule appointment"
      );
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    try {
      const response = await api.post(
        `/appointments/admin/${appointmentId}/cancel`,
        { reason }
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to cancel appointment"
      );
    }
  },

  // Confirm appointment (Admin only)
  confirmAppointment: async (appointmentId) => {
    try {
      const response = await api.put(
        `/appointments/admin/${appointmentId}/confirm`
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to confirm appointment"
      );
    }
  },

  // Complete appointment
  completeAppointment: async (appointmentId) => {
    try {
      const response = await api.put(
        `/appointments/admin/${appointmentId}/complete`
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to complete appointment"
      );
    }
  },

  // Get available time slots for a date
  getAvailableSlots: async (date, forceRefresh = false) => {
    try {
      // Add cache-busting parameter to ensure fresh data from backend
      const params = forceRefresh ? { t: Date.now() } : {};
      const response = await api.get(`/appointments/available-slots/${date}`, {
        params,
      });
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch available slots"
      );
    }
  },

  // Bulk update appointments
  bulkUpdateAppointments: async (appointmentIds, action, reason) => {
    try {
      const response = await api.post("/appointments/admin/bulk-update", {
        appointmentIds,
        action,
        reason,
      });
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to perform bulk action"
      );
    }
  },

  // Get appointment statistics
  getAppointmentStatistics: async (params = {}) => {
    try {
      const response = await api.get("/appointments/admin/statistics", {
        params,
      });
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch statistics"
      );
    }
  },

  // Sync holidays with availability records
  syncHolidays: async () => {
    try {
      const response = await api.post("/admin/availability/sync-holidays");
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to sync holidays"
      );
    }
  },
};

export default appointmentService;
