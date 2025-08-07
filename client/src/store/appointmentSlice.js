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

        // Separate upcoming and past appointments
        const now = new Date();
        state.upcomingAppointments = appointments.filter(
          (apt) => new Date(apt.date) >= now && apt.status !== "cancelled"
        );
        state.pastAppointments = appointments.filter(
          (apt) => new Date(apt.date) < now || apt.status === "cancelled"
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
