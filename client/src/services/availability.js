import api from "./api";

const availabilityService = {
  // Get availability for a specific date
  getAvailabilityForDate: async (date) => {
    // Accept either Date or YYYY-MM-DD; always format as local date-only
    const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const response = await api.get(`/availability/availability/date/${formattedDate}`);
    return response;
  },

  // Get availability for a date range
  getAvailabilityForDateRange: async (startDate, endDate, onlyAvailable = false) => {
    const s = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : new Date(startDate);
    const e = typeof endDate === "string" ? new Date(endDate + "T00:00:00") : new Date(endDate);
    const params = {
      startDate: `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`,
      endDate: `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`,
    };
    
    if (onlyAvailable) {
      params.onlyAvailable = "true";
    }

    const response = await api.get("/availability/availability/range", { params });
    return response;
  },

  // Check if a specific time slot is available
  checkTimeSlotAvailability: async (date, timeSlot, excludeAppointmentId = null) => {
    const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
    const data = {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
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
    const s = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : new Date(startDate);
    const e = typeof endDate === "string" ? new Date(endDate + "T00:00:00") : new Date(endDate);
    const params = {
      startDate: `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`,
      endDate: `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`,
    };

    const response = await api.get("/availability/availability/dates", { params });
    return response;
  },
};

export default availabilityService;