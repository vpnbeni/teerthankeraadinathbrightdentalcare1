import api from "./api";

const availabilityService = {
  // Get availability for a specific date
  getAvailabilityForDate: async (date) => {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    const response = await api.get(`/availability/availability/date/${formattedDate}`);
    return response;
  },

  // Get availability for a date range
  getAvailabilityForDateRange: async (startDate, endDate, onlyAvailable = false) => {
    const params = {
      startDate: new Date(startDate).toISOString().split("T")[0],
      endDate: new Date(endDate).toISOString().split("T")[0],
    };
    
    if (onlyAvailable) {
      params.onlyAvailable = "true";
    }

    const response = await api.get("/availability/availability/range", { params });
    return response;
  },

  // Check if a specific time slot is available
  checkTimeSlotAvailability: async (date, timeSlot, excludeAppointmentId = null) => {
    const data = {
      date: new Date(date).toISOString().split("T")[0],
      timeSlot,
    };

    const params = {};
    if (excludeAppointmentId) {
      params.excludeAppointmentId = excludeAppointmentId;
    }

    const response = await api.post("/availability/availability/check-slot", data, { params });
    return response;
  },

  // Get available dates in a range
  getAvailableDates: async (startDate, endDate) => {
    const params = {
      startDate: new Date(startDate).toISOString().split("T")[0],
      endDate: new Date(endDate).toISOString().split("T")[0],
    };

    const response = await api.get("/availability/availability/dates", { params });
    return response;
  },
};

export default availabilityService;