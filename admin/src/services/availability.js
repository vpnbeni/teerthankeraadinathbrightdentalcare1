import api from "./api";

/**
 * Availability Service
 * Clean API calls for availability management
 */

const availabilityService = {
  // Get availability settings
  getAvailabilitySettings: async () => {
    try {
      const response = await api.get("/admin/availability/settings");
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch availability settings"
      );
    }
  },

  // Update availability settings
  updateAvailabilitySettings: async (settingsData) => {
    try {
      const response = await api.put(
        "/admin/availability/settings",
        settingsData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to update availability settings"
      );
    }
  },

  // Get availability for date range
  getAvailability: async (params = {}) => {
    try {
      const response = await api.get("/admin/availability", { params });
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch availability"
      );
    }
  },

  // Generate availability
  generateAvailability: async (data) => {
    try {
      const response = await api.post("/admin/availability/generate", data);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to generate availability"
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

  // Template Management
  getAvailabilityTemplate: async () => {
    try {
      const response = await api.get("/admin/availability/template");
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch availability template"
      );
    }
  },

  updateAvailabilityTemplate: async (templateData) => {
    try {
      const response = await api.put(
        "/admin/availability/template",
        templateData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to update availability template"
      );
    }
  },

  addTemplateSlot: async (slotData) => {
    try {
      const response = await api.post(
        "/admin/availability/template/slots",
        slotData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to add template slot"
      );
    }
  },

  removeTemplateSlot: async (slotId) => {
    try {
      const response = await api.delete(
        `/admin/availability/template/slots/${slotId}`
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to remove template slot"
      );
    }
  },

  // Holiday Management
  getHolidays: async () => {
    try {
      const response = await api.get("/admin/availability/holidays");
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch holidays"
      );
    }
  },

  addHoliday: async (holidayData) => {
    try {
      const response = await api.post(
        "/admin/availability/holidays",
        holidayData
      );
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to add holiday");
    }
  },

  updateHoliday: async (id, holidayData) => {
    try {
      const response = await api.put(
        `/admin/availability/holidays/${id}`,
        holidayData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update holiday"
      );
    }
  },

  deleteHoliday: async (id) => {
    try {
      const response = await api.delete(`/admin/availability/holidays/${id}`);
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete holiday"
      );
    }
  },

  bulkAddHolidays: async (holidaysData) => {
    try {
      const response = await api.post(
        "/admin/availability/holidays/bulk",
        holidaysData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to bulk add holidays"
      );
    }
  },

  // Custom Date Management
  getCustomDates: async () => {
    try {
      const response = await api.get("/admin/availability/custom-dates");
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch custom dates"
      );
    }
  },

  addCustomDate: async (customDateData) => {
    try {
      const response = await api.post(
        "/admin/availability/custom-dates",
        customDateData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to add custom date"
      );
    }
  },

  updateCustomDate: async (id, customDateData) => {
    try {
      const response = await api.put(
        `/admin/availability/custom-dates/${id}`,
        customDateData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update custom date"
      );
    }
  },

  deleteCustomDate: async (id) => {
    try {
      const response = await api.delete(
        `/admin/availability/custom-dates/${id}`
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete custom date"
      );
    }
  },

  bulkAddCustomDates: async (customDatesData) => {
    try {
      const response = await api.post(
        "/admin/availability/custom-dates/bulk",
        customDatesData
      );
      return response;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to bulk add custom dates"
      );
    }
  },
};

export default availabilityService;
