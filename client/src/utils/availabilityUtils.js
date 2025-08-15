/**
 * Frontend availability utilities for template application and slot generation
 * This moves the computation-heavy logic from backend to frontend
 */

/**
 * Generate time slots from a template
 * @param {Object} template - Template object with workingHours, slotDuration, breakTimes
 * @returns {Array} Array of time slot objects
 */
export const generateTimeSlots = (template) => {
  if (!template || !template.workingHours || !template.slotDuration) {
    return [];
  }

  const slots = [];
  const workStart = template.workingHours.start.split(":").map(Number);
  const workEnd = template.workingHours.end.split(":").map(Number);

  const workStartMinutes = workStart[0] * 60 + workStart[1];
  const workEndMinutes = workEnd[0] * 60 + workEnd[1];

  // Convert break times to minutes for easier comparison
  const breakPeriods = (template.breakTimes || []).map((breakTime) => {
    const start = breakTime.start.split(":").map(Number);
    const end = breakTime.end.split(":").map(Number);
    return {
      start: start[0] * 60 + start[1],
      end: end[0] * 60 + end[1],
      reason: breakTime.reason,
    };
  });

  let currentTime = workStartMinutes;

  while (currentTime + template.slotDuration <= workEndMinutes) {
    const slotEnd = currentTime + template.slotDuration;

    // Check if this slot conflicts with any break
    const hasBreakConflict = breakPeriods.some((breakPeriod) => {
      return (
        (currentTime >= breakPeriod.start && currentTime < breakPeriod.end) ||
        (slotEnd > breakPeriod.start && slotEnd <= breakPeriod.end) ||
        (currentTime <= breakPeriod.start && slotEnd >= breakPeriod.end)
      );
    });

    if (!hasBreakConflict) {
      const startHour = Math.floor(currentTime / 60);
      const startMinute = currentTime % 60;
      const endHour = Math.floor(slotEnd / 60);
      const endMinute = slotEnd % 60;

      const timeSlot = `${startHour.toString().padStart(2, "0")}:${startMinute
        .toString()
        .padStart(2, "0")}-${endHour.toString().padStart(2, "0")}:${endMinute
        .toString()
        .padStart(2, "0")}`;

      slots.push({
        timeSlot,
        startTime: `${startHour.toString().padStart(2, "0")}:${startMinute
          .toString()
          .padStart(2, "0")}`,
        endTime: `${endHour.toString().padStart(2, "0")}:${endMinute
          .toString()
          .padStart(2, "0")}`,
        duration: template.slotDuration,
      });
    }

    currentTime += template.slotDuration;
  }

  return slots;
};

/**
 * Get template for a specific date from available templates
 * @param {Date} date - The date to get template for
 * @param {Array} templates - Array of available templates
 * @returns {Object|null} Template object or null if not found
 */
export const getTemplateForDate = (date, templates) => {
  if (!templates || templates.length === 0) {
    return null;
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  // Use local date string to align with server keys (YYYY-MM-DD)
  const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

  // First check for custom templates on this date
  const customTemplate = templates.find(template => {
    if (template.isDefault) return false;
    
    return template.applicableDates && template.applicableDates.some(applicableDate => {
      const ad = new Date(applicableDate);
      const applicableDateString = `${ad.getFullYear()}-${String(ad.getMonth() + 1).padStart(2, "0")}-${String(ad.getDate()).padStart(2, "0")}`;
      return applicableDateString === dateString;
    });
  });

  if (customTemplate) {
    return customTemplate;
  }

  // Fallback to default template
  return templates.find(template => template.isDefault) || null;
};

/**
 * Check if a date is a holiday
 * @param {Date} date - The date to check
 * @param {Array} holidays - Array of holiday objects
 * @returns {Object|null} Holiday object or null if not a holiday
 */
export const isHoliday = (date, holidays) => {
  if (!holidays || holidays.length === 0) {
    return null;
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;

  return holidays.find(holiday => holiday.date === dateString) || null;
};

/**
 * Generate availability for a specific date using template and holiday data
 * @param {Date} date - The date to generate availability for
 * @param {Array} templates - Array of available templates
 * @param {Array} holidays - Array of holiday objects
 * @param {Array} bookedSlots - Array of booked time slots for this date
 * @param {Object} options - Options for availability calculation
 * @returns {Object} Availability data for the date
 */
export const generateAvailabilityForDate = (date, templates, holidays, bookedSlots = [], options = {}) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if it's a past date
  if (targetDate < today) {
    return {
      available: false,
      reason: "Past date",
      type: "past_date",
      holiday: null,
      slots: [],
      template: null,
      totalSlots: 0,
      availableSlots: 0,
      bookedSlots: 0,
    };
  }

  // Check if it's a holiday
  const holiday = isHoliday(targetDate, holidays);
  if (holiday) {
    return {
      available: false,
      reason: holiday.reason,
      type: "holiday",
      holiday: holiday,
      slots: [],
      template: null,
      totalSlots: 0,
      availableSlots: 0,
      bookedSlots: 0,
    };
  }

  // Get template for the date
  const template = getTemplateForDate(targetDate, templates);
  if (!template) {
    return {
      available: false,
      reason: "No availability template configured",
      type: "no_template",
      holiday: null,
      slots: [],
      template: null,
      totalSlots: 0,
      availableSlots: 0,
      bookedSlots: 0,
    };
  }

  // Generate time slots from template
  const allSlots = generateTimeSlots(template);

  // Mark slots as available or booked
  const slotsWithAvailability = allSlots.map((slot) => ({
    ...slot,
    isAvailable: !bookedSlots.includes(slot.timeSlot),
    isBooked: bookedSlots.includes(slot.timeSlot),
  }));

  // Filter slots based on options
  let finalSlots = slotsWithAvailability;
  if (options.onlyAvailable) {
    finalSlots = slotsWithAvailability.filter((slot) => slot.isAvailable);
  }

  return {
    available: true,
    reason: null,
    type: "available",
    holiday: null,
    slots: finalSlots,
    template: {
      id: template.id,
      name: template.name,
      isDefault: template.isDefault,
      workingHours: template.workingHours,
      slotDuration: template.slotDuration,
      breakTimes: template.breakTimes,
    },
    totalSlots: allSlots.length,
    availableSlots: slotsWithAvailability.filter((slot) => slot.isAvailable).length,
    bookedSlots: slotsWithAvailability.filter((slot) => slot.isBooked).length,
  };
};

/**
 * Generate availability for a date range using template and holiday data
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @param {Array} templates - Array of available templates
 * @param {Array} holidays - Array of holiday objects
 * @param {Object} bookedSlotsByDate - Object mapping dates to booked slots
 * @param {Object} options - Options for availability calculation
 * @returns {Object} Availability data for each date in the range
 */
export const generateAvailabilityForDateRange = (startDate, endDate, templates, holidays, bookedSlotsByDate = {}, options = {}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateAvailability = {};

  // Iterate through each date in the range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    // Use local date key to align with server and client lookups
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    const bookedSlots = bookedSlotsByDate[dateKey] || [];

    // Skip past dates - mark them as unavailable without processing
    if (currentDate < today) {
      dateAvailability[dateKey] = {
        available: false,
        reason: "Past date",
        type: "past_date",
        holiday: null,
        slots: [],
        template: null,
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
      };
    } else {
      // Generate availability for current and future dates
      dateAvailability[dateKey] = generateAvailabilityForDate(
        currentDate,
        templates,
        holidays,
        bookedSlots,
        options
      );
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateAvailability;
};

/**
 * Get available time slots for a specific date
 * @param {Date} date - The date to get slots for
 * @param {Array} templates - Array of available templates
 * @param {Array} holidays - Array of holiday objects
 * @param {Array} bookedSlots - Array of booked time slots for this date
 * @returns {Array} Array of available time slot strings
 */
export const getAvailableTimeSlots = (date, templates, holidays, bookedSlots = []) => {
  const availability = generateAvailabilityForDate(date, templates, holidays, bookedSlots, { onlyAvailable: true });
  
  if (!availability.available) {
    return [];
  }

  return availability.slots.map(slot => slot.timeSlot);
};

/**
 * Check if a specific time slot is available
 * @param {Date} date - The date to check
 * @param {String} timeSlot - The time slot to check
 * @param {Array} templates - Array of available templates
 * @param {Array} holidays - Array of holiday objects
 * @param {Array} bookedSlots - Array of booked time slots for this date
 * @returns {Object} Availability status and details
 */
export const isTimeSlotAvailable = (date, timeSlot, templates, holidays, bookedSlots = []) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if it's a past date
  if (targetDate < today) {
    return {
      available: false,
      reason: "Cannot book appointments for past dates",
      type: "past_date",
    };
  }

  // Check if it's a holiday
  const holiday = isHoliday(targetDate, holidays);
  if (holiday) {
    return {
      available: false,
      reason: `Holiday: ${holiday.reason}`,
      type: "holiday",
    };
  }

  // Get template for the date
  const template = getTemplateForDate(targetDate, templates);
  if (!template) {
    return {
      available: false,
      reason: "No availability template configured",
      type: "no_template",
    };
  }

  // Check if the time slot is valid for this template
  const validSlots = generateTimeSlots(template);
  const isValidSlot = validSlots.some((slot) => slot.timeSlot === timeSlot);

  if (!isValidSlot) {
    return {
      available: false,
      reason: "Time slot is not available in the current schedule",
      type: "invalid_slot",
    };
  }

  // Check if slot is already booked
  if (bookedSlots.includes(timeSlot)) {
    return {
      available: false,
      reason: "Time slot is already booked",
      type: "booked",
    };
  }

  return {
    available: true,
    reason: null,
    type: "available",
    template: {
      id: template.id,
      name: template.name,
      isDefault: template.isDefault,
    },
  };
};
