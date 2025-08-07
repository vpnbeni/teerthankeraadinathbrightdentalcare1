import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import availabilityService from "../services/availability";
import { showToast } from "../shared/utils/toast";

// Async thunks for holiday management
export const fetchHolidays = createAsyncThunk(
  "holidays/fetchHolidays",
  async (_, { rejectWithValue }) => {
    try {
      const response = await availabilityService.getHolidays();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch holidays"
      );
    }
  }
);

export const addHoliday = createAsyncThunk(
  "holidays/addHoliday",
  async (holidayData, { rejectWithValue }) => {
    try {
      const response = await availabilityService.addHoliday(holidayData);
      showToast.success("Holiday added successfully");
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add holiday";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateHoliday = createAsyncThunk(
  "holidays/updateHoliday",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await availabilityService.updateHoliday(id, data);
      showToast.success("Holiday updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update holiday";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteHoliday = createAsyncThunk(
  "holidays/deleteHoliday",
  async (id, { rejectWithValue }) => {
    try {
      await availabilityService.deleteHoliday(id);
      showToast.success("Holiday deleted successfully");
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete holiday";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const bulkAddHolidays = createAsyncThunk(
  "holidays/bulkAddHolidays",
  async (holidaysData, { rejectWithValue }) => {
    try {
      const response = await availabilityService.bulkAddHolidays(holidaysData);
      showToast.success(
        `${holidaysData.holidays.length} holidays added successfully`
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to bulk add holidays";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  holidays: [],
  loading: false,
  error: null,
  // Optimistic update tracking
  pendingHolidays: [], // Holidays being added optimistically
  removingHolidays: [], // Holidays being removed optimistically
  // Filters and view options
  filters: {
    year: new Date().getFullYear(),
    month: null, // null means all months
    isRecurring: null, // null means all, true/false for filtering
  },
  selectedHoliday: null,
  viewMode: "calendar", // calendar or list
};

// Slice
const holidaySlice = createSlice({
  name: "holidays",
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        year: new Date().getFullYear(),
        month: null,
        isRecurring: null,
      };
    },

    // Set view mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    // Select holiday for editing
    setSelectedHoliday: (state, action) => {
      state.selectedHoliday = action.payload;
    },

    // Clear selected holiday
    clearSelectedHoliday: (state) => {
      state.selectedHoliday = null;
    },

    // Optimistic updates for better UX
    optimisticAddHoliday: (state, action) => {
      const tempHoliday = {
        ...action.payload,
        _id: `temp-${Date.now()}`, // Temporary ID
        isOptimistic: true,
      };
      state.holidays.push(tempHoliday);
      state.pendingHolidays.push(tempHoliday._id);
    },

    optimisticUpdateHoliday: (state, action) => {
      const { id, data } = action.payload;
      const index = state.holidays.findIndex((holiday) => holiday._id === id);
      if (index >= 0) {
        // Store original for rollback
        state.holidays[index].original = { ...state.holidays[index] };
        state.holidays[index] = { ...state.holidays[index], ...data };
      }
    },

    optimisticDeleteHoliday: (state, action) => {
      const id = action.payload;
      state.removingHolidays.push(id);
      // Mark as removing but don't actually remove from UI yet
      const holiday = state.holidays.find((h) => h._id === id);
      if (holiday) {
        holiday.isRemoving = true;
      }
    },

    // Rollback optimistic updates on error
    rollbackOptimisticUpdates: (state) => {
      // Remove optimistic holidays
      state.holidays = state.holidays.filter(
        (holiday) => !holiday.isOptimistic
      );

      // Restore original data for updated holidays
      state.holidays.forEach((holiday) => {
        if (holiday.original) {
          Object.assign(holiday, holiday.original);
          delete holiday.original;
        }
        delete holiday.isRemoving;
      });

      state.pendingHolidays = [];
      state.removingHolidays = [];
    },

    // Sort holidays by date
    sortHolidays: (state, action) => {
      const sortOrder = action.payload || "asc"; // asc or desc
      state.holidays.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    },

    // Toggle holiday active state
    toggleHolidayActive: (state, action) => {
      const holidayId = action.payload;
      const holiday = state.holidays.find((h) => h._id === holidayId);
      if (holiday) {
        holiday.isActive = !holiday.isActive;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch holidays
      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload || [];
        // Clear optimistic updates on successful fetch
        state.pendingHolidays = [];
        state.removingHolidays = [];
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add holiday
      .addCase(addHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addHoliday.fulfilled, (state, action) => {
        state.loading = false;
        // Remove optimistic holiday and add real one
        state.holidays = state.holidays.filter(
          (holiday) => !holiday.isOptimistic
        );
        state.holidays.push(action.payload);
        state.pendingHolidays = [];
      })
      .addCase(addHoliday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Remove failed optimistic holiday
        state.holidays = state.holidays.filter(
          (holiday) => !holiday.isOptimistic
        );
        state.pendingHolidays = [];
      })

      // Update holiday
      .addCase(updateHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateHoliday.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.holidays.findIndex(
          (holiday) => holiday._id === action.payload._id
        );
        if (index >= 0) {
          state.holidays[index] = action.payload;
          delete state.holidays[index].original; // Clear rollback data
        }
      })
      .addCase(updateHoliday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Rollback optimistic update
        state.holidays.forEach((holiday) => {
          if (holiday.original) {
            Object.assign(holiday, holiday.original);
            delete holiday.original;
          }
        });
      })

      // Delete holiday
      .addCase(deleteHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.loading = false;
        const holidayId = action.payload;
        state.holidays = state.holidays.filter(
          (holiday) => holiday._id !== holidayId
        );
        state.removingHolidays = state.removingHolidays.filter(
          (id) => id !== holidayId
        );
      })
      .addCase(deleteHoliday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Clear removing state and restore holiday
        state.holidays.forEach((holiday) => {
          delete holiday.isRemoving;
        });
        state.removingHolidays = [];
      })

      // Bulk add holidays
      .addCase(bulkAddHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAddHolidays.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && Array.isArray(action.payload)) {
          state.holidays.push(...action.payload);
        }
      })
      .addCase(bulkAddHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setViewMode,
  setSelectedHoliday,
  clearSelectedHoliday,
  optimisticAddHoliday,
  optimisticUpdateHoliday,
  optimisticDeleteHoliday,
  rollbackOptimisticUpdates,
  sortHolidays,
  toggleHolidayActive,
} = holidaySlice.actions;

export default holidaySlice.reducer;
