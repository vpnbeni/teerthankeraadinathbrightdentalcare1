import AvailabilityTemplate from "../models/AvailabilityTemplate.js";
import Holiday from "../models/Holiday.js";
import CustomDateAvailability from "../models/CustomDateAvailability.js";
import Appointment from "../models/Appointment.js";
import { normalizeToStartOfDay, getDateString } from "../utils/dateUtils.js";

/**
 * AvailabilityCalculator Service
 *
 * This service calculates available slots for any given date by:
 * 1. Checking if the date is a holiday (returns empty slots)
 * 2. Checking if the date has custom availability (returns custom slots)
 * 3. Checking if the date is a working day (returns template slots)
 * 4. Filtering out already booked slots
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.4, 6.5
 */
class AvailabilityCalculator {
  constructor() {
    this.templateCache = null;
    this.templateCacheExpiry = null;
    this.holidayCache = new Map();
    this.customDateCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Calculate available slots for a specific date
   * @param {Date|string} date - The date to calculate availability for
   * @param {Object} options - Additional options
   * @returns {Object} - Availability result with slots and metadata
   */
  async getAvailableSlotsForDate(date, options = {}) {
    try {
      const normalizedDate = normalizeToStartOfDay(date);
      const dateString = getDateString(normalizedDate);

      // Step 1: Check if date is a holiday
      const holidayResult = await this._checkHoliday(normalizedDate);
      if (holidayResult.isHoliday) {
        return {
          date: dateString,
          slots: [],
          isHoliday: true,
          holidayName: holidayResult.holiday.name,
          holidayDescription: holidayResult.holiday.description,
          source: "holiday",
          totalSlots: 0,
          availableSlots: 0,
        };
      }

      // Step 2: Check for custom date override
      const customDateResult = await this._checkCustomDate(normalizedDate);
      if (customDateResult.hasCustomDate) {
        const slots = await this._processSlots(
          customDateResult.customDate.getActiveSlots(),
          normalizedDate,
          options
        );

        return {
          date: dateString,
          slots,
          isCustom: true,
          customReason: customDateResult.customDate.reason,
          customNotes: customDateResult.customDate.notes,
          source: "custom",
          totalSlots: customDateResult.customDate.getActiveSlots().length,
          availableSlots: slots.filter((slot) => slot.isAvailable).length,
        };
      }

      // Step 3: Check if working day and get template slots
      const templateResult = await this._checkTemplate(normalizedDate);
      if (!templateResult.isWorkingDay) {
        return {
          date: dateString,
          slots: [],
          isWorkingDay: false,
          source: "template",
          totalSlots: 0,
          availableSlots: 0,
        };
      }

      const slots = await this._processSlots(
        templateResult.template.getActiveSlots(),
        normalizedDate,
        options
      );

      return {
        date: dateString,
        slots,
        isDefault: true,
        source: "template",
        totalSlots: templateResult.template.getActiveSlots().length,
        availableSlots: slots.filter((slot) => slot.isAvailable).length,
      };
    } catch (error) {
      throw new Error(
        `Failed to calculate availability for ${getDateString(date)}: ${
          error.message
        }`
      );
    }
  } /**

   * Calculate available dates in a date range
   * @param {Date|string} startDate - Start of date range
   * @param {Date|string} endDate - End of date range
   * @param {Object} options - Additional options
   * @returns {Array} - Array of available dates with metadata
   */
  async getAvailableDatesInRange(startDate, endDate, options = {}) {
    try {
      const start = normalizeToStartOfDay(startDate);
      const end = normalizeToStartOfDay(endDate);

      if (start > end) {
        throw new Error("Start date must be before or equal to end date");
      }

      const availableDates = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateAvailability = await this.getAvailableSlotsForDate(
          currentDate,
          options
        );

        // Include date if it has available slots or if includeUnavailable option is set
        if (dateAvailability.availableSlots > 0 || options.includeUnavailable) {
          availableDates.push(dateAvailability);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availableDates;
    } catch (error) {
      throw new Error(
        `Failed to calculate available dates in range: ${error.message}`
      );
    }
  }

  /**
   * Validate if a specific slot booking is possible
   * @param {Date|string} date - The appointment date
   * @param {string} timeSlot - Time slot in "HH:MM-HH:MM" format
   * @param {Object} options - Additional validation options
   * @returns {Object} - Validation result
   */
  async validateSlotBooking(date, timeSlot, options = {}) {
    try {
      const normalizedDate = normalizeToStartOfDay(date);
      const dateString = getDateString(normalizedDate);

      // Get availability for the date
      const availability = await this.getAvailableSlotsForDate(
        normalizedDate,
        options
      );

      // Check if date has any availability
      if (availability.slots.length === 0) {
        return {
          isValid: false,
          reason: availability.isHoliday
            ? `Date is a holiday: ${availability.holidayName}`
            : availability.isWorkingDay === false
            ? "Date is not a working day"
            : "No slots available for this date",
          date: dateString,
          timeSlot,
        };
      }

      // Find the specific slot
      const slot = availability.slots.find(
        (s) => `${s.startTime}-${s.endTime}` === timeSlot
      );

      if (!slot) {
        return {
          isValid: false,
          reason: "Requested time slot does not exist",
          date: dateString,
          timeSlot,
          availableSlots: availability.slots.map(
            (s) => `${s.startTime}-${s.endTime}`
          ),
        };
      }

      if (!slot.isAvailable) {
        return {
          isValid: false,
          reason:
            slot.currentBookings >= slot.maxBookings
              ? "Time slot is fully booked"
              : "Time slot is not available",
          date: dateString,
          timeSlot,
          currentBookings: slot.currentBookings,
          maxBookings: slot.maxBookings,
        };
      }

      // Additional business rule validations
      const businessRuleValidation = await this._validateBusinessRules(
        normalizedDate,
        timeSlot,
        options
      );
      if (!businessRuleValidation.isValid) {
        return businessRuleValidation;
      }

      return {
        isValid: true,
        date: dateString,
        timeSlot,
        slot: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxBookings: slot.maxBookings,
          currentBookings: slot.currentBookings,
          remainingCapacity: slot.maxBookings - slot.currentBookings,
        },
      };
    } catch (error) {
      throw new Error(`Failed to validate slot booking: ${error.message}`);
    }
  } /**

   * Get availability statistics for a date range
   * @param {Date|string} startDate - Start of date range
   * @param {Date|string} endDate - End of date range
   * @returns {Object} - Availability statistics
   */
  async getAvailabilityStats(startDate, endDate) {
    try {
      const availableDates = await this.getAvailableDatesInRange(
        startDate,
        endDate,
        { includeUnavailable: true }
      );

      const stats = {
        totalDates: availableDates.length,
        availableDates: 0,
        holidayDates: 0,
        customDates: 0,
        templateDates: 0,
        nonWorkingDays: 0,
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
        utilizationRate: 0,
      };

      for (const dateAvailability of availableDates) {
        if (dateAvailability.isHoliday) {
          stats.holidayDates++;
        } else if (dateAvailability.isCustom) {
          stats.customDates++;
          stats.availableDates++;
        } else if (dateAvailability.isDefault) {
          stats.templateDates++;
          stats.availableDates++;
        } else if (dateAvailability.isWorkingDay === false) {
          stats.nonWorkingDays++;
        }

        stats.totalSlots += dateAvailability.totalSlots;
        stats.availableSlots += dateAvailability.availableSlots;
        stats.bookedSlots +=
          dateAvailability.totalSlots - dateAvailability.availableSlots;
      }

      // Calculate utilization rate
      if (stats.totalSlots > 0) {
        stats.utilizationRate = Math.round(
          (stats.bookedSlots / stats.totalSlots) * 100
        );
      }

      return stats;
    } catch (error) {
      throw new Error(
        `Failed to calculate availability statistics: ${error.message}`
      );
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.templateCache = null;
    this.templateCacheExpiry = null;
    this.holidayCache.clear();
    this.customDateCache.clear();
  }

  // Private helper methods

  /**
   * Check if date is a holiday
   * @private
   */
  async _checkHoliday(date) {
    const dateString = getDateString(date);

    // Check cache first
    if (this.holidayCache.has(dateString)) {
      const cached = this.holidayCache.get(dateString);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const holiday = await Holiday.getHolidayForDate(date);
    const result = {
      isHoliday: !!holiday,
      holiday: holiday,
    };

    // Cache the result
    this.holidayCache.set(dateString, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Check if date has custom availability
   * @private
   */
  async _checkCustomDate(date) {
    const dateString = getDateString(date);

    // Check cache first
    if (this.customDateCache.has(dateString)) {
      const cached = this.customDateCache.get(dateString);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const customDate = await CustomDateAvailability.findByDate(date);
    const result = {
      hasCustomDate: !!customDate,
      customDate: customDate,
    };

    // Cache the result
    this.customDateCache.set(dateString, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } /**

   * Check template and working day status
   * @private
   */
  async _checkTemplate(date) {
    // Get cached template or fetch from database
    const template = await this._getTemplate();

    const isWorkingDay = template.isWorkingDay(date);

    return {
      isWorkingDay,
      template,
    };
  }

  /**
   * Get availability template with caching
   * @private
   */
  async _getTemplate() {
    // Check if cache is valid
    if (
      this.templateCache &&
      this.templateCacheExpiry &&
      Date.now() < this.templateCacheExpiry
    ) {
      return this.templateCache;
    }

    // Fetch template from database
    const template = await AvailabilityTemplate.getTemplate();

    // Cache the template
    this.templateCache = template;
    this.templateCacheExpiry = Date.now() + this.cacheTimeout;

    return template;
  }

  /**
   * Process slots by adding booking information and availability status
   * @private
   */
  async _processSlots(slots, date, options = {}) {
    try {
      // Get existing bookings for the date
      const existingBookings = await this._getExistingBookings(date);

      const processedSlots = [];

      for (const slot of slots) {
        const timeSlotString = `${slot.startTime}-${slot.endTime}`;

        // Count current bookings for this slot
        const currentBookings = existingBookings.filter(
          (booking) => booking.timeSlot === timeSlotString
        ).length;

        const processedSlot = {
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxBookings: slot.maxBookings,
          currentBookings,
          isAvailable: currentBookings < slot.maxBookings,
          remainingCapacity: slot.maxBookings - currentBookings,
          timeSlot: timeSlotString,
        };

        // Apply additional filters if specified
        if (options.onlyAvailable && !processedSlot.isAvailable) {
          continue;
        }

        processedSlots.push(processedSlot);
      }

      return processedSlots;
    } catch (error) {
      throw new Error(`Failed to process slots: ${error.message}`);
    }
  }

  /**
   * Get existing bookings for a date
   * @private
   */
  async _getExistingBookings(date) {
    try {
      const startOfDay = normalizeToStartOfDay(date);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const bookings = await Appointment.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ["cancelled"] }, // Exclude cancelled appointments
      }).select("timeSlot status");

      return bookings;
    } catch (error) {
      throw new Error(`Failed to get existing bookings: ${error.message}`);
    }
  }

  /**
   * Validate business rules for slot booking
   * @private
   */
  async _validateBusinessRules(date, timeSlot, options = {}) {
    try {
      const now = new Date();
      const appointmentDateTime = this._getAppointmentDateTime(date, timeSlot);

      // Rule 1: Cannot book appointments in the past
      if (appointmentDateTime <= now) {
        return {
          isValid: false,
          reason: "Cannot book appointments in the past",
          rule: "past_appointment",
        };
      }

      // Rule 2: Minimum advance notice (default 2 hours)
      const minimumNoticeHours = options.minimumNoticeHours || 2;
      const minimumNoticeTime = new Date(
        now.getTime() + minimumNoticeHours * 60 * 60 * 1000
      );

      if (appointmentDateTime < minimumNoticeTime) {
        return {
          isValid: false,
          reason: `Appointments must be booked at least ${minimumNoticeHours} hours in advance`,
          rule: "minimum_notice",
        };
      }

      // Rule 3: Maximum advance booking (default 90 days)
      const maxAdvanceDays = options.maxAdvanceDays || 90;
      const maxAdvanceDate = new Date(
        now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000
      );

      if (appointmentDateTime > maxAdvanceDate) {
        return {
          isValid: false,
          reason: `Appointments cannot be booked more than ${maxAdvanceDays} days in advance`,
          rule: "max_advance_booking",
        };
      }

      return { isValid: true };
    } catch (error) {
      throw new Error(`Failed to validate business rules: ${error.message}`);
    }
  }

  /**
   * Get appointment datetime from date and time slot
   * @private
   */
  _getAppointmentDateTime(date, timeSlot) {
    const [startTime] = timeSlot.split("-");
    const [hours, minutes] = startTime.split(":").map(Number);

    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    return appointmentDate;
  }
}

export default AvailabilityCalculator;
