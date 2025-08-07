import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const customTemplateSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => uuidv4(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    timeSlots: [
      {
        _id: {
          type: String,
          default: () => uuidv4(),
        },
        startTime: {
          type: String,
          required: true,
          match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        endTime: {
          type: String,
          required: true,
          match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
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
        },
      },
    ],
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      validate: {
        validator: function (days) {
          return (
            Array.isArray(days) &&
            days.every((day) => day >= 0 && day <= 6) &&
            days.length > 0
          );
        },
        message: "Working days must be an array of numbers between 0-6 (Sunday-Saturday)",
      },
    },
    slotDuration: {
      type: Number,
      default: 60,
      min: 15,
      max: 240,
    },
    applicableDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        isRecurring: {
          type: Boolean,
          default: false,
        },
        recurringPattern: {
          type: String,
          enum: ["daily", "weekly", "monthly", "yearly"],
          default: null,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    version: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      default: null,
    },
    metadata: {
      createdFrom: {
        type: String,
        enum: ["manual", "import", "copy", "default"],
        default: "manual",
      },
      tags: [String],
      notes: String,
    },
  },
  {
    timestamps: true,
    collection: "custom_templates",
  }
);

// Indexes for better performance
customTemplateSchema.index({ createdBy: 1 });
customTemplateSchema.index({ isActive: 1 });
customTemplateSchema.index({ priority: -1 });
customTemplateSchema.index({ "applicableDates.date": 1 });
customTemplateSchema.index({ name: "text", description: "text" });

// Validation middleware
customTemplateSchema.pre("save", function (next) {
  // Validate time slots
  for (const slot of this.timeSlots) {
    const start = new Date(`1970-01-01T${slot.startTime}:00`);
    const end = new Date(`1970-01-01T${slot.endTime}:00`);
    
    if (start >= end) {
      return next(new Error(`Invalid time slot: ${slot.startTime} - ${slot.endTime}. Start time must be before end time.`));
    }
  }

  // Sort time slots by start time
  this.timeSlots.sort((a, b) => {
    const timeA = new Date(`1970-01-01T${a.startTime}:00`);
    const timeB = new Date(`1970-01-01T${b.startTime}:00`);
    return timeA - timeB;
  });

  // Check for overlapping time slots
  for (let i = 0; i < this.timeSlots.length - 1; i++) {
    const currentEnd = new Date(`1970-01-01T${this.timeSlots[i].endTime}:00`);
    const nextStart = new Date(`1970-01-01T${this.timeSlots[i + 1].startTime}:00`);
    
    if (currentEnd > nextStart) {
      return next(new Error(`Overlapping time slots detected: ${this.timeSlots[i].startTime}-${this.timeSlots[i].endTime} and ${this.timeSlots[i + 1].startTime}-${this.timeSlots[i + 1].endTime}`));
    }
  }

  // Increment version on update
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }

  next();
});

// Instance methods
customTemplateSchema.methods.getActiveSlots = function () {
  return this.timeSlots.filter((slot) => slot.isActive);
};

customTemplateSchema.methods.getSlotsForTime = function (startTime, endTime) {
  return this.timeSlots.filter((slot) => {
    const slotStart = new Date(`1970-01-01T${slot.startTime}:00`);
    const slotEnd = new Date(`1970-01-01T${slot.endTime}:00`);
    const queryStart = new Date(`1970-01-01T${startTime}:00`);
    const queryEnd = new Date(`1970-01-01T${endTime}:00`);
    
    return slotStart >= queryStart && slotEnd <= queryEnd;
  });
};

customTemplateSchema.methods.isApplicableForDate = function (date) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  
  // Check if it's a working day
  if (!this.workingDays.includes(dayOfWeek)) {
    return false;
  }

  // Check specific applicable dates
  return this.applicableDates.some((applicableDate) => {
    const appDate = new Date(applicableDate.date);
    
    if (applicableDate.isRecurring) {
      switch (applicableDate.recurringPattern) {
        case "daily":
          return true;
        case "weekly":
          return targetDate.getDay() === appDate.getDay();
        case "monthly":
          return targetDate.getDate() === appDate.getDate();
        case "yearly":
          return (
            targetDate.getMonth() === appDate.getMonth() &&
            targetDate.getDate() === appDate.getDate()
          );
        default:
          return false;
      }
    } else {
      // For non-recurring, check exact date match
      return (
        targetDate.getFullYear() === appDate.getFullYear() &&
        targetDate.getMonth() === appDate.getMonth() &&
        targetDate.getDate() === appDate.getDate()
      );
    }
  });
};

// Static methods
customTemplateSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    isActive: true,
    $or: [
      {
        "applicableDates.date": {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
      {
        "applicableDates.isRecurring": true,
      },
    ],
  }).sort({ priority: -1, name: 1 });
};

customTemplateSchema.statics.findApplicableForDate = function (date) {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  
  return this.find({
    isActive: true,
    workingDays: dayOfWeek,
    $or: [
      {
        "applicableDates.date": {
          $lte: targetDate,
        },
        "applicableDates.isRecurring": false,
      },
      {
        "applicableDates.isRecurring": true,
      },
    ],
  }).sort({ priority: -1 });
};

const CustomTemplate = mongoose.model("CustomTemplate", customTemplateSchema);

export default CustomTemplate;
