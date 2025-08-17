import api from "./api";
import availabilityService from "./availability";

// Track ongoing booking requests to prevent duplicates
const ongoingBookings = new Map();

const appointmentService = {
  // Get all appointments for the user
  getAppointments: async () => {
    const response = await api.get("/appointments");
    return response;
  },

  // Create new appointment
  createAppointment: async (appointmentData) => {
    // Create a unique key for this booking request
    const bookingKey = `${appointmentData.date}-${appointmentData.timeSlot}`;

    // Check if this booking is already in progress
    if (ongoingBookings.has(bookingKey)) {
      // Instead of throwing an error, wait for the ongoing request to complete
      console.log("Duplicate booking request detected, waiting for ongoing request...");
      return await ongoingBookings.get(bookingKey);
    }

    // Create the booking promise and store it
    const bookingPromise = (async () => {
      try {
        // Ensure date is sent as YYYY-MM-DD (local) to avoid timezone drift
        const d =
          typeof appointmentData.date === "string"
            ? new Date(appointmentData.date + "T00:00:00")
            : new Date(appointmentData.date);
        const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;

        const response = await api.post(
          "/appointments",
          {
            date: localDate,
            timeSlot: appointmentData.timeSlot,
            notes: appointmentData.notes,
            personalDetails: appointmentData.personalDetails,
            medicalInfo: appointmentData.medicalInfo,
          },
          {
            // Prevent interceptor from showing success/error toasts.
            // Booking component will handle toasts explicitly to avoid duplicates.
            skipSuccessMessage: true,
            skipErrorMessage: true,
          }
        );

        return response;
      } finally {
        // Always remove the booking key when done
        ongoingBookings.delete(bookingKey);
      }
    })();

    // Store the promise so duplicate requests can wait for it
    ongoingBookings.set(bookingKey, bookingPromise);

    return bookingPromise;
  },

  // Alias for createAppointment to match slice usage
  bookAppointment: async (appointmentData) => {
    return appointmentService.createAppointment(appointmentData);
  },

  // Get available time slots for a date (with enhanced availability data)
  getAvailableSlots: async (date) => {
    const d =
      typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
    const formattedDate = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    try {
      // Use the new frontend availability processing
      const availabilityResponse = await availabilityService.getAvailableTimeSlotsForDate(
        formattedDate
      );

      if (availabilityResponse.data.success) {
        const slots = availabilityResponse.data.data.availableSlots || [];
        const metadata = availabilityResponse.data.data.metadata || {};

        // Handle special cases based on new availability system metadata
        if (metadata.isHoliday) {
          return {
            data: {
              success: true,
              data: {
                availableSlots: [],
                metadata: {
                  isWorkingDay: false,
                  isHoliday: true,
                  holidayName: metadata.holidayName,
                  reason: metadata.reason,
                  type: metadata.type,
                },
              },
            },
          };
        }

        if (!metadata.isWorkingDay) {
          return {
            data: {
              success: true,
              data: {
                availableSlots: [],
                metadata: {
                  isWorkingDay: false,
                  isHoliday: false,
                  reason: metadata.reason,
                  type: metadata.type,
                },
              },
            },
          };
        }

        // Filter out any undefined or invalid slots
        const validSlots = slots.filter(
          (slot) => slot && typeof slot === "string" && slot.includes("-")
        );

        return {
          data: {
            success: true,
            data: {
              availableSlots: validSlots,
              metadata: {
                isWorkingDay: metadata.isWorkingDay,
                isHoliday: metadata.isHoliday,
                holidayName: metadata.holidayName,
                template: metadata.template,
                totalSlots: metadata.totalSlots,
                availableSlots: metadata.availableSlots,
                bookedSlots: metadata.bookedSlots,
              },
            },
          },
        };
      }
    } catch (error) {
      console.warn(
        "New availability processing failed, falling back to legacy:",
        error
      );
    }

    // Fallback to legacy endpoint
    const response = await api.get(
      `/appointments/available-slots/${formattedDate}`
    );
    return response;
  },

  // Get available dates in a range (for calendar view)
  getAvailableDates: async (startDate, endDate) => {
    try {
      // Try using the new availability service first
      const response = await api.get("/availability/availability/dates", {
        params: {
          startDate: (() => {
            const s =
              typeof startDate === "string"
                ? new Date(startDate + "T00:00:00")
                : new Date(startDate);
            return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(s.getDate()).padStart(2, "0")}`;
          })(),
          endDate: (() => {
            const e =
              typeof endDate === "string"
                ? new Date(endDate + "T00:00:00")
                : new Date(endDate);
            return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(e.getDate()).padStart(2, "0")}`;
          })(),
        },
      });

      if (response.data.success) {
        // Format to match expected structure
        return {
          data: {
            success: true,
            data: response.data.data.map(
              (item) => item.dateString || item.date
            ),
          },
        };
      }
    } catch (error) {
      console.warn(
        "New availability dates endpoint failed, falling back to legacy:",
        error
      );
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
