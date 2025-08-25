import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appointmentService from "../services/appointments";

// Async thunks
export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching appointments...");
      const response = await appointmentService.getAppointments();
      console.log("Appointments API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch appointments"
      );
    }
  }
);

export const bookAppointment = createAsyncThunk(
  "appointments/book",
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await appointmentService.bookAppointment(
        appointmentData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to book appointment"
      );
    }
  }
);

export const getAvailableSlots = createAsyncThunk(
  "appointments/getAvailableSlots",
  async (date, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAvailableSlots(date);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch available slots"
      );
    }
  }
);

const initialState = {
  appointments: [],
  upcomingAppointments: [],
  pastAppointments: [],
  availableSlots: {
    slots: [],
    metadata: {},
    totalSlots: 0,
    availableCount: 0,
    date: null,
  },
  isLoading: false,
  error: null,
  bookingStep: 1, // 1: Personal Details, 2: Date Selection, 3: Time Slot
  bookingData: {
    personalDetails: {},
    selectedDate: null,
    selectedTimeSlot: null,
  },
};

const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setBookingStep: (state, action) => {
      state.bookingStep = action.payload;
    },
    updateBookingData: (state, action) => {
      state.bookingData = { ...state.bookingData, ...action.payload };
    },
    resetBookingData: (state) => {
      state.bookingData = {
        personalDetails: {},
        selectedDate: null,
        selectedTimeSlot: null,
      };
      state.bookingStep = 1;
    },
    clearAvailableSlots: (state) => {
      state.availableSlots = {
        slots: [],
        metadata: {},
        totalSlots: 0,
        availableCount: 0,
        date: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        console.log(
          "fetchAppointments fulfilled with payload:",
          action.payload
        );
        state.isLoading = false;
        // Handle API response structure: { success: true, data: { appointments: [...] } }
        const appointments =
          action.payload.data?.appointments ||
          action.payload.appointments ||
          [];
        state.appointments = appointments;

        // Separate upcoming and past appointments, including follow-ups
        const now = new Date();
        // Get current date in local timezone for fair comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        
        const allUpcomingAppointments = [];
        const allPastAppointments = [];

        console.log("Current date/time for comparison:", now);
        console.log("Today (start of day):", today);
        console.log("Processing appointments:", appointments.length);

        appointments.forEach((apt) => {
          console.log(`Processing appointment ${apt._id}:`, {
            date: apt.date,
            status: apt.status,
            followUpsCount: apt.followUps?.length || 0
          });

          // Add main appointment
          const aptDate = new Date(apt.date);
          aptDate.setHours(0, 0, 0, 0); // Set to start of appointment day for fair comparison
          if (aptDate >= today && apt.status !== "cancelled") {
            console.log(`Main appointment ${apt._id} added to upcoming`);
            allUpcomingAppointments.push(apt);
          } else {
            console.log(`Main appointment ${apt._id} added to past`);
            allPastAppointments.push(apt);
          }

          // Add follow-ups as separate appointments
          if (apt.followUps && apt.followUps.length > 0) {
            apt.followUps.forEach((followUp, index) => {
              const followUpDate = new Date(followUp.date);
              followUpDate.setHours(0, 0, 0, 0); // Set to start of follow-up day for fair comparison
              console.log(`Processing follow-up ${index + 1}:`, {
                date: followUp.date,
                dateObject: followUpDate,
                today: today,
                status: followUp.status,
                isUpcoming: followUpDate >= today && followUp.status !== "cancelled"
              });

              const followUpAppointment = {
                ...followUp,
                _id: `${apt._id}_followup_${index}`,
                parentAppointmentId: apt._id,
                userId: apt.userId,
                isFollowUp: true,
                followUpNumber: index + 1,
                parentAppointment: {
                  _id: apt._id,
                  date: apt.date,
                  timeSlot: apt.timeSlot,
                  sessionNumber: apt.sessionNumber
                },
                // Use followUp date instead of main appointment date
                date: followUp.date,
                timeSlot: followUp.timeSlot,
                status: followUp.status || 'scheduled',
                notes: followUp.notes,
                createdAt: followUp.scheduledAt || followUp.createdAt,
                updatedAt: followUp.scheduledAt || followUp.createdAt
              };

              if (followUpDate >= today && followUp.status !== "cancelled") {
                console.log(`Follow-up ${index + 1} added to upcoming appointments`);
                allUpcomingAppointments.push(followUpAppointment);
              } else {
                console.log(`Follow-up ${index + 1} added to past appointments`);
                allPastAppointments.push(followUpAppointment);
              }
            });
          }
        });

        // Sort by date
        state.upcomingAppointments = allUpcomingAppointments.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        state.pastAppointments = allPastAppointments.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        console.log("Upcoming appointments:", state.upcomingAppointments);
        console.log("Past appointments:", state.pastAppointments);

        state.error = null;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Book Appointment
      .addCase(bookAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        const appointment =
          action.payload.data?.appointment ||
          action.payload.appointment ||
          action.payload;
        state.appointments.push(appointment);
        state.upcomingAppointments.push(appointment);
        state.bookingData = {
          personalDetails: {},
          selectedDate: null,
          selectedTimeSlot: null,
        };
        state.bookingStep = 1;
        state.error = null;
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Available Slots
      .addCase(getAvailableSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAvailableSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle new availability system response format
        const responseData = action.payload.data || {};
        const slots = responseData.availableSlots || [];
        const metadata = responseData.metadata || {};

        state.availableSlots = {
          slots,
          metadata,
          totalSlots: responseData.totalSlots || 0,
          availableCount: responseData.availableCount || slots.length,
          date: responseData.date,
        };
        state.error = null;
      })
      .addCase(getAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.availableSlots = {
          slots: [],
          metadata: {},
          totalSlots: 0,
          availableCount: 0,
          date: null,
        };
      });
  },
});

export const {
  clearError,
  setBookingStep,
  updateBookingData,
  resetBookingData,
  clearAvailableSlots,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
