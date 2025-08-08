import mongoose from "mongoose";

const availabilityTemplateSchema = new mongoose.Schema(
  {
    templateName: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      maxlength: [100, "Template name cannot exceed 100 characters"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    workingHours: {
      start: {
        type: String,
        required: [true, "Working hours start time is required"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "Start time must be in format HH:MM",
        ],
      },
      end: {
        type: String,
        required: [true, "Working hours end time is required"],
        match: [
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          "End time must be in format HH:MM",
        ],
      },
    },
    slotDuration: {
      type: Number,
      required: [true, "Slot duration is required"],
      min: [15, "Slot duration must be at least 15 minutes"],
      max: [180, "Slot duration cannot exceed 180 minutes"],
      default: 30,
    },
    breakTimes: [
      {
        start: {
          type: String,
          required: [true, "Break start time is required"],
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Break start time must be in format HH:MM",
          ],
        },
        end: {
          type: String,
          required: [true, "Break end time is required"],
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Break end time must be in format HH:MM",
          ],
        },
        reason: {
          type: String,
          trim: true,
          maxlength: [100, "Break reason cannot exceed 100 characters"],
          default: "Break",
        },
      },
    ],
    // Custom templates have specific dates, default template applies to all working days
    applicableDates: [
      {
        type: Date,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user ID is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
availabilityTemplateSchema.index({ isDefault: 1 });
availabilityTemplateSchema.index({ applicableDates: 1 });
availabilityTemplateSchema.index({ isActive: 1 });
availabilityTemplateSchema.index({ applicableDates: 1, isActive: 1 });

// Ensure only one default template exists
availabilityTemplateSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    // If this template is being set as default, unset all other defaults
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }

  // Validate working hours
  if (this.workingHours) {
    const startTime = this.workingHours.start.split(":").map(Number);
    const endTime = this.workingHours.end.split(":").map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (startMinutes >= endMinutes) {
      return next(new Error("Working hours end time must be after start time"));
    }
  }

  // Validate break times
  if (this.breakTimes && this.breakTimes.length > 0) {
    for (const breakTime of this.breakTimes) {
      const breakStart = breakTime.start.split(":").map(Number);
      const breakEnd = breakTime.end.split(":").map(Number);
      const breakStartMinutes = breakStart[0] * 60 + breakStart[1];
      const breakEndMinutes = breakEnd[0] * 60 + breakEnd[1];

      if (breakStartMinutes >= breakEndMinutes) {
        return next(new Error("Break end time must be after break start time"));
      }

      // Validate break times are within working hours
      const workStart = this.workingHours.start.split(":").map(Number);
      const workEnd = this.workingHours.end.split(":").map(Number);
      const workStartMinutes = workStart[0] * 60 + workStart[1];
      const workEndMinutes = workEnd[0] * 60 + workEnd[1];

      if (
        breakStartMinutes < workStartMinutes ||
        breakEndMinutes > workEndMinutes
      ) {
        return next(new Error("Break times must be within working hours"));
      }
    }
  }

  next();
});

// Static method to get the default template
availabilityTemplateSchema.statics.getDefaultTemplate = async function () {
  return this.findOne({ isDefault: true, isActive: true });
};

// Static method to get template for a specific date
availabilityTemplateSchema.statics.getTemplateForDate = async function (date) {
  // Normalize the input date to start of day
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // Create date range for the entire day
  const startOfDay = new Date(targetDate);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // First check for custom templates on this date using date range
  const customTemplate = await this.findOne({
    applicableDates: {
      $elemMatch: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    },
    isDefault: false,
    isActive: true,
  });

  if (customTemplate) {
    return customTemplate;
  }

  // Fallback to default template
  return this.getDefaultTemplate();
};

// Instance method to generate time slots
availabilityTemplateSchema.methods.generateTimeSlots = function () {
  const slots = [];
  const workStart = this.workingHours.start.split(":").map(Number);
  const workEnd = this.workingHours.end.split(":").map(Number);

  const workStartMinutes = workStart[0] * 60 + workStart[1];
  const workEndMinutes = workEnd[0] * 60 + workEnd[1];

  // Convert break times to minutes for easier comparison
  const breakPeriods = this.breakTimes.map((breakTime) => {
    const start = breakTime.start.split(":").map(Number);
    const end = breakTime.end.split(":").map(Number);
    return {
      start: start[0] * 60 + start[1],
      end: end[0] * 60 + end[1],
      reason: breakTime.reason,
    };
  });

  let currentTime = workStartMinutes;

  while (currentTime + this.slotDuration <= workEndMinutes) {
    const slotEnd = currentTime + this.slotDuration;

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
        duration: this.slotDuration,
      });
    }

    currentTime += this.slotDuration;
  }

  return slots;
};

// Instance method to add dates to template
availabilityTemplateSchema.methods.addDates = function (dates) {
  const datesToAdd = Array.isArray(dates) ? dates : [dates];

  datesToAdd.forEach((date) => {
    const dateObj = new Date(date);
    // Normalize to start of day to ensure consistent comparison
    dateObj.setHours(0, 0, 0, 0);

    // Only add if not already present (compare by date string to avoid time issues)
    const dateString = dateObj.toISOString().split("T")[0];
    const exists = this.applicableDates.some((existingDate) => {
      const existingDateString = new Date(existingDate)
        .toISOString()
        .split("T")[0];
      return existingDateString === dateString;
    });

    if (!exists) {
      this.applicableDates.push(dateObj);
    }
  });

  return this.save();
};

// Instance method to remove dates from template
availabilityTemplateSchema.methods.removeDates = function (dates) {
  const datesToRemove = Array.isArray(dates) ? dates : [dates];

  datesToRemove.forEach((date) => {
    const dateObj = new Date(date);
    // Normalize to start of day for consistent comparison
    dateObj.setHours(0, 0, 0, 0);
    const dateString = dateObj.toISOString().split("T")[0];

    this.applicableDates = this.applicableDates.filter((existingDate) => {
      const existingDateString = new Date(existingDate)
        .toISOString()
        .split("T")[0];
      return existingDateString !== dateString;
    });
  });

  return this.save();
};

const AvailabilityTemplate = mongoose.model(
  "AvailabilityTemplate",
  availabilityTemplateSchema
);

export default AvailabilityTemplate;
