import api from "./api";

const appointmentService = {
  // Get all appointments for the user
  getAppointments: async () => {
    const response = await api.get("/appointments");
    return response;
  },

  // Create new appointment
  createAppointment: async (appointmentData) => {
    const response = await api.post("/appointments", {
      date: appointmentData.date,
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

  // Get available time slots for a date
  getAvailableSlots: async (date) => {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    const response = await api.get(
      `/appointments/available-slots/${formattedDate}`
    );
    return response;
  },

  // Get available dates in a range (for calendar view)
  getAvailableDates: async (startDate, endDate) => {
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
