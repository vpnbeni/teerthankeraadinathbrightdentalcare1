import api from "./api";

const appointmentService = {
  // Get all appointments for the user
  getAppointments: async () => {
    const response = await api.get("/appointments");
    return response;
  },

  // Create new appointment
  createAppointment: async (appointmentData) => {
    // Ensure date is sent as YYYY-MM-DD (local) to avoid timezone drift
    const d = typeof appointmentData.date === "string" ? new Date(appointmentData.date + "T00:00:00") : new Date(appointmentData.date);
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const response = await api.post("/appointments", {
      date: localDate,
      timeSlot: appointmentData.timeSlot,
      notes: appointmentData.notes,
      personalDetails: appointmentData.personalDetails,
      medicalInfo: appointmentData.medicalInfo,
    });
    return response;
  },

  // Alias for createAppointment to match slice usage
  bookAppointment: async (appointmentData) => {
    return appointmentService.createAppointment(appointmentData);
  },

  // Get available time slots for a date (with enhanced availability data)
  getAvailableSlots: async (date) => {
    const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    
    try {
      // First try the new availability endpoint for enhanced data
      const availabilityResponse = await api.get(`/availability/availability/date/${formattedDate}`);
      
      if (availabilityResponse.data.success && availabilityResponse.data.data.available) {
        const availability = availabilityResponse.data.data;
        // Format response to match expected structure
        return {
          data: {
            success: true,
            data: {
              availableSlots: availability.slots
                .filter(slot => slot.isAvailable)
                .map(slot => slot.timeSlot),
              metadata: {
                isWorkingDay: availability.available,
                isHoliday: availability.type === "holiday",
                holidayName: availability.holiday?.reason,
                template: availability.template,
                totalSlots: availability.totalSlots,
                availableSlots: availability.availableSlots,
                bookedSlots: availability.bookedSlots,
              }
            }
          }
        };
      }
    } catch (error) {
      console.warn("New availability endpoint failed, falling back to legacy:", error);
    }
    
    // Fallback to legacy endpoint
    const response = await api.get(`/appointments/available-slots/${formattedDate}`);
    return response;
  },

  // Get available dates in a range (for calendar view)
  getAvailableDates: async (startDate, endDate) => {
    try {
      // Try using the new availability service first
      const response = await api.get("/availability/availability/dates", {
        params: {
          startDate: (()=>{const s=typeof startDate==="string"?new Date(startDate+"T00:00:00"):new Date(startDate);return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,"0")}-${String(s.getDate()).padStart(2,"0")}`;})(),
          endDate: (()=>{const e=typeof endDate==="string"?new Date(endDate+"T00:00:00"):new Date(endDate);return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`;})(),
        },
      });
      
      if (response.data.success) {
        // Format to match expected structure
        return {
          data: {
            success: true,
            data: response.data.data.map(item => item.dateString || item.date)
          }
        };
      }
    } catch (error) {
      console.warn("New availability dates endpoint failed, falling back to legacy:", error);
    }
    
    // Fallback to legacy endpoint
    const response = await api.get("/appointments/available-dates", {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response;
  },

  // Get appointment by ID
  getAppointment: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId) => {
    const response = await api.delete(`/appointments/${appointmentId}`);
    return response;
  },
};

export default appointmentService;
