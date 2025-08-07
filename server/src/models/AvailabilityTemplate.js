import mongoose from "mongoose";

const defaultSlotSchema = new mongoose.Schema({
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
defaultSlotSchema.pre("validate", function () {
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

const availabilityTemplateSchema = new mongoose.Schema(
  {
    // Singleton document ID
    _id: {
      type: String,
      default: "availability_template",
    },

    // Default time slots (8 AM to 6 PM hourly slots)
    defaultSlots: {
      type: [defaultSlotSchema],
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
        message: "Default slots cannot overlap",
      },
    },

    // Working days (0 = Sunday, 1 = Monday, etc.)
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

    // Audit fields
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow null for initial template creation
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
availabilityTemplateSchema.index({ updatedAt: 1 });
availabilityTemplateSchema.index({ updatedBy: 1 });

// Method to check if two time slots overlap
availabilityTemplateSchema.methods.timeSlotsOverlap = function (slot1, slot2) {
  const slot1Start = this.timeToMinutes(slot1.startTime);
  const slot1End = this.timeToMinutes(slot1.endTime);
  const slot2Start = this.timeToMinutes(slot2.startTime);
  const slot2End = this.timeToMinutes(slot2.endTime);

  return slot1Start < slot2End && slot1End > slot2Start;
};

// Helper method to convert time string to minutes
availabilityTemplateSchema.methods.timeToMinutes = function (timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper method to convert minutes to time string
availabilityTemplateSchema.methods.minutesToTime = function (minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

// Method to get active slots only
availabilityTemplateSchema.methods.getActiveSlots = function () {
  return this.defaultSlots.filter((slot) => slot.isActive);
};

// Method to add a new slot
availabilityTemplateSchema.methods.addSlot = function (slotData, userId) {
  // Validate no overlap with existing slots
  for (const existingSlot of this.defaultSlots) {
    if (
      existingSlot.isActive &&
      this.timeSlotsOverlap(slotData, existingSlot)
    ) {
      throw new Error(
        `New slot overlaps with existing slot: ${existingSlot.startTime}-${existingSlot.endTime}`
      );
    }
  }

  this.defaultSlots.push({
    ...slotData,
    isActive: true,
  });

  this.updatedBy = userId;
  this.version += 1;

  return this.save();
};

// Method to remove a slot
availabilityTemplateSchema.methods.removeSlot = function (slotId, userId) {
  const slot = this.defaultSlots.id(slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  this.defaultSlots.pull(slotId);
  this.updatedBy = userId;
  this.version += 1;

  return this.save();
};

// Method to update a slot
availabilityTemplateSchema.methods.updateSlot = function (
  slotId,
  slotData,
  userId
) {
  const slot = this.defaultSlots.id(slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  // Check for overlaps with other slots (excluding the current one)
  const otherSlots = this.defaultSlots.filter((s) => !s._id.equals(slotId));
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
availabilityTemplateSchema.methods.toggleSlot = function (slotId, userId) {
  const slot = this.defaultSlots.id(slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }

  slot.isActive = !slot.isActive;
  this.updatedBy = userId;
  this.version += 1;

  return this.save();
};

// Static method to get or create template
availabilityTemplateSchema.statics.getTemplate = async function () {
  let template = await this.findById("availability_template").populate(
    "updatedBy",
    "name email"
  );

  if (!template) {
    // Create default template with 8 AM to 6 PM hourly slots
    const defaultSlots = [];
    for (let hour = 8; hour < 18; hour++) {
      defaultSlots.push({
        startTime: `${hour.toString().padStart(2, "0")}:00`,
        endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
        isActive: true,
        maxBookings: 1,
      });
    }

    template = await this.create({
      _id: "availability_template",
      defaultSlots,
      workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      slotDuration: 60,
      updatedBy: null, // Will be set when first updated
    });
  }

  return template;
};

// Static method to generate default 8 AM to 6 PM slots
availabilityTemplateSchema.statics.generateDefaultSlots = function () {
  const slots = [];
  for (let hour = 8; hour < 18; hour++) {
    slots.push({
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
      isActive: true,
      maxBookings: 1,
    });
  }
  return slots;
};

// Method to check if a date is a working day
availabilityTemplateSchema.methods.isWorkingDay = function (date) {
  const dayOfWeek = date.getDay();
  return this.workingDays.includes(dayOfWeek);
};

// Pre-save middleware for validation
availabilityTemplateSchema.pre("save", function (next) {
  try {
    // Ensure at least one active slot exists
    const activeSlots = this.defaultSlots.filter((slot) => slot.isActive);
    if (activeSlots.length === 0) {
      throw new Error("At least one active slot must be defined");
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

const AvailabilityTemplate = mongoose.model(
  "AvailabilityTemplate",
  availabilityTemplateSchema
);

export default AvailabilityTemplate;
