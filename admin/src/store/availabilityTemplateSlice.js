import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import availabilityService from "../services/availability";
import { showToast } from "../shared/utils/toast";

// Async thunks for template management
export const fetchAvailabilityTemplate = createAsyncThunk(
  "availabilityTemplate/fetchTemplate",
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
  "availabilityTemplate/updateTemplate",
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
  "availabilityTemplate/addSlot",
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
  "availabilityTemplate/removeSlot",
  async (slotId, { rejectWithValue }) => {
    try {
      await availabilityService.removeTemplateSlot(slotId);
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

// Initial state
const initialState = {
  template: {
    _id: null,
    defaultSlots: [],
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    slotDuration: 60,
    updatedBy: null,
    updatedAt: null,
  },
  loading: false,
  error: null,
  // Optimistic update tracking
  pendingSlots: [], // Slots being added optimistically
  removingSlots: [], // Slots being removed optimistically
};

// Slice
const availabilityTemplateSlice = createSlice({
  name: "availabilityTemplate",
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
    },

    // Optimistic updates for better UX
    optimisticAddSlot: (state, action) => {
      const tempSlot = {
        ...action.payload,
        id: `temp-${Date.now()}`, // Temporary ID
        isOptimistic: true,
      };
      state.template.defaultSlots.push(tempSlot);
      state.pendingSlots.push(tempSlot.id);
    },

    optimisticRemoveSlot: (state, action) => {
      const slotId = action.payload;
      state.removingSlots.push(slotId);
      // Don't actually remove from UI until confirmed
    },

    optimisticUpdateTemplate: (state, action) => {
      // Store previous state for rollback if needed
      state.previousTemplate = { ...state.template };
      state.template = { ...state.template, ...action.payload };
    },

    // Rollback optimistic updates on error
    rollbackOptimisticUpdates: (state) => {
      if (state.previousTemplate) {
        state.template = state.previousTemplate;
        state.previousTemplate = null;
      }
      state.pendingSlots = [];
      state.removingSlots = [];
    },

    // Update template slots (for real-time updates)
    updateTemplateSlots: (state, action) => {
      state.template.defaultSlots = action.payload;
    },

    // Toggle slot active state
    toggleSlotActive: (state, action) => {
      const slotId = action.payload;
      const slot = state.template.defaultSlots.find((s) => s.id === slotId);
      if (slot) {
        slot.isActive = !slot.isActive;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch template
      .addCase(fetchAvailabilityTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailabilityTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.template = action.payload || state.template;
        // Clear optimistic updates on successful fetch
        state.pendingSlots = [];
        state.removingSlots = [];
      })
      .addCase(fetchAvailabilityTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update template
      .addCase(updateAvailabilityTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAvailabilityTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.template = action.payload;
        state.previousTemplate = null; // Clear rollback data
      })
      .addCase(updateAvailabilityTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Rollback optimistic updates
        if (state.previousTemplate) {
          state.template = state.previousTemplate;
          state.previousTemplate = null;
        }
      })

      // Add slot
      .addCase(addTemplateSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTemplateSlot.fulfilled, (state, action) => {
        state.loading = false;
        // Remove optimistic slot and add real one
        const tempSlots = state.template.defaultSlots.filter(
          (slot) => !slot.isOptimistic
        );
        state.template.defaultSlots = [...tempSlots, action.payload];
        state.pendingSlots = [];
      })
      .addCase(addTemplateSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Remove failed optimistic slot
        state.template.defaultSlots = state.template.defaultSlots.filter(
          (slot) => !slot.isOptimistic
        );
        state.pendingSlots = [];
      })

      // Remove slot
      .addCase(removeTemplateSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeTemplateSlot.fulfilled, (state, action) => {
        state.loading = false;
        const slotId = action.payload;
        state.template.defaultSlots = state.template.defaultSlots.filter(
          (slot) => slot.id !== slotId
        );
        state.removingSlots = state.removingSlots.filter((id) => id !== slotId);
      })
      .addCase(removeTemplateSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Clear removing state on error
        state.removingSlots = [];
      });
  },
});

export const {
  clearError,
  optimisticAddSlot,
  optimisticRemoveSlot,
  optimisticUpdateTemplate,
  rollbackOptimisticUpdates,
  updateTemplateSlots,
  toggleSlotActive,
} = availabilityTemplateSlice.actions;

export default availabilityTemplateSlice.reducer;
