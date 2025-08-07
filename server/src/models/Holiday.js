import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    // Holiday date
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          // Ensure date is a valid date
          return v instanceof Date && !isNaN(v);
        },
        message: "Holiday date must be a valid date",
      },
    },

    // Holiday name/title
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      validate: {
        validator: function (v) {
          return v && v.trim().length > 0;
        },
        message: "Holiday name is required and cannot be empty",
      },
    },

    // Optional description
    description: {
      type: String,
      maxlength: 500,
      trim: true,
      default: "",
    },

    // Whether this holiday recurs annually
    isRecurring: {
      type: Boolean,
      default: false,
    },

    // Whether this holiday is currently active
    isActive: {
      type: Boolean,
      default: true,
    },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Version for optimistic locking
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
holidaySchema.index({ date: 1, isActive: 1 }); // Primary query index
holidaySchema.index({ isRecurring: 1, isActive: 1 }); // Recurring holidays
holidaySchema.index({ createdBy: 1 }); // Admin-specific queries
holidaySchema.index({ name: "text", description: "text" }); // Text search

// Compound index to prevent duplicate holidays on same date
holidaySchema.index({ date: 1, name: 1 }, { unique: true });

// Virtual for formatted date
holidaySchema.virtual("formattedDate").get(function () {
  return this.date.toISOString().split("T")[0];
});

// Virtual for month-day string (for recurring holidays)
holidaySchema.virtual("monthDay").get(function () {
  const month = (this.date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = this.date.getUTCDate().toString().padStart(2, "0");
  return `${month}-${day}`;
});

// Method to check if this holiday applies to a given date
holidaySchema.methods.appliesToDate = function (date) {
  if (!this.isActive) return false;

  const inputDate = new Date(date);
  const holidayDate = new Date(this.date);

  if (this.isRecurring) {
    // For recurring holidays, compare month and day only
    return (
      holidayDate.getUTCMonth() === inputDate.getUTCMonth() &&
      holidayDate.getUTCDate() === inputDate.getUTCDate()
    );
  } else {
    // For non-recurring holidays, compare exact dates
    const inputDateString = inputDate.toISOString().split("T")[0];
    const holidayDateString = holidayDate.toISOString().split("T")[0];
    return inputDateString === holidayDateString;
  }
};

// Method to get next occurrence of this holiday
holidaySchema.methods.getNextOccurrence = function (fromDate = new Date()) {
  if (!this.isRecurring) {
    // For non-recurring holidays, return the holiday date if it's in the future
    return this.date > fromDate ? this.date : null;
  }

  // For recurring holidays, find the next occurrence
  const currentYear = fromDate.getFullYear();
  const holidayMonth = this.date.getUTCMonth();
  const holidayDay = this.date.getUTCDate();

  // Try current year first
  let nextOccurrence = new Date(currentYear, holidayMonth, holidayDay);

  // If the date has passed this year, try next year
  if (nextOccurrence <= fromDate) {
    nextOccurrence = new Date(currentYear + 1, holidayMonth, holidayDay);
  }

  return nextOccurrence;
};

// Static method to check if a date is a holiday
holidaySchema.statics.isHoliday = async function (date) {
  const holidays = await this.find({ isActive: true });

  return holidays.some((holiday) => holiday.appliesToDate(date));
};

// Static method to get holiday for a specific date
holidaySchema.statics.getHolidayForDate = async function (date) {
  const holidays = await this.find({ isActive: true });

  return holidays.find((holiday) => holiday.appliesToDate(date)) || null;
};

// Static method to get holidays in date range
holidaySchema.statics.getHolidaysInRange = async function (startDate, endDate) {
  const holidays = await this.find({ isActive: true }).populate(
    "createdBy updatedBy",
    "name email"
  );

  const holidaysInRange = [];

  for (const holiday of holidays) {
    if (holiday.isRecurring) {
      // For recurring holidays, check each year in the range
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        const occurrence = new Date(
          year,
          holiday.date.getUTCMonth(),
          holiday.date.getUTCDate()
        );

        if (occurrence >= startDate && occurrence <= endDate) {
          holidaysInRange.push({
            ...holiday.toObject(),
            effectiveDate: occurrence,
          });
        }
      }
    } else {
      // For non-recurring holidays, check if the date falls in range
      if (holiday.date >= startDate && holiday.date <= endDate) {
        holidaysInRange.push({
          ...holiday.toObject(),
          effectiveDate: holiday.date,
        });
      }
    }
  }

  // Sort by effective date
  return holidaysInRange.sort((a, b) => a.effectiveDate - b.effectiveDate);
};

// Static method to create a new holiday
holidaySchema.statics.createHoliday = async function (holidayData, createdBy) {
  // Check for duplicate holidays on the same date
  const existingHoliday = await this.findOne({
    date: holidayData.date,
    name: holidayData.name,
    isActive: true,
  });

  if (existingHoliday) {
    throw new Error(
      `Holiday "${holidayData.name}" already exists on ${
        holidayData.date.toISOString().split("T")[0]
      }`
    );
  }

  const holiday = new this({
    ...holidayData,
    createdBy,
    isActive: true,
  });

  return holiday.save();
};

// Static method to bulk create holidays
holidaySchema.statics.bulkCreateHolidays = async function (
  holidaysData,
  createdBy
) {
  const results = [];
  const errors = [];

  for (const holidayData of holidaysData) {
    try {
      const holiday = await this.createHoliday(holidayData, createdBy);
      results.push({
        success: true,
        holiday: holiday.toObject(),
      });
    } catch (error) {
      errors.push({
        success: false,
        data: holidayData,
        error: error.message,
      });
    }
  }

  return { results, errors };
};

// Static method to get upcoming holidays
holidaySchema.statics.getUpcomingHolidays = async function (limit = 10) {
  const today = new Date();
  const holidays = await this.find({ isActive: true }).populate(
    "createdBy",
    "name email"
  );

  const upcomingHolidays = [];

  for (const holiday of holidays) {
    const nextOccurrence = holiday.getNextOccurrence(today);
    if (nextOccurrence) {
      upcomingHolidays.push({
        ...holiday.toObject(),
        nextOccurrence,
      });
    }
  }

  // Sort by next occurrence and limit results
  return upcomingHolidays
    .sort((a, b) => a.nextOccurrence - b.nextOccurrence)
    .slice(0, limit);
};

// Static method to get holiday statistics
holidaySchema.statics.getHolidayStats = async function () {
  const stats = await this.aggregate([
    {
      $match: { isActive: true },
    },
    {
      $group: {
        _id: null,
        totalHolidays: { $sum: 1 },
        recurringHolidays: {
          $sum: { $cond: ["$isRecurring", 1, 0] },
        },
        oneTimeHolidays: {
          $sum: { $cond: ["$isRecurring", 0, 1] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalHolidays: 1,
        recurringHolidays: 1,
        oneTimeHolidays: 1,
      },
    },
  ]);

  return (
    stats[0] || {
      totalHolidays: 0,
      recurringHolidays: 0,
      oneTimeHolidays: 0,
    }
  );
};

// Method to update holiday
holidaySchema.methods.updateHoliday = function (updateData, updatedBy) {
  Object.assign(this, updateData);
  this.updatedBy = updatedBy;
  this.version += 1;
  return this.save();
};

// Method to deactivate holiday (soft delete)
holidaySchema.methods.deactivate = function (updatedBy) {
  this.isActive = false;
  this.updatedBy = updatedBy;
  this.version += 1;
  return this.save();
};

// Method to reactivate holiday
holidaySchema.methods.reactivate = function (updatedBy) {
  this.isActive = true;
  this.updatedBy = updatedBy;
  this.version += 1;
  return this.save();
};

// Pre-save middleware for validation
holidaySchema.pre("save", function (next) {
  try {
    // Normalize date to start of day in UTC
    if (this.date) {
      const normalizedDate = new Date(this.date);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      this.date = normalizedDate;
    }

    // Increment version if not new
    if (!this.isNew) {
      this.version += 1;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware
holidaySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;
