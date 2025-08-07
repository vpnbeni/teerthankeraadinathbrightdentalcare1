import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import availabilityService from "../services/availability";
import { showToast } from "../shared/utils/toast";

// This initialState declaration is removed to avoid duplication

// Async thunks
export const fetchAvailability = createAsyncThunk(
  "availability/fetchAvailability",
  async (params, { rejectWithValue }) => {
    try {
      const response = await availabilityService.getAvailability(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch availability"
      );
    }
  }
);

export const createAvailability = createAsyncThunk(
  "availability/createAvailability",
  async (availabilityData, { rejectWithValue }) => {
    try {
      const response = await availabilityService.createAvailability(
        availabilityData
      );
      showToast.success("Availability slot created successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create availability slot";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateAvailability = createAsyncThunk(
  "availability/updateAvailability",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await availabilityService.updateAvailability(id, data);
      showToast.success("Availability slot updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update availability slot";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteAvailability = createAsyncThunk(
  "availability/deleteAvailability",
  async (id, { rejectWithValue }) => {
    try {
      await availabilityService.deleteAvailability(id);
      showToast.success("Availability slot deleted successfully");
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete availability slot";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchAvailabilitySettings = createAsyncThunk(
  "availability/fetchAvailabilitySettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await availabilityService.getAvailabilitySettings();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch availability settings"
      );
    }
  }
);

export const updateAvailabilitySettings = createAsyncThunk(
  "availability/updateAvailabilitySettings",
  async (settingsData, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await availabilityService.updateAvailabilitySettings(
        settingsData
      );

      // Sync holidays with existing availability records
      try {
        await availabilityService.syncHolidays();
        console.log("Holidays synced successfully");
      } catch (syncError) {
        console.error("Failed to sync holidays:", syncError);
        // Don't fail the entire operation if sync fails
      }

      showToast.success("Availability settings updated successfully");

      // Refresh availability data to reflect holiday changes
      const state = getState();
      const currentFilters = state.availability.filters;
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      dispatch(
        fetchAvailability({
          startDate:
            currentFilters.startDate || startDate.toISOString().split("T")[0],
          endDate:
            currentFilters.endDate || endDate.toISOString().split("T")[0],
          showHolidays: currentFilters.showHolidays,
          showUnavailable: currentFilters.showUnavailable,
        })
      );

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to update availability settings";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const syncHolidays = createAsyncThunk(
  "availability/syncHolidays",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await availabilityService.syncHolidays();
      showToast.success("Holidays synced successfully");

      // Refresh availability data after sync
      const state = getState();
      const currentFilters = state.availability.filters;
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

      dispatch(
        fetchAvailability({
          startDate:
            currentFilters.startDate || startDate.toISOString().split("T")[0],
          endDate:
            currentFilters.endDate || endDate.toISOString().split("T")[0],
          showHolidays: currentFilters.showHolidays,
          showUnavailable: currentFilters.showUnavailable,
        })
      );

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to sync holidays";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const bulkUpdateAvailability = createAsyncThunk(
  "availability/bulkUpdateAvailability",
  async (updates, { rejectWithValue }) => {
    try {
      const response = await availabilityService.bulkUpdateAvailability(
        updates
      );
      showToast.success("Availability updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update availability";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Template Management Actions
export const fetchAvailabilityTemplate = createAsyncThunk(
  "availability/fetchAvailabilityTemplate",
  async (_, { rejectWithValue }) => {
    try {
      const response = await availabilityService.getAvailabilityTemplate();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch availability template"
      );
    }
  }
);

export const updateAvailabilityTemplate = createAsyncThunk(
  "availability/updateAvailabilityTemplate",
  async (templateData, { rejectWithValue }) => {
    try {
      const response = await availabilityService.updateAvailabilityTemplate(
        templateData
      );
      showToast.success("Template updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update template";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const addTemplateSlot = createAsyncThunk(
  "availability/addTemplateSlot",
  async (slotData, { rejectWithValue }) => {
    try {
      const response = await availabilityService.addTemplateSlot(slotData);
      showToast.success("Custom slot added successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to add custom slot";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeTemplateSlot = createAsyncThunk(
  "availability/removeTemplateSlot",
  async (slotId, { rejectWithValue }) => {
    try {
      const response = await availabilityService.removeTemplateSlot(slotId);
      showToast.success("Custom slot removed successfully");
      return slotId;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to remove custom slot";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Holiday Management Actions
export const fetchHolidays = createAsyncThunk(
  "availability/fetchHolidays",
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
  "availability/addHoliday",
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
  "availability/updateHoliday",
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
  "availability/deleteHoliday",
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
  "availability/bulkAddHolidays",
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

// Custom Date Management Actions
export const fetchCustomDates = createAsyncThunk(
  "availability/fetchCustomDates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await availabilityService.getCustomDates();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch custom dates"
      );
    }
  }
);

export const addCustomDate = createAsyncThunk(
  "availability/addCustomDate",
  async (customDateData, { rejectWithValue }) => {
    try {
      const response = await availabilityService.addCustomDate(customDateData);
      showToast.success("Custom date added successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to add custom date";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateCustomDate = createAsyncThunk(
  "availability/updateCustomDate",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await availabilityService.updateCustomDate(id, data);
      showToast.success("Custom date updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update custom date";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteCustomDate = createAsyncThunk(
  "availability/deleteCustomDate",
  async (id, { rejectWithValue }) => {
    try {
      await availabilityService.deleteCustomDate(id);
      showToast.success("Custom date deleted successfully");
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete custom date";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const bulkAddCustomDates = createAsyncThunk(
  "availability/bulkAddCustomDates",
  async (customDatesData, { rejectWithValue }) => {
    try {
      const response = await availabilityService.bulkAddCustomDates(
        customDatesData
      );
      showToast.success(
        `${customDatesData.customDates.length} custom dates added successfully`
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to bulk add custom dates";
      showToast.error(message);
      return rejectWithValue(message);
    }
  }
);

// Initial state
const initialState = {
  availability: [],
  settings: {
    defaultStartTime: "08:00",
    defaultEndTime: "18:00",
    sundayStartTime: "09:00",
    sundayEndTime: "17:00",
    slotDuration: 60,
    breakTimes: [{ startTime: "12:00", endTime: "13:00", name: "Lunch Break" }],
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    holidays: [],
    customDaySettings: {},
    defaultSlots: [],
  },
  template: {
    _id: null,
    defaultSlots: [],
    workingDays: [1, 2, 3, 4, 5, 6],
    slotDuration: 60,
    updatedBy: null,
    updatedAt: null,
  },
  holidays: [],
  customDates: [],
  loading: false,
  settingsLoading: false,
  templateLoading: false,
  holidaysLoading: false,
  customDatesLoading: false,
  error: null,
  settingsError: null,
  templateError: null,
  holidaysError: null,
  customDatesError: null,
  selectedDate: new Date().toISOString().split("T")[0],
  viewMode: "calendar", // calendar or list
  filters: {
    startDate: "",
    endDate: "",
    showHolidays: true,
    showUnavailable: true,
  },
};

// Slice
const availabilitySlice = createSlice({
  name: "availability",
  initialState,
  reducers: {
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearError: (state) => {
      state.error = null;
      state.settingsError = null;
    },
    // Optimistic updates for better UX
    optimisticUpdateSlot: (state, action) => {
      const { date, timeSlots } = action.payload;
      const existingIndex = state.availability.findIndex(
        (item) => item.date === date
      );
      if (existingIndex >= 0) {
        state.availability[existingIndex].timeSlots = timeSlots;
      } else {
        state.availability.push({ date, timeSlots, isHoliday: false });
      }
    },
    optimisticDeleteSlot: (state, action) => {
      const id = action.payload;
      state.availability = state.availability.filter((item) => item._id !== id);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch availability
      .addCase(fetchAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = action.payload.data || [];
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create availability
      .addCase(createAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability.push(action.payload.data);
      })
      .addCase(createAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update availability
      .addCase(updateAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAvailability.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.availability.findIndex(
          (item) => item._id === action.payload.data._id
        );
        if (index >= 0) {
          state.availability[index] = action.payload.data;
        }
      })
      .addCase(updateAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete availability
      .addCase(deleteAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = state.availability.filter(
          (item) => item._id !== action.payload
        );
      })
      .addCase(deleteAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch settings
      .addCase(fetchAvailabilitySettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(fetchAvailabilitySettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = { ...state.settings, ...action.payload.data };
      })
      .addCase(fetchAvailabilitySettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload;
      })

      // Update settings
      .addCase(updateAvailabilitySettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(updateAvailabilitySettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = { ...state.settings, ...action.payload.data };
      })
      .addCase(updateAvailabilitySettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload;
      })

      // Bulk update
      .addCase(bulkUpdateAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateAvailability.fulfilled, (state, action) => {
        state.loading = false;
        // Update multiple items in the availability array
        action.payload.data.forEach((updatedItem) => {
          const index = state.availability.findIndex(
            (item) => item._id === updatedItem._id
          );
          if (index >= 0) {
            state.availability[index] = updatedItem;
          } else {
            state.availability.push(updatedItem);
          }
        });
      })
      .addCase(bulkUpdateAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sync holidays
      .addCase(syncHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncHolidays.fulfilled, (state, action) => {
        state.loading = false;
        // The availability data will be refreshed by the fetchAvailability call
      })
      .addCase(syncHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Template management
      .addCase(fetchAvailabilityTemplate.pending, (state) => {
        state.templateLoading = true;
        state.templateError = null;
      })
      .addCase(fetchAvailabilityTemplate.fulfilled, (state, action) => {
        state.templateLoading = false;
        state.template = action.payload.data || state.template;
        // Also update settings.defaultSlots for backward compatibility
        state.settings.defaultSlots = action.payload.data?.defaultSlots || [];
      })
      .addCase(fetchAvailabilityTemplate.rejected, (state, action) => {
        state.templateLoading = false;
        state.templateError = action.payload;
      })

      .addCase(updateAvailabilityTemplate.pending, (state) => {
        state.templateLoading = true;
        state.templateError = null;
      })
      .addCase(updateAvailabilityTemplate.fulfilled, (state, action) => {
        state.templateLoading = false;
        state.template = action.payload.data;
        // Also update settings.defaultSlots for backward compatibility
        state.settings.defaultSlots = action.payload.data?.defaultSlots || [];
      })
      .addCase(updateAvailabilityTemplate.rejected, (state, action) => {
        state.templateLoading = false;
        state.templateError = action.payload;
      })

      .addCase(addTemplateSlot.pending, (state) => {
        state.templateLoading = true;
        state.templateError = null;
      })
      .addCase(addTemplateSlot.fulfilled, (state, action) => {
        state.templateLoading = false;
        if (action.payload.data) {
          state.template.defaultSlots.push(action.payload.data);
          state.settings.defaultSlots.push(action.payload.data);
        }
      })
      .addCase(addTemplateSlot.rejected, (state, action) => {
        state.templateLoading = false;
        state.templateError = action.payload;
      })

      .addCase(removeTemplateSlot.pending, (state) => {
        state.templateLoading = true;
        state.templateError = null;
      })
      .addCase(removeTemplateSlot.fulfilled, (state, action) => {
        state.templateLoading = false;
        const slotId = action.payload;
        state.template.defaultSlots = state.template.defaultSlots.filter(
          (slot) => slot.id !== slotId
        );
        state.settings.defaultSlots = state.settings.defaultSlots.filter(
          (slot) => slot.id !== slotId
        );
      })
      .addCase(removeTemplateSlot.rejected, (state, action) => {
        state.templateLoading = false;
        state.templateError = action.payload;
      })

      // Holiday management
      .addCase(fetchHolidays.pending, (state) => {
        state.holidaysLoading = true;
        state.holidaysError = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.holidaysLoading = false;
        state.holidays = action.payload.data || [];
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.holidaysLoading = false;
        state.holidaysError = action.payload;
      })

      .addCase(addHoliday.pending, (state) => {
        state.holidaysLoading = true;
        state.holidaysError = null;
      })
      .addCase(addHoliday.fulfilled, (state, action) => {
        state.holidaysLoading = false;
        state.holidays.push(action.payload.data);
      })
      .addCase(addHoliday.rejected, (state, action) => {
        state.holidaysLoading = false;
        state.holidaysError = action.payload;
      })

      .addCase(updateHoliday.pending, (state) => {
        state.holidaysLoading = true;
        state.holidaysError = null;
      })
      .addCase(updateHoliday.fulfilled, (state, action) => {
        state.holidaysLoading = false;
        const index = state.holidays.findIndex(
          (holiday) => holiday._id === action.payload.data._id
        );
        if (index >= 0) {
          state.holidays[index] = action.payload.data;
        }
      })
      .addCase(updateHoliday.rejected, (state, action) => {
        state.holidaysLoading = false;
        state.holidaysError = action.payload;
      })

      .addCase(deleteHoliday.pending, (state) => {
        state.holidaysLoading = true;
        state.holidaysError = null;
      })
      .addCase(deleteHoliday.fulfilled, (state, action) => {
        state.holidaysLoading = false;
        state.holidays = state.holidays.filter(
          (holiday) => holiday._id !== action.payload
        );
      })
      .addCase(deleteHoliday.rejected, (state, action) => {
        state.holidaysLoading = false;
        state.holidaysError = action.payload;
      })

      .addCase(bulkAddHolidays.pending, (state) => {
        state.holidaysLoading = true;
        state.holidaysError = null;
      })
      .addCase(bulkAddHolidays.fulfilled, (state, action) => {
        state.holidaysLoading = false;
        if (action.payload.data && Array.isArray(action.payload.data)) {
          state.holidays.push(...action.payload.data);
        }
      })
      .addCase(bulkAddHolidays.rejected, (state, action) => {
        state.holidaysLoading = false;
        state.holidaysError = action.payload;
      })

      // Custom date management
      .addCase(fetchCustomDates.pending, (state) => {
        state.customDatesLoading = true;
        state.customDatesError = null;
      })
      .addCase(fetchCustomDates.fulfilled, (state, action) => {
        state.customDatesLoading = false;
        state.customDates = action.payload.data || [];
      })
      .addCase(fetchCustomDates.rejected, (state, action) => {
        state.customDatesLoading = false;
        state.customDatesError = action.payload;
      })

      .addCase(addCustomDate.pending, (state) => {
        state.customDatesLoading = true;
        state.customDatesError = null;
      })
      .addCase(addCustomDate.fulfilled, (state, action) => {
        state.customDatesLoading = false;
        state.customDates.push(action.payload.data);
      })
      .addCase(addCustomDate.rejected, (state, action) => {
        state.customDatesLoading = false;
        state.customDatesError = action.payload;
      })

      .addCase(updateCustomDate.pending, (state) => {
        state.customDatesLoading = true;
        state.customDatesError = null;
      })
      .addCase(updateCustomDate.fulfilled, (state, action) => {
        state.customDatesLoading = false;
        const index = state.customDates.findIndex(
          (customDate) => customDate._id === action.payload.data._id
        );
        if (index >= 0) {
          state.customDates[index] = action.payload.data;
        }
      })
      .addCase(updateCustomDate.rejected, (state, action) => {
        state.customDatesLoading = false;
        state.customDatesError = action.payload;
      })

      .addCase(deleteCustomDate.pending, (state) => {
        state.customDatesLoading = true;
        state.customDatesError = null;
      })
      .addCase(deleteCustomDate.fulfilled, (state, action) => {
        state.customDatesLoading = false;
        state.customDates = state.customDates.filter(
          (customDate) => customDate._id !== action.payload
        );
      })
      .addCase(deleteCustomDate.rejected, (state, action) => {
        state.customDatesLoading = false;
        state.customDatesError = action.payload;
      })

      .addCase(bulkAddCustomDates.pending, (state) => {
        state.customDatesLoading = true;
        state.customDatesError = null;
      })
      .addCase(bulkAddCustomDates.fulfilled, (state, action) => {
        state.customDatesLoading = false;
        if (action.payload.data && Array.isArray(action.payload.data)) {
          state.customDates.push(...action.payload.data);
        }
      })
      .addCase(bulkAddCustomDates.rejected, (state, action) => {
        state.customDatesLoading = false;
        state.customDatesError = action.payload;
      });
  },
});

export const {
  setSelectedDate,
  setViewMode,
  setFilters,
  clearFilters,
  clearError,
  optimisticUpdateSlot,
  optimisticDeleteSlot,
} = availabilitySlice.actions;

export default availabilitySlice.reducer;
