import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Holiday date is required"],
    },
    reason: {
      type: String,
      required: [true, "Holiday reason is required"],
      trim: true,
      maxlength: [200, "Holiday reason cannot exceed 200 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["public_holiday", "clinic_closed", "doctor_unavailable", "maintenance"],
        message: "Holiday type must be public_holiday, clinic_closed, doctor_unavailable, or maintenance",
      },
      default: "public_holiday",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: {
        values: ["yearly", "monthly", "weekly"],
        message: "Recurring pattern must be yearly, monthly, or weekly"
      },
      required: function() {
        return this.isRecurring;
      },
      validate: {
        validator: function(value) {
          // Allow undefined/null when not recurring
          if (!this.isRecurring) {
            return value === undefined || value === null;
          }
          // Require valid enum value when recurring
          return ["yearly", "monthly", "weekly"].includes(value);
        },
        message: "Recurring pattern is required when holiday is recurring and must be yearly, monthly, or weekly"
      }
    },
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
holidaySchema.index({ date: 1, isActive: 1 });
holidaySchema.index({ type: 1 });
holidaySchema.index({ isRecurring: 1 });

// Ensure no duplicate holidays for the same date
holidaySchema.index({ date: 1 }, { unique: true });

// Static method to check if a date is a holiday
holidaySchema.statics.isHoliday = async function (date) {
  const holiday = await this.findOne({
    date: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    },
    isActive: true,
  });
  
  return holiday;
};

// Static method to get holidays in a date range
holidaySchema.statics.getHolidaysInRange = function (startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
    isActive: true,
  }).sort({ date: 1 });
};

// Static method to get all active holidays
holidaySchema.statics.getActiveHolidays = function () {
  return this.find({ isActive: true }).sort({ date: 1 });
};

// Static method to get holidays by type
holidaySchema.statics.getHolidaysByType = function (type) {
  return this.find({ type, isActive: true }).sort({ date: 1 });
};

// Instance method to check if holiday affects a specific date
holidaySchema.methods.affectsDate = function (checkDate) {
  const holidayDate = new Date(this.date);
  const targetDate = new Date(checkDate);
  
  // For non-recurring holidays, simple date comparison
  if (!this.isRecurring) {
    return holidayDate.toDateString() === targetDate.toDateString();
  }
  
  // For recurring holidays, check pattern
  switch (this.recurringPattern) {
    case "yearly":
      return (
        holidayDate.getMonth() === targetDate.getMonth() &&
        holidayDate.getDate() === targetDate.getDate()
      );
    case "monthly":
      return holidayDate.getDate() === targetDate.getDate();
    case "weekly":
      return holidayDate.getDay() === targetDate.getDay();
    default:
      return false;
  }
};

// Pre-save middleware to validate date
holidaySchema.pre("save", function (next) {
  // Normalize date to start of day
  if (this.date) {
    this.date = new Date(this.date);
    this.date.setHours(0, 0, 0, 0);
  }
  
  // Validate recurring pattern is set when isRecurring is true
  if (this.isRecurring && !this.recurringPattern) {
    return next(new Error("Recurring pattern is required for recurring holidays"));
  }
  
  // Clear recurring pattern when isRecurring is false
  if (!this.isRecurring) {
    this.recurringPattern = undefined;
  }
  
  next();
});

// Virtual to get formatted date
holidaySchema.virtual("formattedDate").get(function () {
  return this.date ? this.date.toLocaleDateString() : "";
});

// Virtual to check if holiday is in the past
holidaySchema.virtual("isPast").get(function () {
  if (!this.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.date < today;
});

// Virtual to check if holiday is today
holidaySchema.virtual("isToday").get(function () {
  if (!this.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.date.getTime() === today.getTime();
});

// Virtual to check if holiday is upcoming
holidaySchema.virtual("isUpcoming").get(function () {
  if (!this.date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return this.date > today;
});

// Ensure virtual fields are serialized
holidaySchema.set("toJSON", {
  virtuals: true,
});

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;