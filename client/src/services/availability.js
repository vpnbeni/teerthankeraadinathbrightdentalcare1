import api from "./api";
import {
  generateAvailabilityForDate,
  generateAvailabilityForDateRange,
  getAvailableTimeSlots,
  isTimeSlotAvailable,
} from "../utils/availabilityUtils";

const availabilityService = {
  // Get availability for a specific date (legacy - for backward compatibility)
  getAvailabilityForDate: async (date) => {
    // Accept either Date or YYYY-MM-DD; always format as local date-only
    const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const response = await api.get(`/availability/availability/date/${formattedDate}`);
    return response;
  },

  // Get availability for a date range (legacy - for backward compatibility)
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

  // NEW: Get availability template data for a specific date (frontend processing)
  getAvailabilityTemplateForDate: async (date) => {
    const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const response = await api.get(`/availability/availability/template/date/${formattedDate}`);
    return response;
  },

  // NEW: Get availability templates for a date range (frontend processing)
  getAvailabilityTemplatesForDateRange: async (startDate, endDate, onlyAvailable = false) => {
    const s = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : new Date(startDate);
    const e = typeof endDate === "string" ? new Date(endDate + "T00:00:00") : new Date(endDate);
    const params = {
      startDate: `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`,
      endDate: `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`,
    };
    
    if (onlyAvailable) {
      params.onlyAvailable = "true";
    }

    const response = await api.get("/availability/availability/templates/range", { params });
    return response;
  },

  // NEW: Get all availability data for a date range (templates, holidays, booked slots)
  getAvailabilityDataForRange: async (startDate, endDate) => {
    const s = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : new Date(startDate);
    const e = typeof endDate === "string" ? new Date(endDate + "T00:00:00") : new Date(endDate);
    const params = {
      startDate: `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`,
      endDate: `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`,
    };

    const response = await api.get("/availability/availability/data/range", { params });
    return response;
  },

  // NEW: Generate availability for a date using frontend processing
  generateAvailabilityForDate: async (date, options = {}) => {
    try {
      // Get the date range for the month containing this date
      const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
      const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
      const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      // Get all availability data for the month
      const response = await availabilityService.getAvailabilityDataForRange(startDate, endDate);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch availability data");
      }

      const { templates, holidays, bookedSlots } = response.data.data;
      // Build local date key in YYYY-MM-DD to avoid timezone drift
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const bookedSlotsForDate = bookedSlots[dateKey] || [];

      // Generate availability using frontend utilities
      const availability = generateAvailabilityForDate(
        d,
        templates,
        holidays,
        bookedSlotsForDate,
        options
      );

      return {
        data: {
          success: true,
          data: availability,
        },
      };
    } catch (error) {
      console.error("Error generating availability for date:", error);
      throw error;
    }
  },

  // NEW: Generate availability for a date range using frontend processing
  generateAvailabilityForDateRange: async (startDate, endDate, options = {}) => {
    try {
      // Get all availability data for the date range
      const response = await availabilityService.getAvailabilityDataForRange(startDate, endDate);
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch availability data");
      }

      const { templates, holidays, bookedSlots } = response.data.data;

      // Generate availability using frontend utilities
      const availability = generateAvailabilityForDateRange(
        startDate,
        endDate,
        templates,
        holidays,
        bookedSlots,
        options
      );

      return {
        data: {
          success: true,
          data: availability,
        },
      };
    } catch (error) {
      console.error("Error generating availability for date range:", error);
      throw error;
    }
  },

  // NEW: Get available time slots for a date using frontend processing
  getAvailableTimeSlotsForDate: async (date) => {
    try {
      const availability = await availabilityService.generateAvailabilityForDate(date, { onlyAvailable: true });
      
      if (!availability.data.success || !availability.data.data.available) {
        return {
          data: {
            success: true,
            data: {
              availableSlots: [],
              metadata: {
                isWorkingDay: false,
                isHoliday: availability.data.data.type === "holiday",
                holidayName: availability.data.data.holiday?.reason,
                reason: availability.data.data.reason,
                type: availability.data.data.type,
              },
            },
          },
        };
      }

      const slots = availability.data.data.slots.map(slot => slot.timeSlot);

      return {
        data: {
          success: true,
          data: {
            availableSlots: slots,
            metadata: {
              isWorkingDay: availability.data.data.available,
              isHoliday: availability.data.data.type === "holiday",
              holidayName: availability.data.data.holiday?.reason,
              template: availability.data.data.template,
              totalSlots: availability.data.data.totalSlots,
              availableSlots: availability.data.data.availableSlots,
              bookedSlots: availability.data.data.bookedSlots,
            },
          },
        },
      };
    } catch (error) {
      console.error("Error getting available time slots:", error);
      throw error;
    }
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