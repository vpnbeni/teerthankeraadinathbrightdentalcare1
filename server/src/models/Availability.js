import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
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
  isAvailable: {
    type: Boolean,
    default: true,
  },
  maxBookings: {
    type: Number,
    default: 1,
    min: 0,
    validate: {
      validator: function (v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: "Max bookings must be a non-negative integer",
    },
  },
  currentBookings: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// Enhanced validation for time slots
timeSlotSchema.pre("validate", function () {
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

  // Validate current bookings don't exceed max bookings
  if (this.currentBookings > this.maxBookings) {
    throw new Error("Current bookings cannot exceed maximum bookings");
  }
});

// Method to check if slot is fully booked
timeSlotSchema.methods.isFullyBooked = function () {
  return this.currentBookings >= this.maxBookings;
};

// Method to check if slot can accept more bookings
timeSlotSchema.methods.canAcceptBooking = function () {
  return this.isAvailable && !this.isFullyBooked();
};

const availabilitySchema = new mongoose.Schema(
  {
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
        message: "Availability date cannot be in the past",
      },
    },
    timeSlots: {
      type: [timeSlotSchema],
      validate: {
        validator: function (slots) {
          // Validate no overlapping time slots
          for (let i = 0; i < slots.length; i++) {
            for (let j = i + 1; j < slots.length; j++) {
              if (this.timeSlotsOverlap(slots[i], slots[j])) {
                return false;
              }
            }
          }
          return true;
        },
        message: "Time slots cannot overlap",
      },
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    // Enhanced audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Additional audit information
    auditLog: [
      {
        action: {
          type: String,
          enum: [
            "created",
            "updated",
            "slot_added",
            "slot_removed",
            "slot_modified",
            "holiday_sync",
          ],
          required: true,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        changes: {
          type: mongoose.Schema.Types.Mixed,
        },
        reason: {
          type: String,
          maxlength: 200,
        },
      },
    ],
    // Status tracking
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
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

// Enhanced indexes for efficient date-based queries
availabilitySchema.index({ date: 1, status: 1 }); // Primary query index
availabilitySchema.index({ date: 1, isHoliday: 1 }); // Holiday filtering
availabilitySchema.index({ createdBy: 1, date: 1 }); // Admin-specific queries
availabilitySchema.index({ updatedAt: 1 }); // Recent changes
availabilitySchema.index({ "timeSlots.isAvailable": 1, date: 1 }); // Available slots

// Ensure only one availability document per date
availabilitySchema.index({ date: 1 }, { unique: true });

// Compound index for audit queries
availabilitySchema.index({
  "auditLog.timestamp": 1,
  "auditLog.performedBy": 1,
});

// Virtual for formatted date
availabilitySchema.virtual("formattedDate").get(function () {
  return this.date.toISOString().split("T")[0];
});

// Virtual for available slots count
availabilitySchema.virtual("availableSlotsCount").get(function () {
  return this.timeSlots.filter(
    (slot) => slot.isAvailable && slot.canAcceptBooking()
  ).length;
});

// Virtual for total capacity
availabilitySchema.virtual("totalCapacity").get(function () {
  return this.timeSlots.reduce((total, slot) => total + slot.maxBookings, 0);
});

// Method to check if two time slots overlap
availabilitySchema.methods.timeSlotsOverlap = function (slot1, slot2) {
  const slot1Start = this.timeToMinutes(slot1.startTime);
  const slot1End = this.timeToMinutes(slot1.endTime);
  const slot2Start = this.timeToMinutes(slot2.startTime);
  const slot2End = this.timeToMinutes(slot2.endTime);

  return slot1Start < slot2End && slot1End > slot2Start;
};

// Helper method to convert time string to minutes
availabilitySchema.methods.timeToMinutes = function (timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

// Method to check if a time slot conflicts with existing appointments
availabilitySchema.methods.hasConflictingAppointments = async function (
  timeSlot
) {
  const Appointment = mongoose.model("Appointment");

  const conflictingAppointments = await Appointment.find({
    appointmentDate: this.date,
    appointmentTime: {
      $gte: timeSlot.startTime,
      $lt: timeSlot.endTime,
    },
    status: { $in: ["confirmed", "pending"] },
  });

  return conflictingAppointments.length > 0;
};

// Method to validate business rules before saving
availabilitySchema.methods.validateBusinessRules = async function () {
  const AvailabilitySettings = mongoose.model("AvailabilitySettings");
  const settings = await AvailabilitySettings.getSettings();

  // Check if date is too far in advance
  const maxAdvanceDays = settings.advanceBookingDays || 30;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

  if (this.date > maxDate) {
    throw new Error(
      `Cannot create availability more than ${maxAdvanceDays} days in advance`
    );
  }

  // Check if it's a working day (unless it's a holiday override)
  if (!this.isHoliday && !settings.isWorkingDay(this.date)) {
    throw new Error("Cannot create availability on non-working days");
  }

  // Validate time slots against break times
  for (const slot of this.timeSlots) {
    if (slot.isAvailable) {
      const hasBreakConflict = settings.breakTimes.some((breakTime) =>
        this.timeSlotsOverlap(slot, breakTime)
      );

      if (hasBreakConflict) {
        throw new Error(
          `Time slot ${slot.startTime}-${slot.endTime} conflicts with break time`
        );
      }
    }
  }

  return true;
};

// Method to add audit log entry
availabilitySchema.methods.addAuditEntry = function (
  action,
  performedBy,
  changes = null,
  reason = null
) {
  this.auditLog.push({
    action,
    performedBy,
    timestamp: new Date(),
    changes,
    reason,
  });

  this.updatedBy = performedBy;
  this.version += 1;
};

// Method to check if slot can be removed safely
availabilitySchema.methods.canRemoveSlot = async function (slotIndex) {
  if (slotIndex < 0 || slotIndex >= this.timeSlots.length) {
    throw new Error("Invalid slot index");
  }

  const slot = this.timeSlots[slotIndex];
  const hasAppointments = await this.hasConflictingAppointments(slot);

  return !hasAppointments;
};

// Method to get available slots for booking
availabilitySchema.methods.getAvailableSlots = function () {
  return this.timeSlots.filter((slot) => slot.canAcceptBooking());
};

// Method to book a time slot
availabilitySchema.methods.bookTimeSlot = function (slotIndex, performedBy) {
  if (slotIndex < 0 || slotIndex >= this.timeSlots.length) {
    throw new Error("Invalid slot index");
  }

  const slot = this.timeSlots[slotIndex];

  if (!slot.canAcceptBooking()) {
    throw new Error("Time slot is not available for booking");
  }

  slot.currentBookings += 1;

  this.addAuditEntry("slot_modified", performedBy, {
    slotIndex,
    action: "booking_added",
    newBookingCount: slot.currentBookings,
  });

  return slot;
};

// Method to cancel a booking in a time slot
availabilitySchema.methods.cancelBookingInSlot = function (
  slotIndex,
  performedBy
) {
  if (slotIndex < 0 || slotIndex >= this.timeSlots.length) {
    throw new Error("Invalid slot index");
  }

  const slot = this.timeSlots[slotIndex];

  if (slot.currentBookings <= 0) {
    throw new Error("No bookings to cancel in this slot");
  }

  slot.currentBookings -= 1;

  this.addAuditEntry("slot_modified", performedBy, {
    slotIndex,
    action: "booking_cancelled",
    newBookingCount: slot.currentBookings,
  });

  return slot;
};

// Pre-save middleware for validation and audit logging
availabilitySchema.pre("save", async function (next) {
  try {
    // Validate business rules
    await this.validateBusinessRules();

    // Add audit entry for new documents
    if (this.isNew) {
      this.addAuditEntry("created", this.createdBy, {
        date: this.date,
        slotsCount: this.timeSlots.length,
        isHoliday: this.isHoliday,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware for audit logging
availabilitySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Static method to get availability for date range with enhanced filtering
availabilitySchema.statics.getAvailabilityRange = function (
  startDate,
  endDate,
  options = {}
) {
  const query = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  // Add optional filters
  if (options.status) {
    query.status = options.status;
  }

  if (options.isHoliday !== undefined) {
    query.isHoliday = options.isHoliday;
  }

  if (options.hasAvailableSlots) {
    query["timeSlots.isAvailable"] = true;
  }

  return this.find(query)
    .populate("createdBy updatedBy", "name email")
    .populate("auditLog.performedBy", "name email")
    .sort({ date: 1 });
};

// Static method to create default availability for a date
availabilitySchema.statics.createDefaultAvailability = async function (
  date,
  createdBy,
  customSlots = null
) {
  const AvailabilitySettings = mongoose.model("AvailabilitySettings");
  const settings = await AvailabilitySettings.getSettings();

  // Check if it's a working day
  if (!settings.isWorkingDay(date) && !customSlots) {
    throw new Error("Cannot create default availability for non-working days");
  }

  // Check if it's a holiday
  const isHoliday = settings.isHoliday(date);

  let timeSlots = [];

  if (!isHoliday && !customSlots) {
    // Use day-specific time slots from settings
    const dayOfWeek = date.getDay();
    timeSlots = settings.getTimeSlotsForDay(dayOfWeek);
  } else if (customSlots) {
    timeSlots = customSlots;
  }

  const availability = new this({
    date,
    timeSlots,
    isHoliday,
    createdBy,
    status: "active",
  });

  return availability.save();
};

// Static method to find availability by date
availabilitySchema.statics.findByDate = function (date) {
  const searchDate = new Date(date);
  searchDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(searchDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.findOne({
    date: {
      $gte: searchDate,
      $lt: nextDay,
    },
  }).populate("createdBy updatedBy", "name email");
};

// Static method to get availability statistics
availabilitySchema.statics.getAvailabilityStats = function (
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
        status: "active",
      },
    },
    {
      $unwind: "$timeSlots",
    },
    {
      $group: {
        _id: null,
        totalSlots: { $sum: 1 },
        availableSlots: {
          $sum: {
            $cond: [
              {
                $and: [
                  "$timeSlots.isAvailable",
                  {
                    $lt: [
                      "$timeSlots.currentBookings",
                      "$timeSlots.maxBookings",
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalCapacity: { $sum: "$timeSlots.maxBookings" },
        currentBookings: { $sum: "$timeSlots.currentBookings" },
        holidayDays: {
          $sum: {
            $cond: ["$isHoliday", 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalSlots: 1,
        availableSlots: 1,
        totalCapacity: 1,
        currentBookings: 1,
        holidayDays: 1,
        utilizationRate: {
          $multiply: [{ $divide: ["$currentBookings", "$totalCapacity"] }, 100],
        },
        availabilityRate: {
          $multiply: [{ $divide: ["$availableSlots", "$totalSlots"] }, 100],
        },
      },
    },
  ]);
};

// Static method to bulk update availability
availabilitySchema.statics.bulkUpdateAvailability = async function (
  updates,
  performedBy
) {
  const results = [];

  for (const update of updates) {
    try {
      const availability = await this.findById(update.id);
      if (!availability) {
        results.push({
          id: update.id,
          success: false,
          error: "Availability not found",
        });
        continue;
      }

      // Apply updates
      Object.assign(availability, update.data);

      // Add audit entry
      availability.addAuditEntry(
        "updated",
        performedBy,
        update.data,
        update.reason
      );

      await availability.save();
      results.push({ id: update.id, success: true });
    } catch (error) {
      results.push({ id: update.id, success: false, error: error.message });
    }
  }

  return results;
};

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;
