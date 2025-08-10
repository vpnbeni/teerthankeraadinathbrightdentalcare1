import Settings from "../models/Settings.js";
import logger from "../utils/logger.js";

// Custom error class for settings
class SettingsError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "SettingsError";
    this.statusCode = statusCode;
  }
}

/**
 * Get all system settings
 * GET /api/admin/settings
 */
export const getSystemSettings = async (req, res, next) => {
  try {
    const { category } = req.query;

    let settings;
    if (category) {
      settings = await Settings.getByCategory(category);
    } else {
      settings = await Settings.find({}).sort({ category: 1, key: 1 });
    }

    // Transform settings into a more usable format
    const settingsMap = {};
    settings.forEach((setting) => {
      if (!settingsMap[setting.category]) {
        settingsMap[setting.category] = {};
      }

      settingsMap[setting.category][setting.key] = {
        emailTemplates: setting.emailTemplates
          ? Object.fromEntries(setting.emailTemplates)
          : undefined,
        businessRules: setting.businessRules
          ? Object.fromEntries(setting.businessRules)
          : undefined,
        timeSlotDefaults: setting.timeSlotDefaults,
        generalSettings: setting.generalSettings
          ? Object.fromEntries(setting.generalSettings)
          : undefined,
        version: setting.version,
        lastModifiedBy: setting.lastModifiedBy,
        updatedAt: setting.updatedAt,
      };
    });

    logger.info("System settings retrieved", {
      adminId: req.user.id,
      category: category || "all",
      settingsCount: settings.length,
    });

    res.json({
      success: true,
      data: {
        settings: settingsMap,
        totalCount: settings.length,
      },
    });
  } catch (error) {
    logger.error("Error retrieving system settings:", error);
    next(new SettingsError("Failed to retrieve system settings", 500));
  }
};

/**
 * Update email templates
 * PUT /api/admin/settings/email-templates
 */
export const updateEmailTemplates = async (req, res, next) => {
  try {
    const { templates } = req.body;

    if (!templates || typeof templates !== "object") {
      return next(new SettingsError("Templates object is required", 400));
    }

    // Validate each template
    const validatedTemplates = new Map();

    for (const [templateName, template] of Object.entries(templates)) {
      // Validate required fields
      if (!template.subject || !template.htmlContent || !template.textContent) {
        return next(
          new SettingsError(
            `Template '${templateName}' is missing required fields (subject, htmlContent, textContent)`,
            400
          )
        );
      }

      // Validate variables if provided
      if (template.variables && !Array.isArray(template.variables)) {
        return next(
          new SettingsError(
            `Template '${templateName}' variables must be an array`,
            400
          )
        );
      }

      validatedTemplates.set(templateName, {
        name: templateName,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: template.variables || [],
      });
    }

    // Update or create email templates setting
    const updatedSetting = await Settings.updateSetting(
      "email-templates",
      "default",
      { emailTemplates: validatedTemplates },
      req.user.id
    );

    logger.info("Email templates updated", {
      adminId: req.user.id,
      templateNames: Object.keys(templates),
      version: updatedSetting.version,
    });

    res.json({
      success: true,
      message: "Email templates updated successfully",
      data: {
        templates: Object.fromEntries(updatedSetting.emailTemplates),
        version: updatedSetting.version,
        updatedAt: updatedSetting.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error updating email templates:", error);
    next(new SettingsError("Failed to update email templates", 500));
  }
};

/**
 * Update business rules
 * PUT /api/admin/settings/business-rules
 */
export const updateBusinessRules = async (req, res, next) => {
  try {
    const { rules } = req.body;

    if (!rules || typeof rules !== "object") {
      return next(new SettingsError("Rules object is required", 400));
    }

    // Validate each rule
    const validatedRules = new Map();

    for (const [ruleName, rule] of Object.entries(rules)) {
      // Validate required fields
      if (!rule.name || rule.value === undefined || !rule.category) {
        return next(
          new SettingsError(
            `Rule '${ruleName}' is missing required fields (name, value, category)`,
            400
          )
        );
      }

      // Validate category
      const validCategories = [
        "booking",
        "cancellation",
        "payment",
        "notification",
        "general",
      ];
      if (!validCategories.includes(rule.category)) {
        return next(
          new SettingsError(
            `Rule '${ruleName}' has invalid category. Must be one of: ${validCategories.join(
              ", "
            )}`,
            400
          )
        );
      }

      validatedRules.set(ruleName, {
        name: rule.name,
        value: rule.value,
        description: rule.description || "",
        category: rule.category,
      });
    }

    // Update or create business rules setting
    const updatedSetting = await Settings.updateSetting(
      "business-rules",
      "default",
      { businessRules: validatedRules },
      req.user.id
    );

    logger.info("Business rules updated", {
      adminId: req.user.id,
      ruleNames: Object.keys(rules),
      version: updatedSetting.version,
    });

    res.json({
      success: true,
      message: "Business rules updated successfully",
      data: {
        rules: Object.fromEntries(updatedSetting.businessRules),
        version: updatedSetting.version,
        updatedAt: updatedSetting.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error updating business rules:", error);
    next(new SettingsError("Failed to update business rules", 500));
  }
};

/**
 * Update default time slots
 * PUT /api/admin/settings/time-slots
 */
export const updateTimeSlotDefaults = async (req, res, next) => {
  try {
    const { timeSlots } = req.body;

    if (!timeSlots || !Array.isArray(timeSlots)) {
      return next(new SettingsError("Time slots array is required", 400));
    }

    // Validate each time slot
    const validatedTimeSlots = [];

    for (const [index, slot] of timeSlots.entries()) {
      // Validate required fields
      if (slot.dayOfWeek === undefined || !slot.startTime || !slot.endTime) {
        return next(
          new SettingsError(
            `Time slot ${
              index + 1
            } is missing required fields (dayOfWeek, startTime, endTime)`,
            400
          )
        );
      }

      // Validate day of week
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        return next(
          new SettingsError(
            `Time slot ${
              index + 1
            } has invalid dayOfWeek. Must be 0-6 (Sunday-Saturday)`,
            400
          )
        );
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return next(
          new SettingsError(
            `Time slot ${index + 1} has invalid time format. Use HH:MM format`,
            400
          )
        );
      }

      // Validate time logic
      const startTime = new Date(`1970-01-01T${slot.startTime}:00`);
      const endTime = new Date(`1970-01-01T${slot.endTime}:00`);

      if (startTime >= endTime) {
        return next(
          new SettingsError(
            `Time slot ${index + 1}: Start time must be before end time`,
            400
          )
        );
      }

      // Validate break times if provided
      const validatedBreakTimes = [];
      if (slot.breakTimes && Array.isArray(slot.breakTimes)) {
        for (const [breakIndex, breakTime] of slot.breakTimes.entries()) {
          if (!breakTime.startTime || !breakTime.endTime) {
            return next(
              new SettingsError(
                `Time slot ${index + 1}, break ${
                  breakIndex + 1
                } is missing required fields (startTime, endTime)`,
                400
              )
            );
          }

          if (
            !timeRegex.test(breakTime.startTime) ||
            !timeRegex.test(breakTime.endTime)
          ) {
            return next(
              new SettingsError(
                `Time slot ${index + 1}, break ${
                  breakIndex + 1
                } has invalid time format. Use HH:MM format`,
                400
              )
            );
          }

          const breakStart = new Date(`1970-01-01T${breakTime.startTime}:00`);
          const breakEnd = new Date(`1970-01-01T${breakTime.endTime}:00`);

          if (breakStart >= breakEnd) {
            return next(
              new SettingsError(
                `Time slot ${index + 1}, break ${
                  breakIndex + 1
                }: Break start time must be before break end time`,
                400
              )
            );
          }

          if (breakStart < startTime || breakEnd > endTime) {
            return next(
              new SettingsError(
                `Time slot ${index + 1}, break ${
                  breakIndex + 1
                }: Break time must be within slot time range`,
                400
              )
            );
          }

          validatedBreakTimes.push({
            startTime: breakTime.startTime,
            endTime: breakTime.endTime,
            description: breakTime.description || "",
          });
        }
      }

      validatedTimeSlots.push({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        breakTimes: validatedBreakTimes,
        slotDuration: slot.slotDuration || 60,
        maxBookingsPerSlot: slot.maxBookingsPerSlot || 1,
        isActive: slot.isActive !== undefined ? slot.isActive : true,
      });
    }

    // Update or create time slot defaults setting
    const updatedSetting = await Settings.updateSetting(
      "time-slots",
      "default",
      { timeSlotDefaults: validatedTimeSlots },
      req.user.id
    );

    logger.info("Time slot defaults updated", {
      adminId: req.user.id,
      slotsCount: validatedTimeSlots.length,
      version: updatedSetting.version,
    });

    res.json({
      success: true,
      message: "Time slot defaults updated successfully",
      data: {
        timeSlots: updatedSetting.timeSlotDefaults,
        version: updatedSetting.version,
        updatedAt: updatedSetting.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error updating time slot defaults:", error);
    next(new SettingsError("Failed to update time slot defaults", 500));
  }
};

/**
 * Get specific setting category
 * GET /api/admin/settings/:category
 */
export const getSettingsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const validCategories = [
      "email-templates",
      "business-rules",
      "time-slots",
      "general",
    ];
    if (!validCategories.includes(category)) {
      return next(
        new SettingsError(
          `Invalid category. Must be one of: ${validCategories.join(", ")}`,
          400
        )
      );
    }

    const settings = await Settings.getByCategory(category);

    // Transform settings for the specific category
    const categoryData = {};
    settings.forEach((setting) => {
      categoryData[setting.key] = {
        emailTemplates: setting.emailTemplates
          ? Object.fromEntries(setting.emailTemplates)
          : undefined,
        businessRules: setting.businessRules
          ? Object.fromEntries(setting.businessRules)
          : undefined,
        timeSlotDefaults: setting.timeSlotDefaults,
        generalSettings: setting.generalSettings
          ? Object.fromEntries(setting.generalSettings)
          : undefined,
        version: setting.version,
        lastModifiedBy: setting.lastModifiedBy,
        updatedAt: setting.updatedAt,
      };
    });

    logger.info("Settings retrieved by category", {
      adminId: req.user.id,
      category,
      settingsCount: settings.length,
    });

    res.json({
      success: true,
      data: {
        category,
        settings: categoryData,
        totalCount: settings.length,
      },
    });
  } catch (error) {
    logger.error("Error retrieving settings by category:", error);
    next(new SettingsError("Failed to retrieve settings", 500));
  }
};

/**
 * Reset settings to default values
 * POST /api/admin/settings/reset
 */
export const resetSettingsToDefault = async (req, res, next) => {
  try {
    const { category, confirm } = req.body;

    if (!confirm) {
      return next(
        new SettingsError("Confirmation required to reset settings", 400)
      );
    }

    const validCategories = [
      "email-templates",
      "business-rules",
      "time-slots",
      "general",
    ];
    if (category && !validCategories.includes(category)) {
      return next(
        new SettingsError(
          `Invalid category. Must be one of: ${validCategories.join(", ")}`,
          400
        )
      );
    }

    // Define default settings
    const defaultSettings = {
      "email-templates": {
        "booking-confirmation": {
          name: "booking-confirmation",
          subject: "Appointment Scheduled - {{clinicName}}",
          htmlContent: `
            <h2>Appointment Scheduled</h2>
            <p>Dear {{patientName}},</p>
            <p>Your appointment has been scheduled and is pending approval:</p>
            <ul>
              <li><strong>Date:</strong> {{appointmentDate}}</li>
              <li><strong>Time:</strong> {{appointmentTime}}</li>
              <li><strong>Type:</strong> {{appointmentType}}</li>
              <li><strong>Status:</strong> Pending Approval</li>
            </ul>
            <p>You will receive a confirmation email once our team approves your appointment.</p>
            <p>Best regards,<br>{{clinicName}}</p>
          `,
          textContent: `
            Appointment Scheduled
            
            Dear {{patientName}},
            
            Your appointment has been scheduled and is pending approval:
            Date: {{appointmentDate}}
            Time: {{appointmentTime}}
            Type: {{appointmentType}}
            
            Please arrive 15 minutes early for your appointment.
            
            Best regards,
            {{clinicName}}
          `,
          variables: [
            {
              name: "patientName",
              description: "Patient full name",
              required: true,
            },
            {
              name: "appointmentDate",
              description: "Appointment date",
              required: true,
            },
            {
              name: "appointmentTime",
              description: "Appointment time",
              required: true,
            },
            {
              name: "appointmentType",
              description: "Type of appointment",
              required: true,
            },
            { name: "clinicName", description: "Clinic name", required: true },
          ],
        },
        "appointment-cancellation": {
          name: "appointment-cancellation",
          subject: "Appointment Cancelled - {{clinicName}}",
          htmlContent: `
            <h2>Appointment Cancelled</h2>
            <p>Dear {{patientName}},</p>
            <p>We regret to inform you that your appointment scheduled for {{appointmentDate}} at {{appointmentTime}} has been cancelled.</p>
            <p><strong>Reason:</strong> {{cancellationReason}}</p>
            <p>Please contact us to reschedule your appointment.</p>
            <p>Best regards,<br>{{clinicName}}</p>
          `,
          textContent: `
            Appointment Cancelled
            
            Dear {{patientName}},
            
            We regret to inform you that your appointment scheduled for {{appointmentDate}} at {{appointmentTime}} has been cancelled.
            
            Reason: {{cancellationReason}}
            
            Please contact us to reschedule your appointment.
            
            Best regards,
            {{clinicName}}
          `,
          variables: [
            {
              name: "patientName",
              description: "Patient full name",
              required: true,
            },
            {
              name: "appointmentDate",
              description: "Appointment date",
              required: true,
            },
            {
              name: "appointmentTime",
              description: "Appointment time",
              required: true,
            },
            {
              name: "cancellationReason",
              description: "Reason for cancellation",
              required: true,
            },
            { name: "clinicName", description: "Clinic name", required: true },
          ],
        },
        "appointment-confirmation": {
          name: "appointment-confirmation",
          subject: "Appointment Confirmed - {{clinicName}}",
          htmlContent: `
            <h2>Appointment Confirmed!</h2>
            <p>Dear {{patientName}},</p>
            <p>Great news! Your appointment with <strong>{{clinicName}}</strong> has been confirmed by our team.</p>
            <ul>
              <li><strong>Date:</strong> {{appointmentDate}}</li>
              <li><strong>Time:</strong> {{appointmentTime}}</li>
              <li><strong>Type:</strong> {{appointmentType}}</li>
              <li><strong>Status:</strong> Confirmed</li>
            </ul>
            <p>Your appointment is now confirmed and secured. Please arrive 10-15 minutes early for check-in.</p>
            <p>Best regards,<br>{{clinicName}}</p>
          `,
          textContent: `
            Appointment Confirmed!
            
            Dear {{patientName}},
            
            Great news! Your appointment with {{clinicName}} has been confirmed by our team.
            
            Date: {{appointmentDate}}
            Time: {{appointmentTime}}
            Type: {{appointmentType}}
            Status: Confirmed
            
            Your appointment is now confirmed and secured. Please arrive 10-15 minutes early for check-in.
            
            Best regards,
            {{clinicName}}
          `,
          variables: [
            {
              name: "patientName",
              description: "Patient full name",
              required: true,
            },
            {
              name: "appointmentDate",
              description: "Appointment date",
              required: true,
            },
            {
              name: "appointmentTime",
              description: "Appointment time",
              required: true,
            },
            {
              name: "appointmentType",
              description: "Type of appointment",
              required: true,
            },
            { name: "clinicName", description: "Clinic name", required: true },
          ],
        },
      },
      "business-rules": {
        "advance-booking-days": {
          name: "Advance Booking Days",
          value: 30,
          description: "Maximum days in advance patients can book appointments",
          category: "booking",
        },
        "cancellation-hours": {
          name: "Cancellation Hours",
          value: 24,
          description:
            "Minimum hours before appointment for patient cancellation",
          category: "cancellation",
        },
        "max-appointments-per-day": {
          name: "Max Appointments Per Day",
          value: 20,
          description:
            "Maximum number of appointments that can be booked per day",
          category: "booking",
        },
        "session-expiry-days": {
          name: "Session Expiry Days",
          value: 365,
          description: "Number of days after which unused sessions expire",
          category: "general",
        },
      },
      "time-slots": [
        {
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "17:00",
          breakTimes: [
            {
              startTime: "13:00",
              endTime: "14:00",
              description: "Lunch break",
            },
          ],
          slotDuration: 60,
          maxBookingsPerSlot: 1,
          isActive: true,
        },
        {
          dayOfWeek: 2, // Tuesday
          startTime: "09:00",
          endTime: "17:00",
          breakTimes: [
            {
              startTime: "13:00",
              endTime: "14:00",
              description: "Lunch break",
            },
          ],
          slotDuration: 60,
          maxBookingsPerSlot: 1,
          isActive: true,
        },
        {
          dayOfWeek: 3, // Wednesday
          startTime: "09:00",
          endTime: "17:00",
          breakTimes: [
            {
              startTime: "13:00",
              endTime: "14:00",
              description: "Lunch break",
            },
          ],
          slotDuration: 60,
          maxBookingsPerSlot: 1,
          isActive: true,
        },
        {
          dayOfWeek: 4, // Thursday
          startTime: "09:00",
          endTime: "17:00",
          breakTimes: [
            {
              startTime: "13:00",
              endTime: "14:00",
              description: "Lunch break",
            },
          ],
          slotDuration: 60,
          maxBookingsPerSlot: 1,
          isActive: true,
        },
        {
          dayOfWeek: 5, // Friday
          startTime: "09:00",
          endTime: "17:00",
          breakTimes: [
            {
              startTime: "13:00",
              endTime: "14:00",
              description: "Lunch break",
            },
          ],
          slotDuration: 60,
          maxBookingsPerSlot: 1,
          isActive: true,
        },
        {
          dayOfWeek: 6, // Saturday
          startTime: "09:00",
          endTime: "13:00",
          breakTimes: [],
          slotDuration: 60,
          maxBookingsPerSlot: 1,
          isActive: true,
        },
      ],
    };

    let resetCategories = category ? [category] : validCategories;
    const resetResults = [];

    for (const cat of resetCategories) {
      if (defaultSettings[cat]) {
        let settingData = {};

        if (cat === "email-templates") {
          settingData.emailTemplates = new Map(
            Object.entries(defaultSettings[cat])
          );
        } else if (cat === "business-rules") {
          settingData.businessRules = new Map(
            Object.entries(defaultSettings[cat])
          );
        } else if (cat === "time-slots") {
          settingData.timeSlotDefaults = defaultSettings[cat];
        }

        const updatedSetting = await Settings.updateSetting(
          cat,
          "default",
          settingData,
          req.user.id
        );

        resetResults.push({
          category: cat,
          version: updatedSetting.version,
          updatedAt: updatedSetting.updatedAt,
        });
      }
    }

    logger.info("Settings reset to default", {
      adminId: req.user.id,
      categories: resetCategories,
      resetCount: resetResults.length,
    });

    res.json({
      success: true,
      message: `Settings reset to default values for ${resetCategories.join(
        ", "
      )}`,
      data: {
        resetResults,
      },
    });
  } catch (error) {
    logger.error("Error resetting settings to default:", error);
    next(new SettingsError("Failed to reset settings", 500));
  }
};
