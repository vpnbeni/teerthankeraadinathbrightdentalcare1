import mongoose from "mongoose";

const defaultTimeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    validate: {
      validator: function (v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "Start time must be in HH:MM format",
    },
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    validate: {
      validator: function (v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "End time must be in HH:MM format",
    },
  },
  maxBookings: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
    validate: {
      validator: function (v) {
        return Number.isInteger(v) && v >= 1 && v <= 10;
      },
      message: "Max bookings must be an integer between 1 and 10",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Validate time slot duration and order
defaultTimeSlotSchema.pre("validate", function () {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(":").map(Number);
    const [endHour, endMin] = this.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new Error("End time must be after start time");
    }

    // Validate minimum slot duration (15 minutes)
    if (endMinutes - startMinutes < 15) {
      throw new Error("Time slot must be at least 15 minutes long");
    }

    // Validate maximum slot duration (4 hours)
    if (endMinutes - startMinutes > 240) {
      throw new Error("Time slot cannot exceed 4 hours");
    }
  }
});

const breakTimeSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    validate: {
      validator: function (v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "Start time must be in HH:MM format",
    },
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    validate: {
      validator: function (v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: "End time must be in HH:MM format",
    },
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Validate break time duration
breakTimeSchema.pre("validate", function () {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(":").map(Number);
    const [endHour, endMin] = this.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new Error("Break end time must be after start time");
    }

    // Validate minimum break duration (15 minutes)
    if (endMinutes - startMinutes < 15) {
      throw new Error("Break time must be at least 15 minutes long");
    }
  }
});

const holidaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const availabilitySettingsSchema = new mongoose.Schema(
  {
    // There should only be one settings document
    _id: {
      type: String,
      default: "availability_settings",
    },

    // Default working days (0 = Sunday, 1 = Monday, etc.)
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      validate: [
        {
          validator: function (days) {
            return Array.isArray(days) && days.length > 0 && days.length <= 7;
          },
          message: "Must have at least 1 and at most 7 working days",
        },
        {
          validator: function (days) {
            return days.every(
              (day) => Number.isInteger(day) && day >= 0 && day <= 6
            );
          },
          message:
            "Working days must be integers between 0 (Sunday) and 6 (Saturday)",
        },
        {
          validator: function (days) {
            return new Set(days).size === days.length;
          },
          message: "Working days cannot contain duplicates",
        },
      ],
    },

    // Default time slots for working days
    defaultTimeSlots: {
      type: [defaultTimeSlotSchema],
      validate: {
        validator: function (slots) {
          // Check for overlapping slots
          for (let i = 0; i < slots.length; i++) {
            for (let j = i + 1; j < slots.length; j++) {
              if (this.timeSlotsOverlap(slots[i], slots[j])) {
                return false;
              }
            }
          }
          return true;
        },
        message: "Default time slots cannot overlap",
      },
    },

    // Default hours for Monday to Saturday
    defaultStartTime: {
      type: String,
      default: "08:00",
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Default start time must be in HH:MM format",
      },
    },

    defaultEndTime: {
      type: String,
      default: "18:00",
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Default end time must be in HH:MM format",
      },
    },

    // Sunday hours
    sundayStartTime: {
      type: String,
      default: "09:00",
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Sunday start time must be in HH:MM format",
      },
    },

    sundayEndTime: {
      type: String,
      default: "17:00",
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Sunday end time must be in HH:MM format",
      },
    },

    // Slot duration in minutes
    slotDuration: {
      type: Number,
      default: 60,
      min: 15,
      max: 240,
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v >= 15 && v <= 240;
        },
        message: "Slot duration must be an integer between 15 and 240 minutes",
      },
    },

    // Custom day settings
    customDaySettings: {
      type: Map,
      of: {
        startTime: String,
        endTime: String,
        isCustom: Boolean,
      },
      default: {},
    },

    // Break times
    breakTimes: {
      type: [breakTimeSchema],
      validate: {
        validator: function (breaks) {
          // Check for overlapping break times
          for (let i = 0; i < breaks.length; i++) {
            for (let j = i + 1; j < breaks.length; j++) {
              if (this.timeSlotsOverlap(breaks[i], breaks[j])) {
                return false;
              }
            }
          }
          return true;
        },
        message: "Break times cannot overlap",
      },
    },

    // Advance booking settings
    advanceBookingDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
      validate: {
        validator: function (v) {
          return Number.isInteger(v);
        },
        message: "Advance booking days must be an integer",
      },
    },

    // Minimum notice for booking (in hours)
    minimumNoticeHours: {
      type: Number,
      default: 2,
      min: 0,
      max: 168, // 1 week
      validate: {
        validator: function (v) {
          return Number.isInteger(v);
        },
        message: "Minimum notice hours must be an integer",
      },
    },

    // Holiday settings
    holidays: [holidaySchema],

    // Auto-generation settings
    autoGenerateAvailability: {
      type: Boolean,
      default: true,
    },

    // How many days ahead to auto-generate
    autoGenerateDaysAhead: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
      validate: {
        validator: function (v) {
          return Number.isInteger(v);
        },
        message: "Auto-generate days ahead must be an integer",
      },
    },

    // Business rules
    businessRules: {
      maxBookingsPerDay: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
      },
      maxBookingsPerSlot: {
        type: Number,
        default: 1,
        min: 1,
        max: 10,
      },
      allowSameDayBooking: {
        type: Boolean,
        default: true,
      },
      allowWeekendBooking: {
        type: Boolean,
        default: true,
      },
      requireApprovalForBooking: {
        type: Boolean,
        default: false,
      },
    },

    // Notification settings
    notificationSettings: {
      notifyOnNewBooking: {
        type: Boolean,
        default: true,
      },
      notifyOnCancellation: {
        type: Boolean,
        default: true,
      },
      adminEmail: {
        type: String,
        default: "support@teerthankeraadinathbrightdentalcare.in",
        validate: {
          validator: function (v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: "Admin email must be a valid email address",
        },
      },
    },

    // Audit fields
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation middleware
availabilitySettingsSchema.pre("save", function (next) {
  try {
    // Validate that advance booking days is not less than auto-generate days
    if (this.advanceBookingDays < this.autoGenerateDaysAhead) {
      throw new Error(
        "Advance booking days cannot be less than auto-generate days ahead"
      );
    }

    // Increment version for optimistic locking
    if (!this.isNew) {
      this.version += 1;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if two time slots overlap
availabilitySettingsSchema.methods.timeSlotsOverlap = function (slot1, slot2) {
  const slot1Start = this.timeToMinutes(slot1.startTime);
  const slot1End = this.timeToMinutes(slot1.endTime);
  const slot2Start = this.timeToMinutes(slot2.startTime);
  const slot2End = this.timeToMinutes(slot2.endTime);

  return slot1Start < slot2End && slot1End > slot2Start;
};

// Helper method to convert time string to minutes
availabilitySettingsSchema.methods.timeToMinutes = function (timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

// Static method to get or create settings
availabilitySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById("availability_settings").populate(
    "updatedBy",
    "name email"
  );

  if (!settings) {
    // Create default settings with full day coverage
    settings = await this.create({
      _id: "availability_settings",
      workingDays: [0, 1, 2, 3, 4, 5, 6], // Sunday to Saturday (all days)
      defaultTimeSlots: [
        // Monday to Saturday slots (8 AM - 6 PM)
        {
          startTime: "08:00",
          endTime: "09:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "09:00",
          endTime: "10:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "10:00",
          endTime: "11:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "11:00",
          endTime: "12:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "12:00",
          endTime: "13:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "13:00",
          endTime: "14:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "14:00",
          endTime: "15:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "15:00",
          endTime: "16:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "16:00",
          endTime: "17:00",
          maxBookings: 1,
          isActive: true,
        },
        {
          startTime: "17:00",
          endTime: "18:00",
          maxBookings: 1,
          isActive: true,
        },
      ],
      // Sunday slots (9 AM - 5 PM) - will be handled by custom day settings
      customDaySettings: {
        0: {
          // Sunday
          startTime: "09:00",
          endTime: "17:00",
          isCustom: true,
        },
      },
      breakTimes: [], // No default break times
      businessRules: {
        maxBookingsPerDay: 20,
        maxBookingsPerSlot: 1,
        allowSameDayBooking: true,
        allowWeekendBooking: true,
        requireApprovalForBooking: false,
      },
      notificationSettings: {
        notifyOnNewBooking: true,
        notifyOnCancellation: true,
        adminEmail: "support@teerthankeraadinathbrightdentalcare.in",
      },
    });
  }

  return settings;
};

// Method to check if a date is a working day
availabilitySettingsSchema.methods.isWorkingDay = function (date) {
  const dayOfWeek = date.getDay();
  return this.workingDays.includes(dayOfWeek);
};

// Method to check if a date is a holiday
availabilitySettingsSchema.methods.isHoliday = function (date) {
  // Simple date string comparison to avoid timezone issues
  const getDateString = (d) => new Date(d).toISOString().split("T")[0];

  // Get normalized date string for comparison
  const inputDateString = getDateString(date);

  return this.holidays.some((holiday) => {
    if (!holiday.isActive) return false;

    if (holiday.isRecurring) {
      // For recurring holidays, compare month and day only
      const inputDate = new Date(date);
      const holidayDate = new Date(holiday.date);
      return (
        holidayDate.getUTCMonth() === inputDate.getUTCMonth() &&
        holidayDate.getUTCDate() === inputDate.getUTCDate()
      );
    } else {
      // For non-recurring holidays, compare exact date strings
      const holidayDateString = getDateString(holiday.date);
      return holidayDateString === inputDateString;
    }
  });
};

// Method to get default time slots excluding break times
availabilitySettingsSchema.methods.getAvailableTimeSlots = function () {
  const availableSlots = [];

  for (const slot of this.defaultTimeSlots) {
    if (!slot.isActive) continue;

    let isConflicting = false;

    // Check if this slot conflicts with any active break time
    for (const breakTime of this.breakTimes) {
      if (!breakTime.isActive) continue;

      if (this.timeSlotsOverlap(slot, breakTime)) {
        isConflicting = true;
        break;
      }
    }

    if (!isConflicting) {
      availableSlots.push({
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxBookings: slot.maxBookings,
        isAvailable: true,
        currentBookings: 0,
      });
    }
  }

  return availableSlots;
};

// Method to get time slots for a specific day
availabilitySettingsSchema.methods.getTimeSlotsForDay = function (dayOfWeek) {
  if (dayOfWeek === 0) {
    // Sunday - use custom settings or generate slots for 9 AM - 5 PM
    const customSettings = this.customDaySettings.get("0");
    if (customSettings && customSettings.isCustom) {
      return this.generateTimeSlotsForDay(0);
    } else {
      // Fallback to Sunday hours
      return this.generateTimeSlotsForDay(0);
    }
  } else {
    // Monday to Saturday - use default time slots
    return this.getAvailableTimeSlots();
  }
};

// Method to get hours for a specific day
availabilitySettingsSchema.methods.getHoursForDay = function (dayOfWeek) {
  // Check if there are custom settings for this day
  const customSettings = this.customDaySettings.get(dayOfWeek.toString());

  if (customSettings && customSettings.isCustom) {
    return {
      startTime: customSettings.startTime,
      endTime: customSettings.endTime,
    };
  }

  // Return default hours based on day
  if (dayOfWeek === 0) {
    // Sunday
    return {
      startTime: this.sundayStartTime,
      endTime: this.sundayEndTime,
    };
  } else {
    // Monday to Saturday
    return {
      startTime: this.defaultStartTime,
      endTime: this.defaultEndTime,
    };
  }
};

// Method to generate time slots for a specific day
availabilitySettingsSchema.methods.generateTimeSlotsForDay = function (
  dayOfWeek
) {
  const hours = this.getHoursForDay(dayOfWeek);
  const slots = [];

  const startMinutes = this.timeToMinutes(hours.startTime);
  const endMinutes = this.timeToMinutes(hours.endTime);

  for (let time = startMinutes; time < endMinutes; time += this.slotDuration) {
    const endTime = Math.min(time + this.slotDuration, endMinutes);

    slots.push({
      startTime: this.minutesToTime(time),
      endTime: this.minutesToTime(endTime),
      maxBookings: 1,
      isAvailable: true,
      currentBookings: 0,
    });
  }

  return slots;
};

// Helper method to convert minutes to time string
availabilitySettingsSchema.methods.minutesToTime = function (minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

// Method to validate booking against business rules
availabilitySettingsSchema.methods.validateBooking = function (
  bookingDate,
  bookingTime,
  existingBookingsCount = 0
) {
  const errors = [];

  // Check if same-day booking is allowed
  if (!this.businessRules.allowSameDayBooking) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const booking = new Date(bookingDate);
    booking.setHours(0, 0, 0, 0);

    if (booking.getTime() === today.getTime()) {
      errors.push("Same-day booking is not allowed");
    }
  }

  // Check weekend booking
  if (!this.businessRules.allowWeekendBooking) {
    const dayOfWeek = bookingDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      errors.push("Weekend booking is not allowed");
    }
  }

  // Check minimum notice
  if (this.minimumNoticeHours > 0) {
    const now = new Date();
    const bookingDateTime = new Date(bookingDate);
    const [hours, minutes] = bookingTime.split(":").map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
    if (hoursUntilBooking < this.minimumNoticeHours) {
      errors.push(`Minimum ${this.minimumNoticeHours} hours notice required`);
    }
  }

  // Check advance booking limit
  const maxAdvanceDate = new Date();
  maxAdvanceDate.setDate(maxAdvanceDate.getDate() + this.advanceBookingDays);
  if (bookingDate > maxAdvanceDate) {
    errors.push(
      `Cannot book more than ${this.advanceBookingDays} days in advance`
    );
  }

  // Check daily booking limit
  if (existingBookingsCount >= this.businessRules.maxBookingsPerDay) {
    errors.push(
      `Maximum ${this.businessRules.maxBookingsPerDay} bookings per day exceeded`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Method to add a new holiday
availabilitySettingsSchema.methods.addHoliday = function (
  holidayData,
  updatedBy
) {
  this.holidays.push({
    ...holidayData,
    isActive: true,
  });
  this.updatedBy = updatedBy;
  return this.save();
};

// Method to remove a holiday
availabilitySettingsSchema.methods.removeHoliday = function (
  holidayId,
  updatedBy
) {
  this.holidays.id(holidayId).remove();
  this.updatedBy = updatedBy;
  return this.save();
};

// Method to add a new break time
availabilitySettingsSchema.methods.addBreakTime = function (
  breakTimeData,
  updatedBy
) {
  // Validate no overlap with existing break times
  for (const existingBreak of this.breakTimes) {
    if (
      existingBreak.isActive &&
      this.timeSlotsOverlap(breakTimeData, existingBreak)
    ) {
      throw new Error(
        `Break time overlaps with existing break: ${existingBreak.name}`
      );
    }
  }

  this.breakTimes.push({
    ...breakTimeData,
    isActive: true,
  });
  this.updatedBy = updatedBy;
  return this.save();
};

// Method to remove a break time
availabilitySettingsSchema.methods.removeBreakTime = function (
  breakTimeId,
  updatedBy
) {
  this.breakTimes.id(breakTimeId).remove();
  this.updatedBy = updatedBy;
  return this.save();
};

// Method to update business rules
availabilitySettingsSchema.methods.updateBusinessRules = function (
  newRules,
  updatedBy
) {
  this.businessRules = { ...this.businessRules, ...newRules };
  this.updatedBy = updatedBy;
  return this.save();
};

// Method to update notification settings
availabilitySettingsSchema.methods.updateNotificationSettings = function (
  newSettings,
  updatedBy
) {
  this.notificationSettings = { ...this.notificationSettings, ...newSettings };
  this.updatedBy = updatedBy;
  return this.save();
};

// Static method to validate settings before save
availabilitySettingsSchema.statics.validateSettings = function (settingsData) {
  const errors = [];

  // Validate working days
  if (!settingsData.workingDays || settingsData.workingDays.length === 0) {
    errors.push("At least one working day must be specified");
  }

  // Validate default time slots
  if (
    !settingsData.defaultTimeSlots ||
    settingsData.defaultTimeSlots.length === 0
  ) {
    errors.push("At least one default time slot must be specified");
  }

  // Validate advance booking settings
  if (settingsData.advanceBookingDays < settingsData.autoGenerateDaysAhead) {
    errors.push(
      "Advance booking days cannot be less than auto-generate days ahead"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const AvailabilitySettings = mongoose.model(
  "AvailabilitySettings",
  availabilitySettingsSchema
);

export default AvailabilitySettings;
