import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import availabilityService from "../services/availability";
import { showToast } from "../shared/utils/toast";

// Async thunks for custom date management
export const fetchCustomDates = createAsyncThunk(
  "customDates/fetchCustomDates",
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
  "customDates/addCustomDate",
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
  "customDates/updateCustomDate",
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
  "customDates/deleteCustomDate",
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
  "customDates/bulkAddCustomDates",
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
  customDates: [],
  loading: false,
  error: null,
  // Optimistic update tracking
  pendingCustomDates: [], // Custom dates being added optimistically
  removingCustomDates: [], // Custom dates being removed optimistically
  // Filters and view options
  filters: {
    startDate: null,
    endDate: null,
    reason: null, // Filter by reason
  },
  selectedCustomDate: null,
  viewMode: "calendar", // calendar or list
  // Preview functionality
  previewDate: null,
  previewSlots: [],
  isPreviewMode: false,
};

// Slice
const customDateSlice = createSlice({
  name: "customDates",
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
        startDate: null,
        endDate: null,
        reason: null,
      };
    },

    // Set view mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    // Select custom date for editing
    setSelectedCustomDate: (state, action) => {
      state.selectedCustomDate = action.payload;
    },

    // Clear selected custom date
    clearSelectedCustomDate: (state) => {
      state.selectedCustomDate = null;
    },

    // Preview functionality
    setPreviewDate: (state, action) => {
      state.previewDate = action.payload;
    },

    setPreviewSlots: (state, action) => {
      state.previewSlots = action.payload;
    },

    togglePreviewMode: (state) => {
      state.isPreviewMode = !state.isPreviewMode;
    },

    clearPreview: (state) => {
      state.previewDate = null;
      state.previewSlots = [];
      state.isPreviewMode = false;
    },

    // Optimistic updates for better UX
    optimisticAddCustomDate: (state, action) => {
      const tempCustomDate = {
        ...action.payload,
        _id: `temp-${Date.now()}`, // Temporary ID
        isOptimistic: true,
      };
      state.customDates.push(tempCustomDate);
      state.pendingCustomDates.push(tempCustomDate._id);
    },

    optimisticUpdateCustomDate: (state, action) => {
      const { id, data } = action.payload;
      const index = state.customDates.findIndex(
        (customDate) => customDate._id === id
      );
      if (index >= 0) {
        // Store original for rollback
        state.customDates[index].original = { ...state.customDates[index] };
        state.customDates[index] = { ...state.customDates[index], ...data };
      }
    },

    optimisticDeleteCustomDate: (state, action) => {
      const id = action.payload;
      state.removingCustomDates.push(id);
      // Mark as removing but don't actually remove from UI yet
      const customDate = state.customDates.find((cd) => cd._id === id);
      if (customDate) {
        customDate.isRemoving = true;
      }
    },

    // Rollback optimistic updates on error
    rollbackOptimisticUpdates: (state) => {
      // Remove optimistic custom dates
      state.customDates = state.customDates.filter(
        (customDate) => !customDate.isOptimistic
      );

      // Restore original data for updated custom dates
      state.customDates.forEach((customDate) => {
        if (customDate.original) {
          Object.assign(customDate, customDate.original);
          delete customDate.original;
        }
        delete customDate.isRemoving;
      });

      state.pendingCustomDates = [];
      state.removingCustomDates = [];
    },

    // Sort custom dates by date
    sortCustomDates: (state, action) => {
      const sortOrder = action.payload || "asc"; // asc or desc
      state.customDates.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    },

    // Update custom date slots
    updateCustomDateSlots: (state, action) => {
      const { customDateId, slots } = action.payload;
      const customDate = state.customDates.find(
        (cd) => cd._id === customDateId
      );
      if (customDate) {
        customDate.customSlots = slots;
      }
    },

    // Toggle slot active state for a custom date
    toggleCustomDateSlotActive: (state, action) => {
      const { customDateId, slotId } = action.payload;
      const customDate = state.customDates.find(
        (cd) => cd._id === customDateId
      );
      if (customDate) {
        const slot = customDate.customSlots.find((s) => s.id === slotId);
        if (slot) {
          slot.isActive = !slot.isActive;
        }
      }
    },

    // Add slot to custom date
    addSlotToCustomDate: (state, action) => {
      const { customDateId, slot } = action.payload;
      const customDate = state.customDates.find(
        (cd) => cd._id === customDateId
      );
      if (customDate) {
        customDate.customSlots.push({
          ...slot,
          id: `slot-${Date.now()}`,
          isActive: true,
        });
      }
    },

    // Remove slot from custom date
    removeSlotFromCustomDate: (state, action) => {
      const { customDateId, slotId } = action.payload;
      const customDate = state.customDates.find(
        (cd) => cd._id === customDateId
      );
      if (customDate) {
        customDate.customSlots = customDate.customSlots.filter(
          (s) => s.id !== slotId
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch custom dates
      .addCase(fetchCustomDates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomDates.fulfilled, (state, action) => {
        state.loading = false;
        state.customDates = action.payload || [];
        // Clear optimistic updates on successful fetch
        state.pendingCustomDates = [];
        state.removingCustomDates = [];
      })
      .addCase(fetchCustomDates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add custom date
      .addCase(addCustomDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomDate.fulfilled, (state, action) => {
        state.loading = false;
        // Remove optimistic custom date and add real one
        state.customDates = state.customDates.filter(
          (customDate) => !customDate.isOptimistic
        );
        state.customDates.push(action.payload);
        state.pendingCustomDates = [];
      })
      .addCase(addCustomDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Remove failed optimistic custom date
        state.customDates = state.customDates.filter(
          (customDate) => !customDate.isOptimistic
        );
        state.pendingCustomDates = [];
      })

      // Update custom date
      .addCase(updateCustomDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustomDate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.customDates.findIndex(
          (customDate) => customDate._id === action.payload._id
        );
        if (index >= 0) {
          state.customDates[index] = action.payload;
          delete state.customDates[index].original; // Clear rollback data
        }
      })
      .addCase(updateCustomDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Rollback optimistic update
        state.customDates.forEach((customDate) => {
          if (customDate.original) {
            Object.assign(customDate, customDate.original);
            delete customDate.original;
          }
        });
      })

      // Delete custom date
      .addCase(deleteCustomDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomDate.fulfilled, (state, action) => {
        state.loading = false;
        const customDateId = action.payload;
        state.customDates = state.customDates.filter(
          (customDate) => customDate._id !== customDateId
        );
        state.removingCustomDates = state.removingCustomDates.filter(
          (id) => id !== customDateId
        );
      })
      .addCase(deleteCustomDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Clear removing state and restore custom date
        state.customDates.forEach((customDate) => {
          delete customDate.isRemoving;
        });
        state.removingCustomDates = [];
      })

      // Bulk add custom dates
      .addCase(bulkAddCustomDates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkAddCustomDates.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && Array.isArray(action.payload)) {
          state.customDates.push(...action.payload);
        }
      })
      .addCase(bulkAddCustomDates.rejected, (state, action) => {
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
  setSelectedCustomDate,
  clearSelectedCustomDate,
  setPreviewDate,
  setPreviewSlots,
  togglePreviewMode,
  clearPreview,
  optimisticAddCustomDate,
  optimisticUpdateCustomDate,
  optimisticDeleteCustomDate,
  rollbackOptimisticUpdates,
  sortCustomDates,
  updateCustomDateSlots,
  toggleCustomDateSlotActive,
  addSlotToCustomDate,
  removeSlotFromCustomDate,
} = customDateSlice.actions;

export default customDateSlice.reducer;
