import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Appointment Details
    date: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    timeSlot: {
      type: String,
      required: [true, "Time slot is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Time slot must be in format HH:MM-HH:MM",
      ],
    }, // "09:00-10:00"
    status: {
      type: String,
      enum: {
        values: [
          "scheduled",
          "confirmed",
          "completed",
          "cancelled",
          "rescheduled",
          "expired",
        ],
        message:
          "Status must be scheduled, confirmed, completed, cancelled, rescheduled, or expired",
      },
      default: "scheduled",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },

    // Comments System for Admin
    comments: [
      {
        content: {
          type: String,
          required: [true, "Comment content is required"],
          trim: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Comment author is required"],
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Rescheduling History
    rescheduleHistory: [
      {
        originalDate: {
          type: Date,
          required: [true, "Original date is required for reschedule history"],
        },
        originalTimeSlot: {
          type: String,
          required: [
            true,
            "Original time slot is required for reschedule history",
          ],
        },
        rescheduleDate: {
          type: Date,
          default: Date.now,
        },
        reason: {
          type: String,
          trim: true,
          maxlength: [500, "Reschedule reason cannot exceed 500 characters"],
        },
        rescheduledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Rescheduled by user ID is required"],
        },
      },
    ],

    // Follow-up Appointments
    followUps: [
      {
        date: {
          type: Date,
          required: [true, "Follow-up date is required"],
        },
        timeSlot: {
          type: String,
          required: [true, "Follow-up time slot is required"],
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Time slot must be in format HH:MM-HH:MM",
          ],
        },
        status: {
          type: String,
          enum: {
            values: [
              "scheduled",
              "confirmed", 
              "completed",
              "cancelled",
              "rescheduled",
            ],
            message:
              "Follow-up status must be scheduled, confirmed, completed, cancelled, or rescheduled",
          },
          default: "scheduled",
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [500, "Follow-up notes cannot exceed 500 characters"],
        },
        scheduledBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Scheduled by user ID is required"],
        },
        scheduledAt: {
          type: Date,
          default: Date.now,
        },
        completedAt: {
          type: Date,
        },
        cancelledAt: {
          type: Date,
        },
        cancellationReason: {
          type: String,
          trim: true,
          maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
        },
      },
    ],

    // Cancellation Details
    cancellationDetails: {
      reason: {
        type: String,
        trim: true,
        maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      },
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      cancelledAt: {
        type: Date,
      },
    },

    // Timestamps
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
appointmentSchema.index({ userId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ date: 1, timeSlot: 1 }); // Compound index for availability checking
appointmentSchema.index({ userId: 1, status: 1 }); // Compound index for user appointments

// Virtual for appointment datetime
appointmentSchema.virtual("appointmentDateTime").get(function () {
  if (!this.date || !this.timeSlot) return null;

  const [startTime] = this.timeSlot.split("-");
  const [hours, minutes] = startTime.split(":");
  const appointmentDate = new Date(this.date);
  appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return appointmentDate;
});

// Virtual for duration in minutes
appointmentSchema.virtual("durationMinutes").get(function () {
  if (!this.timeSlot) return 0;

  const [startTime, endTime] = this.timeSlot.split("-");
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  return endTotalMinutes - startTotalMinutes;
});

// Virtual to check if appointment is in the past
appointmentSchema.virtual("isPast").get(function () {
  const appointmentDateTime = this.appointmentDateTime;
  return appointmentDateTime ? appointmentDateTime < new Date() : false;
});

// Virtual to check if appointment is today
appointmentSchema.virtual("isToday").get(function () {
  if (!this.date) return false;

  const today = new Date();
  const appointmentDate = new Date(this.date);

  return today.toDateString() === appointmentDate.toDateString();
});

// Ensure virtual fields are serialized
appointmentSchema.set("toJSON", {
  virtuals: true,
});

// Static method to check time slot availability
appointmentSchema.statics.isTimeSlotAvailable = async function (
  date,
  timeSlot,
  excludeAppointmentId = null
) {
  const query = {
    date: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    },
    timeSlot,
    status: { $nin: ["cancelled", "expired"] },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const existingAppointment = await this.findOne(query);
  return !existingAppointment;
};

// Static method to get available time slots for a date
appointmentSchema.statics.getAvailableTimeSlots = async function (date) {
  try {
    // Use new AvailabilityCalculator service for improved functionality
    const { default: AvailabilityCalculator } = await import(
      "../services/availabilityCalculator.js"
    );
    const calculator = new AvailabilityCalculator();

    const availability = await calculator.getAvailableSlotsForDate(date, {
      onlyAvailable: true,
    });

    // Return backward compatible format (array of time slot strings)
    return availability.slots.map((slot) => slot.timeSlot);
  } catch (error) {
    console.error("Error getting available time slots:", error);

    // Fallback to old logic if new system fails (for backward compatibility)
    try {
      const { default: AvailabilitySettings } = await import(
        "./AvailabilitySettings.js"
      );

      const settings = await AvailabilitySettings.getSettings();
      const isHoliday = settings.isHoliday(date);

      if (isHoliday) {
        return [];
      }

      const allTimeSlots = [
        "08:00-09:00",
        "09:00-10:00",
        "10:00-11:00",
        "11:00-12:00",
        "12:00-13:00",
        "13:00-14:00",
        "14:00-15:00",
        "15:00-16:00",
        "16:00-17:00",
        "17:00-18:00",
      ];

      const bookedAppointments = await this.find({
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999)),
        },
        status: { $nin: ["cancelled", "expired"] },
      }).select("timeSlot");

      const bookedTimeSlots = bookedAppointments.map((apt) => apt.timeSlot);

      return allTimeSlots.filter((slot) => !bookedTimeSlots.includes(slot));
    } catch (fallbackError) {
      console.error(
        "Fallback availability calculation also failed:",
        fallbackError
      );
      throw new Error("Failed to calculate available time slots");
    }
  }
};

// Static method to get user's appointments
appointmentSchema.statics.getUserAppointments = function (
  userId,
  status = null
) {
  const query = { userId };
  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate("userId", "name phone email")
    .populate("followUps.scheduledBy", "name")
    .sort({ date: -1 });
};

// Static method to get appointments for a date range
appointmentSchema.statics.getAppointmentsByDateRange = function (
  startDate,
  endDate,
  status = null
) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .populate("userId", "name phone email")
    .sort({ date: 1, timeSlot: 1 });
};

// Instance method to reschedule appointment
appointmentSchema.methods.reschedule = async function (
  newDate,
  newTimeSlot,
  rescheduledBy,
  reason = ""
) {
  // Check if new time slot is available
  const isAvailable = await this.constructor.isTimeSlotAvailable(
    new Date(newDate),
    newTimeSlot,
    this._id
  );

  if (!isAvailable) {
    throw new Error("The selected time slot is not available");
  }

  // Add to reschedule history
  this.rescheduleHistory.push({
    originalDate: this.date,
    originalTimeSlot: this.timeSlot,
    rescheduleDate: new Date(),
    reason,
    rescheduledBy,
  });

  // Update appointment details
  this.date = new Date(newDate);
  this.timeSlot = newTimeSlot;
  this.status = "rescheduled";

  return this.save();
};

// Instance method to complete appointment
appointmentSchema.methods.complete = function () {
  this.status = "completed";
  this.completedAt = new Date();
  return this.save();
};

// Instance method to cancel appointment
appointmentSchema.methods.cancel = function (
  reason = null,
  cancelledBy = null
) {
  this.status = "cancelled";

  // Add cancellation details
  if (!this.cancellationDetails) {
    this.cancellationDetails = {};
  }

  this.cancellationDetails.reason = reason;
  this.cancellationDetails.cancelledBy = cancelledBy;
  this.cancellationDetails.cancelledAt = new Date();

  return this.save();
};

// Instance method to expire appointment
appointmentSchema.methods.expire = function (reason = null) {
  this.status = "expired";

  // Add expiration details using cancellation structure for consistency
  if (!this.cancellationDetails) {
    this.cancellationDetails = {};
  }

  this.cancellationDetails.reason = reason || "Appointment expired - scheduled time has passed without confirmation";
  this.cancellationDetails.cancelledBy = null; // System expiration
  this.cancellationDetails.cancelledAt = new Date();

  return this.save();
};

// Instance method to add follow-up
appointmentSchema.methods.addFollowUp = function (followUpData, scheduledBy) {
  const followUp = {
    ...followUpData,
    scheduledBy,
    scheduledAt: new Date(),
    status: "scheduled",
  };
  
  this.followUps.push(followUp);
  return this.save();
};

// Instance method to update follow-up status
appointmentSchema.methods.updateFollowUpStatus = function (followUpId, status, additionalData = {}) {
  const followUp = this.followUps.id(followUpId);
  if (!followUp) {
    throw new Error("Follow-up not found");
  }
  
  followUp.status = status;
  
  if (status === "completed") {
    followUp.completedAt = new Date();
  } else if (status === "cancelled") {
    followUp.cancelledAt = new Date();
    if (additionalData.cancellationReason) {
      followUp.cancellationReason = additionalData.cancellationReason;
    }
  }
  
  return this.save();
};

// Instance method to get upcoming follow-ups
appointmentSchema.methods.getUpcomingFollowUps = function () {
  const now = new Date();
  return this.followUps.filter(followUp => 
    followUp.date >= now && 
    ["scheduled", "confirmed"].includes(followUp.status)
  );
};

// Pre-save middleware to validate appointment date
appointmentSchema.pre("save", function (next) {
  // Don't allow appointments in the past (except for updates to existing appointments)
  if (this.isNew && this.date < new Date()) {
    return next(new Error("Cannot schedule appointments in the past"));
  }

  // Validate time slot format
  if (
    this.timeSlot &&
    !this.timeSlot.match(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    )
  ) {
    return next(new Error("Invalid time slot format"));
  }

  next();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
