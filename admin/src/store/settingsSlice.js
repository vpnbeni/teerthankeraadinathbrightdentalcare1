import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import settingsService from "../services/settings";
import toast from "react-hot-toast";

// Async thunks
export const fetchSystemSettings = createAsyncThunk(
  "settings/fetchSystemSettings",
  async (category = null, { rejectWithValue }) => {
    try {
      const response = await settingsService.getSystemSettings(category);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch settings";
      return rejectWithValue(message);
    }
  }
);

export const fetchSettingsByCategory = createAsyncThunk(
  "settings/fetchSettingsByCategory",
  async (category, { rejectWithValue }) => {
    try {
      const response = await settingsService.getSettingsByCategory(category);
      return { category, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch settings";
      return rejectWithValue(message);
    }
  }
);

export const updateEmailTemplates = createAsyncThunk(
  "settings/updateEmailTemplates",
  async (templates, { rejectWithValue }) => {
    try {
      const response = await settingsService.updateEmailTemplates(templates);
      toast.success("Email templates updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update email templates";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateBusinessRules = createAsyncThunk(
  "settings/updateBusinessRules",
  async (rules, { rejectWithValue }) => {
    try {
      const response = await settingsService.updateBusinessRules(rules);
      toast.success("Business rules updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update business rules";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateTimeSlotDefaults = createAsyncThunk(
  "settings/updateTimeSlotDefaults",
  async (timeSlots, { rejectWithValue }) => {
    try {
      const response = await settingsService.updateTimeSlotDefaults(timeSlots);
      toast.success("Time slot defaults updated successfully");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update time slot defaults";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const resetSettingsToDefault = createAsyncThunk(
  "settings/resetSettingsToDefault",
  async ({ category = null, confirm = true }, { rejectWithValue }) => {
    try {
      const response = await settingsService.resetSettingsToDefault(
        category,
        confirm
      );
      toast.success("Settings reset to default values");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to reset settings";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  // Settings data
  settings: {},
  emailTemplates: {},
  businessRules: {},
  timeSlotDefaults: [],

  // UI state
  loading: false,
  saving: false,
  activeTab: "email-templates",

  // Form state
  editMode: {
    emailTemplates: false,
    businessRules: false,
    timeSlotDefaults: false,
  },

  // Validation
  validationErrors: {
    emailTemplates: {},
    businessRules: {},
    timeSlotDefaults: [],
  },

  // Error handling
  error: null,
  lastUpdated: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    // UI actions
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    setEditMode: (state, action) => {
      const { category, enabled } = action.payload;
      state.editMode[category] = enabled;
    },

    // Form actions
    updateEmailTemplateForm: (state, action) => {
      const { templateName, field, value } = action.payload;
      if (!state.emailTemplates[templateName]) {
        state.emailTemplates[templateName] = {
          name: templateName,
          subject: "",
          htmlContent: "",
          textContent: "",
          variables: [],
        };
      }
      state.emailTemplates[templateName][field] = value;
    },

    addEmailTemplate: (state, action) => {
      const templateName = action.payload;
      state.emailTemplates[templateName] = {
        name: templateName,
        subject: "",
        htmlContent: "",
        textContent: "",
        variables: [],
      };
    },

    removeEmailTemplate: (state, action) => {
      const templateName = action.payload;
      delete state.emailTemplates[templateName];
    },

    updateBusinessRuleForm: (state, action) => {
      const { ruleName, field, value } = action.payload;
      if (!state.businessRules[ruleName]) {
        state.businessRules[ruleName] = {
          name: "",
          value: "",
          description: "",
          category: "general",
        };
      }
      state.businessRules[ruleName][field] = value;
    },

    addBusinessRule: (state, action) => {
      const ruleName = action.payload;
      state.businessRules[ruleName] = {
        name: "",
        value: "",
        description: "",
        category: "general",
      };
    },

    removeBusinessRule: (state, action) => {
      const ruleName = action.payload;
      delete state.businessRules[ruleName];
    },

    updateTimeSlotForm: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.timeSlotDefaults[index]) {
        state.timeSlotDefaults[index][field] = value;
      }
    },

    addTimeSlot: (state) => {
      state.timeSlotDefaults.push({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        breakTimes: [],
        slotDuration: 60,
        maxBookingsPerSlot: 1,
        isActive: true,
      });
    },

    removeTimeSlot: (state, action) => {
      const index = action.payload;
      state.timeSlotDefaults.splice(index, 1);
    },

    addBreakTime: (state, action) => {
      const { slotIndex } = action.payload;
      if (state.timeSlotDefaults[slotIndex]) {
        if (!state.timeSlotDefaults[slotIndex].breakTimes) {
          state.timeSlotDefaults[slotIndex].breakTimes = [];
        }
        state.timeSlotDefaults[slotIndex].breakTimes.push({
          startTime: "13:00",
          endTime: "14:00",
          description: "",
        });
      }
    },

    removeBreakTime: (state, action) => {
      const { slotIndex, breakIndex } = action.payload;
      if (state.timeSlotDefaults[slotIndex]?.breakTimes) {
        state.timeSlotDefaults[slotIndex].breakTimes.splice(breakIndex, 1);
      }
    },

    updateBreakTime: (state, action) => {
      const { slotIndex, breakIndex, field, value } = action.payload;
      if (state.timeSlotDefaults[slotIndex]?.breakTimes?.[breakIndex]) {
        state.timeSlotDefaults[slotIndex].breakTimes[breakIndex][field] = value;
      }
    },

    // Validation actions
    setValidationErrors: (state, action) => {
      const { category, errors } = action.payload;
      state.validationErrors[category] = errors;
    },

    clearValidationErrors: (state, action) => {
      const category = action.payload;
      if (category) {
        state.validationErrors[category] =
          category === "timeSlotDefaults" ? [] : {};
      } else {
        state.validationErrors = {
          emailTemplates: {},
          businessRules: {},
          timeSlotDefaults: [],
        };
      }
    },

    // Reset actions
    resetForm: (state, action) => {
      const category = action.payload;
      if (category === "emailTemplates") {
        state.emailTemplates = {};
      } else if (category === "businessRules") {
        state.businessRules = {};
      } else if (category === "timeSlotDefaults") {
        state.timeSlotDefaults = [];
      }
      state.editMode[category] = false;
      state.validationErrors[category] =
        category === "timeSlotDefaults" ? [] : {};
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch system settings
      .addCase(fetchSystemSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSystemSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload.settings || {};

        // Extract specific categories
        if (state.settings["email-templates"]?.default?.emailTemplates) {
          state.emailTemplates =
            state.settings["email-templates"].default.emailTemplates;
        }
        if (state.settings["business-rules"]?.default?.businessRules) {
          state.businessRules =
            state.settings["business-rules"].default.businessRules;
        }
        if (state.settings["time-slots"]?.default?.timeSlotDefaults) {
          state.timeSlotDefaults =
            state.settings["time-slots"].default.timeSlotDefaults;
        }

        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSystemSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch settings by category
      .addCase(fetchSettingsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettingsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        const { category, data } = action.payload;

        if (!state.settings[category]) {
          state.settings[category] = {};
        }
        state.settings[category] = data.settings;

        // Update specific category data
        if (
          category === "email-templates" &&
          data.settings.default?.emailTemplates
        ) {
          state.emailTemplates = data.settings.default.emailTemplates;
        } else if (
          category === "business-rules" &&
          data.settings.default?.businessRules
        ) {
          state.businessRules = data.settings.default.businessRules;
        } else if (
          category === "time-slots" &&
          data.settings.default?.timeSlotDefaults
        ) {
          state.timeSlotDefaults = data.settings.default.timeSlotDefaults;
        }

        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchSettingsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update email templates
      .addCase(updateEmailTemplates.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateEmailTemplates.fulfilled, (state, action) => {
        state.saving = false;
        state.emailTemplates = action.payload.templates;
        state.editMode.emailTemplates = false;
        state.validationErrors.emailTemplates = {};
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateEmailTemplates.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Update business rules
      .addCase(updateBusinessRules.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateBusinessRules.fulfilled, (state, action) => {
        state.saving = false;
        state.businessRules = action.payload.rules;
        state.editMode.businessRules = false;
        state.validationErrors.businessRules = {};
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateBusinessRules.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Update time slot defaults
      .addCase(updateTimeSlotDefaults.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateTimeSlotDefaults.fulfilled, (state, action) => {
        state.saving = false;
        state.timeSlotDefaults = action.payload.timeSlots;
        state.editMode.timeSlotDefaults = false;
        state.validationErrors.timeSlotDefaults = [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateTimeSlotDefaults.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Reset settings to default
      .addCase(resetSettingsToDefault.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(resetSettingsToDefault.fulfilled, (state, action) => {
        state.saving = false;
        // Refresh settings after reset
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(resetSettingsToDefault.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setEditMode,
  updateEmailTemplateForm,
  addEmailTemplate,
  removeEmailTemplate,
  updateBusinessRuleForm,
  addBusinessRule,
  removeBusinessRule,
  updateTimeSlotForm,
  addTimeSlot,
  removeTimeSlot,
  addBreakTime,
  removeBreakTime,
  updateBreakTime,
  setValidationErrors,
  clearValidationErrors,
  resetForm,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
