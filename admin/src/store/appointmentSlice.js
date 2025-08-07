import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import appointmentService from "../services/appointments";

/**
 * Appointment Redux Slice
 * Clean state management for appointments
 */

// Async thunks
export const fetchAppointments = createAsyncThunk(
  "appointments/fetchAppointments",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointments(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createAppointment = createAsyncThunk(
  "appointments/createAppointment",
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await appointmentService.createAppointment(
        appointmentData
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateAppointment = createAsyncThunk(
  "appointments/updateAppointment",
  async ({ appointmentId, updateData }, { rejectWithValue }) => {
    try {
      const response = await appointmentService.updateAppointment(
        appointmentId,
        updateData
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const confirmAppointment = createAsyncThunk(
  "appointments/confirmAppointment",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await appointmentService.confirmAppointment(
        appointmentId
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completeAppointment = createAsyncThunk(
  "appointments/completeAppointment",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await appointmentService.completeAppointment(
        appointmentId
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rescheduleAppointment = createAsyncThunk(
  "appointments/rescheduleAppointment",
  async (
    { appointmentId, newDate, newTimeSlot, reason },
    { rejectWithValue }
  ) => {
    try {
      const response = await appointmentService.rescheduleAppointment(
        appointmentId,
        {
          newDate,
          newTimeSlot,
          reason,
        }
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  "appointments/cancelAppointment",
  async ({ appointmentId, reason }, { rejectWithValue }) => {
    try {
      const response = await appointmentService.cancelAppointment(
        appointmentId,
        reason
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const bulkUpdateAppointments = createAsyncThunk(
  "appointments/bulkUpdateAppointments",
  async ({ appointmentIds, action, reason }, { rejectWithValue }) => {
    try {
      const response = await appointmentService.bulkUpdateAppointments(
        appointmentIds,
        action,
        reason
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAppointmentStatistics = createAsyncThunk(
  "appointments/fetchAppointmentStatistics",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await appointmentService.getAppointmentStatistics(
        params
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRecentAppointments = createAsyncThunk(
  "appointments/fetchRecentAppointments",
  async (params = {}, { rejectWithValue }) => {
    try {
      console.log("Appointment slice: Fetching recent appointments...");
      const response = await appointmentService.getAppointments({
        ...params,
        sort: "-createdAt",
      });
      console.log("Appointment slice: Recent appointments response:", response);
      return response;
    } catch (error) {
      console.error("Appointment slice: Recent appointments error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  appointments: [],
  recentAppointments: [],
  selectedAppointment: null,
  statistics: null,
  totalAppointments: 0,
  currentPage: 1,
  totalPages: 1,
  loading: false,
  error: null,
  viewMode: "list", // "list" or "calendar"
  selectedDate: new Date().toISOString().split("T")[0],
  filters: {
    status: "",
    startDate: "",
    endDate: "",
    userId: "",
  },
  selectedAppointments: [],
  bulkActionLoading: false,
};

// Slice
const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset to first page when filters change
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        status: "",
        startDate: "",
        endDate: "",
        userId: "",
      };
      state.currentPage = 1;
    },

    // Set view mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    // Set current page
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    // Set selected date
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },

    // Select appointment
    setSelectedAppointment: (state, action) => {
      state.selectedAppointment = action.payload;
    },

    // Clear selected appointment
    clearSelectedAppointment: (state) => {
      state.selectedAppointment = null;
    },

    // Toggle appointment selection for bulk actions
    toggleAppointmentSelection: (state, action) => {
      const appointmentId = action.payload;
      const index = state.selectedAppointments.findIndex(
        (id) => id === appointmentId
      );

      if (index > -1) {
        state.selectedAppointments.splice(index, 1);
      } else {
        state.selectedAppointments.push(appointmentId);
      }
    },

    // Select all appointments
    selectAllAppointments: (state) => {
      state.selectedAppointments = state.appointments.map((apt) => apt._id);
    },

    // Clear selected appointments
    clearSelectedAppointments: (state) => {
      state.selectedAppointments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload.data?.appointments || [];
        state.totalAppointments =
          action.payload.data?.pagination?.totalAppointments || 0;
        state.totalPages = action.payload.data?.pagination?.totalPages || 1;
        state.currentPage = action.payload.data?.pagination?.currentPage || 1;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create appointment
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data?.appointment) {
          state.appointments.unshift(action.payload.data.appointment);
          state.totalAppointments += 1;
        }
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update appointment
      .addCase(updateAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAppointment = action.payload.data?.appointment;
        if (updatedAppointment) {
          const index = state.appointments.findIndex(
            (apt) => apt._id === updatedAppointment._id
          );
          if (index > -1) {
            state.appointments[index] = updatedAppointment;
          }
          if (state.selectedAppointment?._id === updatedAppointment._id) {
            state.selectedAppointment = updatedAppointment;
          }
        }
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Confirm appointment
      .addCase(confirmAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const confirmedAppointment = action.payload.data?.appointment;
        if (confirmedAppointment) {
          const index = state.appointments.findIndex(
            (apt) => apt._id === confirmedAppointment._id
          );
          if (index > -1) {
            state.appointments[index] = confirmedAppointment;
          }
          if (state.selectedAppointment?._id === confirmedAppointment._id) {
            state.selectedAppointment = confirmedAppointment;
          }
        }
      })
      .addCase(confirmAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Complete appointment
      .addCase(completeAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const completedAppointment = action.payload.data?.appointment;
        if (completedAppointment) {
          const index = state.appointments.findIndex(
            (apt) => apt._id === completedAppointment._id
          );
          if (index > -1) {
            state.appointments[index] = completedAppointment;
          }
          if (state.selectedAppointment?._id === completedAppointment._id) {
            state.selectedAppointment = completedAppointment;
          }
        }
      })
      .addCase(completeAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reschedule appointment
      .addCase(rescheduleAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rescheduleAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const rescheduledAppointment = action.payload.data?.appointment;
        if (rescheduledAppointment) {
          const index = state.appointments.findIndex(
            (apt) => apt._id === rescheduledAppointment._id
          );
          if (index > -1) {
            state.appointments[index] = rescheduledAppointment;
          }
        }
      })
      .addCase(rescheduleAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Cancel appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const cancelledAppointment = action.payload.data?.appointment;
        if (cancelledAppointment) {
          const index = state.appointments.findIndex(
            (apt) => apt._id === cancelledAppointment._id
          );
          if (index > -1) {
            state.appointments[index] = cancelledAppointment;
          }
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Bulk update appointments
      .addCase(bulkUpdateAppointments.pending, (state) => {
        state.bulkActionLoading = true;
        state.error = null;
      })
      .addCase(bulkUpdateAppointments.fulfilled, (state) => {
        state.bulkActionLoading = false;
        state.selectedAppointments = [];
        // Refresh appointments after bulk action
      })
      .addCase(bulkUpdateAppointments.rejected, (state, action) => {
        state.bulkActionLoading = false;
        state.error = action.payload;
      })

      // Fetch statistics
      .addCase(fetchAppointmentStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload.data || action.payload;
      })
      .addCase(fetchAppointmentStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch recent appointments
      .addCase(fetchRecentAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.recentAppointments =
          action.payload.data?.appointments ||
          action.payload.appointments ||
          [];
      })
      .addCase(fetchRecentAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  clearError,
  setFilters,
  clearFilters,
  setViewMode,
  setCurrentPage,
  setSelectedDate,
  setSelectedAppointment,
  clearSelectedAppointment,
  toggleAppointmentSelection,
  selectAllAppointments,
  clearSelectedAppointments,
} = appointmentSlice.actions;

// Export reducer
export default appointmentSlice.reducer;
