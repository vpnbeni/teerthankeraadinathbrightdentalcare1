import AvailabilityService from "../services/availabilityService.js";
import AvailabilityTemplate from "../models/AvailabilityTemplate.js";
import Holiday from "../models/Holiday.js";

const availabilityService = new AvailabilityService();

// Template Management Controllers

/**
 * Get all availability templates
 */
export const getTemplates = async (req, res) => {
  try {
    const { isDefault, isActive } = req.query;
    const filters = {};

    if (isDefault !== undefined) {
      filters.isDefault = isDefault === "true";
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }

    const templates = await availabilityService.getTemplates(filters);

    res.status(200).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("Error getting templates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get availability templates",
    });
  }
};

/**
 * Get a specific template by ID
 */
export const getTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await AvailabilityTemplate.findById(templateId).populate(
      "createdBy",
      "name email"
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error getting template:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get availability template",
    });
  }
};

/**
 * Create a new availability template
 */
export const createTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    const userId = req.user.id;

    // Validate required fields
    const { templateName, workingHours, slotDuration } = templateData;

    if (!templateName || !workingHours || !slotDuration) {
      return res.status(400).json({
        success: false,
        message: "Template name, working hours, and slot duration are required",
      });
    }

    const template = await availabilityService.createTemplate(
      templateData,
      userId
    );

    res.status(201).json({
      success: true,
      message: "Availability template created successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create availability template",
    });
  }
};

/**
 * Update an availability template
 */
export const updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;

    const template = await availabilityService.updateTemplate(
      templateId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Availability template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update availability template",
    });
  }
};

/**
 * Delete an availability template
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    await availabilityService.deleteTemplate(templateId);

    res.status(200).json({
      success: true,
      message: "Availability template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete availability template",
    });
  }
};

/**
 * Apply template to specific dates
 */
export const applyTemplateToDate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { dates } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dates array is required",
      });
    }

    const template = await availabilityService.applyTemplateToDate(
      templateId,
      dates
    );

    res.status(200).json({
      success: true,
      message: "Template applied to dates successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error applying template to dates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to apply template to dates",
    });
  }
};

/**
 * Remove template from specific dates
 */
export const removeTemplateFromDates = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { dates } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Dates array is required",
      });
    }

    const template = await availabilityService.removeTemplateFromDates(
      templateId,
      dates
    );

    res.status(200).json({
      success: true,
      message: "Template removed from dates successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error removing template from dates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove template from dates",
    });
  }
};

// Holiday Management Controllers

/**
 * Get all holidays
 */
export const getHolidays = async (req, res) => {
  try {
    const { type, isActive, startDate, endDate } = req.query;
    let holidays;

    if (startDate && endDate) {
      holidays = await Holiday.getHolidaysInRange(startDate, endDate);
    } else if (type) {
      holidays = await Holiday.getHolidaysByType(type);
    } else {
      const filters = {};
      if (isActive !== undefined) {
        filters.isActive = isActive === "true";
      }
      holidays = await Holiday.find(filters)
        .populate("createdBy", "name email")
        .sort({ date: 1 });
    }

    res.status(200).json({
      success: true,
      data: holidays,
      count: holidays.length,
    });
  } catch (error) {
    console.error("Error getting holidays:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get holidays",
    });
  }
};

/**
 * Get a specific holiday by ID
 */
export const getHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;

    const holiday = await Holiday.findById(holidayId).populate(
      "createdBy",
      "name email"
    );

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    console.error("Error getting holiday:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get holiday",
    });
  }
};

/**
 * Create a new holiday
 */
export const createHoliday = async (req, res) => {
  try {
    const holidayData = req.body;
    const userId = req.user.id;

    // Validate required fields
    const { date, reason } = holidayData;

    if (!date || !reason) {
      return res.status(400).json({
        success: false,
        message: "Date and reason are required",
      });
    }

    // Clean up recurringPattern if isRecurring is false
    const cleanedData = { ...holidayData };
    if (!cleanedData.isRecurring) {
      delete cleanedData.recurringPattern;
    } else if (cleanedData.recurringPattern === "") {
      // If recurringPattern is empty string, remove it to trigger validation
      delete cleanedData.recurringPattern;
    }

    const holiday = new Holiday({
      ...cleanedData,
      createdBy: userId,
    });

    await holiday.save();

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday,
    });
  } catch (error) {
    console.error("Error creating holiday:", error);

    // Handle duplicate date error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A holiday already exists for this date",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create holiday",
    });
  }
};

/**
 * Update a holiday
 */
export const updateHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;
    const updateData = req.body;

    // Clean up recurringPattern if isRecurring is false
    const cleanedData = { ...updateData };
    if (!cleanedData.isRecurring) {
      cleanedData.recurringPattern = undefined;
    } else if (cleanedData.recurringPattern === "") {
      // If recurringPattern is empty string, remove it to trigger validation
      delete cleanedData.recurringPattern;
    }

    const holiday = await Holiday.findByIdAndUpdate(
      holidayId,
      { ...cleanedData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: holiday,
    });
  } catch (error) {
    console.error("Error updating holiday:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update holiday",
    });
  }
};

/**
 * Delete a holiday
 */
export const deleteHoliday = async (req, res) => {
  try {
    const { holidayId } = req.params;

    const holiday = await Holiday.findByIdAndDelete(holidayId);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete holiday",
    });
  }
};

// Availability Query Controllers

/**
 * Get availability for a specific date
 */
export const getAvailabilityForDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { onlyAvailable } = req.query;

    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD format",
      });
    }

    const options = {
      onlyAvailable: onlyAvailable === "true",
    };

    const availability = await availabilityService.getAvailabilityForDate(
      date,
      options
    );

    // Set cache headers for better performance
    const today = new Date().toISOString().split("T")[0];
    const isPastDate = date < today;

    res.set({
      "Cache-Control": isPastDate
        ? "public, max-age=86400"
        : "public, max-age=300", // Cache past dates for 24h, future dates for 5min
      ETag: `"${date}-${onlyAvailable || "false"}"`,
    });

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error getting availability for date:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get availability for date",
    });
  }
};

/**
 * Get availability for a date range
 */
export const getAvailabilityForDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { onlyAvailable } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    // Validate date format and range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD format",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before or equal to end date",
      });
    }

    // Limit the range to prevent excessive computation (max 90 days)
    const maxRangeDays = 90;
    const rangeDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (rangeDays > maxRangeDays) {
      return res.status(400).json({
        success: false,
        message: `Date range cannot exceed ${maxRangeDays} days. Current range: ${rangeDays} days`,
      });
    }

    const options = {
      onlyAvailable: onlyAvailable === "true",
    };

    const availability = await availabilityService.getAvailabilityForDateRange(
      startDate,
      endDate,
      options
    );

    // Set cache headers for better performance
    res.set({
      "Cache-Control": "public, max-age=120", // Cache for 2 minutes
      ETag: `"${startDate}-${endDate}-${onlyAvailable || "false"}"`,
    });

    res.status(200).json({
      success: true,
      data: availability,
      meta: {
        startDate,
        endDate,
        totalDays: rangeDays + 1,
        onlyAvailable: onlyAvailable === "true",
      },
    });
  } catch (error) {
    console.error("Error getting availability for date range:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get availability for date range",
    });
  }
};

/**
 * Check if a specific time slot is available
 */
export const checkTimeSlotAvailability = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const { excludeAppointmentId } = req.query;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Date and time slot are required",
      });
    }

    const availability = await availabilityService.isTimeSlotAvailable(
      date,
      timeSlot,
      excludeAppointmentId
    );

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error checking time slot availability:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check time slot availability",
    });
  }
};

/**
 * Get available dates in a range
 */
export const getAvailableDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const availableDates = await availabilityService.getAvailableDates(
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: availableDates,
      count: availableDates.length,
    });
  } catch (error) {
    console.error("Error getting available dates:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get available dates",
    });
  }
};
