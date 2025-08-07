import api from "./api";

const settingsService = {
  // Get all system settings
  getSystemSettings: async (category = null) => {
    const params = category ? { category } : {};
    const response = await api.get("/admin/settings", { params });
    return response;
  },

  // Get settings by specific category
  getSettingsByCategory: async (category) => {
    const response = await api.get(`/admin/settings/${category}`);
    return response;
  },

  // Update email templates
  updateEmailTemplates: async (templates) => {
    const response = await api.put("/admin/settings/email-templates", {
      templates,
    });
    return response;
  },

  // Update business rules
  updateBusinessRules: async (rules) => {
    const response = await api.put("/admin/settings/business-rules", {
      rules,
    });
    return response;
  },

  // Update time slot defaults
  updateTimeSlotDefaults: async (timeSlots) => {
    const response = await api.put("/admin/settings/time-slots", {
      timeSlots,
    });
    return response;
  },

  // Reset settings to default
  resetSettingsToDefault: async (category = null, confirm = true) => {
    const response = await api.post("/admin/settings/reset", {
      category,
      confirm,
    });
    return response;
  },

  // Validate email template
  validateEmailTemplate: async (templateName, templateData) => {
    try {
      // Client-side validation
      const errors = [];

      if (!templateData.subject?.trim()) {
        errors.push("Subject is required");
      }

      if (!templateData.htmlContent?.trim()) {
        errors.push("HTML content is required");
      }

      if (!templateData.textContent?.trim()) {
        errors.push("Text content is required");
      }

      // Check for required variables in content
      if (templateData.variables) {
        const requiredVars = templateData.variables.filter((v) => v.required);
        const htmlContent = templateData.htmlContent || "";
        const textContent = templateData.textContent || "";
        const subject = templateData.subject || "";

        requiredVars.forEach((variable) => {
          const varPattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, "g");
          if (
            !varPattern.test(htmlContent) &&
            !varPattern.test(textContent) &&
            !varPattern.test(subject)
          ) {
            errors.push(
              `Required variable '${variable.name}' not found in template content`
            );
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Validation failed: " + error.message],
      };
    }
  },

  // Validate business rule
  validateBusinessRule: async (ruleName, ruleData) => {
    try {
      const errors = [];

      if (!ruleData.name?.trim()) {
        errors.push("Rule name is required");
      }

      if (ruleData.value === undefined || ruleData.value === null) {
        errors.push("Rule value is required");
      }

      if (!ruleData.category?.trim()) {
        errors.push("Rule category is required");
      }

      const validCategories = [
        "booking",
        "cancellation",
        "payment",
        "notification",
        "general",
      ];
      if (ruleData.category && !validCategories.includes(ruleData.category)) {
        errors.push(
          `Invalid category. Must be one of: ${validCategories.join(", ")}`
        );
      }

      // Validate specific rule types
      if (ruleData.category === "booking") {
        if (
          ["advance-booking-days", "max-appointments-per-day"].includes(
            ruleName
          )
        ) {
          if (
            typeof ruleData.value !== "number" ||
            ruleData.value < 1 ||
            ruleData.value > 365
          ) {
            errors.push("Booking rules must be a number between 1 and 365");
          }
        }
      }

      if (ruleData.category === "cancellation") {
        if (ruleName === "cancellation-hours") {
          if (
            typeof ruleData.value !== "number" ||
            ruleData.value < 0 ||
            ruleData.value > 168
          ) {
            errors.push(
              "Cancellation hours must be a number between 0 and 168"
            );
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Validation failed: " + error.message],
      };
    }
  },

  // Validate time slot defaults
  validateTimeSlotDefaults: async (timeSlots) => {
    try {
      const errors = [];

      if (!Array.isArray(timeSlots)) {
        errors.push("Time slots must be an array");
        return { isValid: false, errors };
      }

      if (timeSlots.length === 0) {
        errors.push("At least one time slot is required");
        return { isValid: false, errors };
      }

      timeSlots.forEach((slot, index) => {
        // Validate required fields
        if (slot.dayOfWeek === undefined || slot.dayOfWeek === null) {
          errors.push(`Slot ${index + 1}: Day of week is required`);
        } else if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
          errors.push(
            `Slot ${
              index + 1
            }: Day of week must be between 0 (Sunday) and 6 (Saturday)`
          );
        }

        if (!slot.startTime) {
          errors.push(`Slot ${index + 1}: Start time is required`);
        }

        if (!slot.endTime) {
          errors.push(`Slot ${index + 1}: End time is required`);
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (slot.startTime && !timeRegex.test(slot.startTime)) {
          errors.push(
            `Slot ${index + 1}: Invalid start time format. Use HH:MM`
          );
        }

        if (slot.endTime && !timeRegex.test(slot.endTime)) {
          errors.push(`Slot ${index + 1}: Invalid end time format. Use HH:MM`);
        }

        // Validate time logic
        if (slot.startTime && slot.endTime) {
          const startTime = new Date(`1970-01-01T${slot.startTime}:00`);
          const endTime = new Date(`1970-01-01T${slot.endTime}:00`);

          if (startTime >= endTime) {
            errors.push(
              `Slot ${index + 1}: Start time must be before end time`
            );
          }
        }

        // Validate break times
        if (slot.breakTimes && Array.isArray(slot.breakTimes)) {
          slot.breakTimes.forEach((breakTime, breakIndex) => {
            if (!breakTime.startTime || !breakTime.endTime) {
              errors.push(
                `Slot ${index + 1}, Break ${
                  breakIndex + 1
                }: Start and end times are required`
              );
              return;
            }

            if (
              !timeRegex.test(breakTime.startTime) ||
              !timeRegex.test(breakTime.endTime)
            ) {
              errors.push(
                `Slot ${index + 1}, Break ${
                  breakIndex + 1
                }: Invalid time format. Use HH:MM`
              );
              return;
            }

            const breakStart = new Date(`1970-01-01T${breakTime.startTime}:00`);
            const breakEnd = new Date(`1970-01-01T${breakTime.endTime}:00`);
            const slotStart = new Date(`1970-01-01T${slot.startTime}:00`);
            const slotEnd = new Date(`1970-01-01T${slot.endTime}:00`);

            if (breakStart >= breakEnd) {
              errors.push(
                `Slot ${index + 1}, Break ${
                  breakIndex + 1
                }: Break start time must be before break end time`
              );
            }

            if (breakStart < slotStart || breakEnd > slotEnd) {
              errors.push(
                `Slot ${index + 1}, Break ${
                  breakIndex + 1
                }: Break time must be within slot time range`
              );
            }
          });
        }

        // Validate slot duration
        if (
          slot.slotDuration &&
          (slot.slotDuration < 15 || slot.slotDuration > 480)
        ) {
          errors.push(
            `Slot ${
              index + 1
            }: Slot duration must be between 15 and 480 minutes`
          );
        }

        // Validate max bookings per slot
        if (
          slot.maxBookingsPerSlot &&
          (slot.maxBookingsPerSlot < 1 || slot.maxBookingsPerSlot > 10)
        ) {
          errors.push(
            `Slot ${index + 1}: Max bookings per slot must be between 1 and 10`
          );
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ["Validation failed: " + error.message],
      };
    }
  },
};

export default settingsService;
