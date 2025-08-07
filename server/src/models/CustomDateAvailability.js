import mongoose from "mongoose";

const customSlotSchema = new mongoose.Schema({
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
  isActive: {
    type: Boolean,
    default: true,
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
});

// Validate slot duration and order
customSlotSchema.pre("validate", function () {
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

const customDateAvailabilitySchema = new mongoose.Schema(
  {
    // Specific date for custom availability
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          // Ensure date is not in the past (except for today)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const inputDate = new Date(v);
          inputDate.setHours(0, 0, 0, 0);
          return inputDate >= today;
        },
        message: "Custom date cannot be in the past",
      },
    },

    // Custom time slots for this specific date
    customSlots: {
      type: [customSlotSchema],
      required: true,
      validate: [
        {
          validator: function (slots) {
            return Array.isArray(slots) && slots.length > 0;
          },
          message: "At least one custom slot must be defined",
        },
        {
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
          message: "Custom slots cannot overlap",
        },
      ],
    },

    // Reason for custom availability
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      enum: [
        "Extended hours",
        "Reduced availability",
        "Special event",
        "Emergency coverage",
        "Staff training",
        "Maintenance",
        "Holiday coverage",
        "Other",
      ],
    },

    // Additional notes
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
      default: "",
    },

    // Whether this custom date is currently active
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
customDateAvailabilitySchema.index({ date: 1, isActive: 1 }); // Primary query index
customDateAvailabilitySchema.index({ createdBy: 1, date: 1 }); // Admin-specific queries
customDateAvailabilitySchema.index({ reason: 1 }); // Filter by reason
customDateAvailabilitySchema.index({ updatedAt: 1 }); // Recent changes

// Ensure only one custom availability per date
customDateAvailabilitySchema.index({ date: 1 }, { unique: true });

// Virtual for formatted date
customDateAvailabilitySchema.virtual("formattedDate").get(function () {
  return this.date.toISOString().split("T")[0];
});

// Virtual for active slots count
customDateAvailabilitySchema.virtual("activeSlotsCount").get(function () {
  return this.customSlots.filter((slot) => slot.isActive).length;
});

// Virtual for total capacity
customDateAvailabilitySchema.virtual("totalCapacity").get(function () {
  return this.customSlots
    .filter((slot) => slot.isActive)
    .reduce((total, slot) => total + slot.maxBookings, 0);
});

// Method to check if two time slots overlap
customDateAvailabilitySchema.methods.timeSlotsOverlap = function (
  slot1,
  slot2
) {
  const slot1Start = this.timeToMinutes(slot1.startTime);
  const slot1End = this.timeToMinutes(slot1.endTime);
  const slot2Start = this.timeToMinutes(slot2.startTime);
  const slot2End = this.timeToMinutes(slot2.endTime);

  return slot1Start < slot2End && slot1End > slot2Start;
};

// Helper method to convert time string to minutes
customDateAvailabilitySchema.methods.timeToMinutes = function (timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper method to convert minutes to time string
customDateAvailabilitySchema.methods.minutesToTime = function (minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

// Method to get active slots only
customDateAvailabilitySchema.methods.getActiveSlots = function () {
  return this.customSlots.filter((slot) => slot.isActive);
};

// Method to add a new slot
customDateAvailabilitySchema.methods.addSlot = function (slotData, userId) {
  // Validate no overlap with existing slots
  for (const existingSlot of this.customSlots) {
    if (
      existingSlot.isActive &&
      this.timeSlotsOverlap(slotData, existingSlot)
    ) {
      throw new Error(
        `New slot overlaps with existing slot: ${existingSlot.startTime}-${existingSlot.endTime}`
      );
    }
  }

  this.customSlots.push({
    ...slotData,
    isActive: true,
  });

  this.updatedBy = userId;
  this.version += 1;

  return this.save();
};

// Method to remove a slot
customDateAvailabilitySchema.methods.removeSlot = function (slotId, userId) {
  const slot = this.customSlots.id(slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  slot.remove();

  // Ensure at least one slot remains
  if (this.customSlots.length === 0) {
    throw new Error(
      "Cannot remove the last slot. At least one slot must remain."
    );
  }

  this.updatedBy = userId;
  this.version += 1;

  return this.save();
};

// Method to update a slot
customDateAvailabilitySchema.methods.updateSlot = function (
  slotId,
  slotData,
  userId
) {
  const slot = this.customSlots.id(slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  // Check for overlaps with other slots (excluding the current one)
  const otherSlots = this.customSlots.filter((s) => !s._id.equals(slotId));
  for (const otherSlot of otherSlots) {
    if (otherSlot.isActive && this.timeSlotsOverlap(slotData, otherSlot)) {
      throw new Error(
        `Updated slot overlaps with existing slot: ${otherSlot.startTime}-${otherSlot.endTime}`
      );
    }
  }

  Object.assign(slot, slotData);
  this.updatedBy = userId;
  this.version += 1;

  return this.save();
};

// Method to toggle slot active status
customDateAvailabilitySchema.methods.toggleSlot = function (slotId, userId) {
  const slot = this.customSlots.id(slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  // Ensure at least one slot remains active
  const activeSlots = this.customSlots.filter((s) => s.isActive);
  if (activeSlots.length === 1 && slot.isActive) {
    throw new Error(
      "Cannot deactivate the last active slot. At least one slot must remain active."
    );
  }

  slot.isActive = !slot.isActive;
  this.updatedBy = userId;
  this.version += 1;

  return this.save();
};

// Method to check if this custom date conflicts with holidays
customDateAvailabilitySchema.methods.checkHolidayConflict = async function () {
  const Holiday = mongoose.model("Holiday");
  const isHoliday = await Holiday.isHoliday(this.date);

  if (isHoliday) {
    const holiday = await Holiday.getHolidayForDate(this.date);
    throw new Error(
      `Cannot create custom availability on holiday: ${holiday.name} (${this.formattedDate})`
    );
  }

  return false;
};

// Method to check if custom date has conflicting appointments
customDateAvailabilitySchema.methods.hasConflictingAppointments =
  async function () {
    const Appointment = mongoose.model("Appointment");

    const conflictingAppointments = await Appointment.find({
      appointmentDate: this.date,
      status: { $in: ["confirmed", "pending"] },
    });

    return conflictingAppointments.length > 0;
  };

// Static method to find custom availability by date
customDateAvailabilitySchema.statics.findByDate = function (date) {
  const searchDate = new Date(date);
  searchDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(searchDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.findOne({
    date: {
      $gte: searchDate,
      $lt: nextDay,
    },
    isActive: true,
  }).populate("createdBy updatedBy", "name email");
};

// Static method to get custom dates in range
customDateAvailabilitySchema.statics.getCustomDatesInRange = function (
  startDate,
  endDate,
  options = {}
) {
  const query = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
    isActive: true,
  };

  // Add optional filters
  if (options.reason) {
    query.reason = options.reason;
  }

  if (options.createdBy) {
    query.createdBy = options.createdBy;
  }

  return this.find(query)
    .populate("createdBy updatedBy", "name email")
    .sort({ date: 1 });
};

// Static method to create custom date availability
customDateAvailabilitySchema.statics.createCustomDate = async function (
  customDateData,
  createdBy
) {
  // Check if custom date already exists
  const existingCustomDate = await this.findByDate(customDateData.date);
  if (existingCustomDate) {
    throw new Error(
      `Custom availability already exists for ${
        customDateData.date.toISOString().split("T")[0]
      }`
    );
  }

  const customDate = new this({
    ...customDateData,
    createdBy,
    isActive: true,
  });

  // Check for holiday conflicts
  await customDate.checkHolidayConflict();

  return customDate.save();
};

// Static method to bulk create custom dates
customDateAvailabilitySchema.statics.bulkCreateCustomDates = async function (
  customDatesData,
  createdBy
) {
  const results = [];
  const errors = [];

  for (const customDateData of customDatesData) {
    try {
      const customDate = await this.createCustomDate(customDateData, createdBy);
      results.push({
        success: true,
        customDate: customDate.toObject(),
      });
    } catch (error) {
      errors.push({
        success: false,
        data: customDateData,
        error: error.message,
      });
    }
  }

  return { results, errors };
};

// Static method to get custom date statistics
customDateAvailabilitySchema.statics.getCustomDateStats = function (
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        isActive: true,
      },
    },
    {
      $unwind: "$customSlots",
    },
    {
      $group: {
        _id: "$reason",
        count: { $sum: 1 },
        totalSlots: { $sum: 1 },
        activeSlots: {
          $sum: { $cond: ["$customSlots.isActive", 1, 0] },
        },
        totalCapacity: {
          $sum: {
            $cond: ["$customSlots.isActive", "$customSlots.maxBookings", 0],
          },
        },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

// Method to update custom date
customDateAvailabilitySchema.methods.updateCustomDate = function (
  updateData,
  updatedBy
) {
  Object.assign(this, updateData);
  this.updatedBy = updatedBy;
  this.version += 1;
  return this.save();
};

// Method to deactivate custom date (soft delete)
customDateAvailabilitySchema.methods.deactivate = function (updatedBy) {
  this.isActive = false;
  this.updatedBy = updatedBy;
  this.version += 1;
  return this.save();
};

// Method to reactivate custom date
customDateAvailabilitySchema.methods.reactivate = function (updatedBy) {
  this.isActive = true;
  this.updatedBy = updatedBy;
  this.version += 1;
  return this.save();
};

// Pre-save middleware for validation
customDateAvailabilitySchema.pre("save", async function (next) {
  try {
    // Normalize date to start of day in UTC
    if (this.date) {
      const normalizedDate = new Date(this.date);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      this.date = normalizedDate;
    }

    // Ensure at least one active slot exists
    const activeSlots = this.customSlots.filter((slot) => slot.isActive);
    if (activeSlots.length === 0) {
      throw new Error("At least one active slot must be defined");
    }

    // Check for holiday conflicts on new documents
    if (this.isNew) {
      await this.checkHolidayConflict();
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
customDateAvailabilitySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

const CustomDateAvailability = mongoose.model(
  "CustomDateAvailability",
  customDateAvailabilitySchema
);

export default CustomDateAvailability;
