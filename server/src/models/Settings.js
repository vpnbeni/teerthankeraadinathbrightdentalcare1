import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  textContent: {
    type: String,
    required: true,
  },
  variables: [
    {
      name: String,
      description: String,
      required: Boolean,
    },
  ],
});

const businessRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: String,
  category: {
    type: String,
    enum: ["booking", "cancellation", "payment", "notification", "general"],
    required: true,
  },
});

const timeSlotDefaultSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6, // 0 = Sunday, 6 = Saturday
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  breakTimes: [
    {
      startTime: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      endTime: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      description: String,
    },
  ],
  slotDuration: {
    type: Number,
    default: 60, // minutes
  },
  maxBookingsPerSlot: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const settingsSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["email-templates", "business-rules", "time-slots", "general"],
      index: true,
    },
    key: {
      type: String,
      required: true,
      index: true,
    },
    emailTemplates: {
      type: Map,
      of: emailTemplateSchema,
    },
    businessRules: {
      type: Map,
      of: businessRuleSchema,
    },
    timeSlotDefaults: [timeSlotDefaultSchema],
    generalSettings: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for category and key
settingsSchema.index({ category: 1, key: 1 }, { unique: true });

// Static method to get settings by category
settingsSchema.statics.getByCategory = async function (category) {
  return await this.find({ category }).sort({ key: 1 });
};

// Static method to get specific setting
settingsSchema.statics.getSetting = async function (category, key) {
  return await this.findOne({ category, key });
};

// Static method to update or create setting
settingsSchema.statics.updateSetting = async function (
  category,
  key,
  data,
  userId
) {
  return await this.findOneAndUpdate(
    { category, key },
    {
      ...data,
      lastModifiedBy: userId,
      $inc: { version: 1 },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

// Method to validate email template variables
settingsSchema.methods.validateEmailTemplate = function (templateName) {
  if (!this.emailTemplates || !this.emailTemplates.get(templateName)) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const template = this.emailTemplates.get(templateName);
  const requiredVars = template.variables.filter((v) => v.required);

  return {
    isValid: true,
    requiredVariables: requiredVars.map((v) => v.name),
    template: template,
  };
};

// Method to validate business rule
settingsSchema.methods.validateBusinessRule = function (ruleName) {
  if (!this.businessRules || !this.businessRules.get(ruleName)) {
    throw new Error(`Business rule '${ruleName}' not found`);
  }

  const rule = this.businessRules.get(ruleName);
  return {
    isValid: true,
    rule: rule,
  };
};

// Method to validate time slot configuration
settingsSchema.methods.validateTimeSlots = function () {
  if (!this.timeSlotDefaults || this.timeSlotDefaults.length === 0) {
    return { isValid: false, errors: ["No time slot defaults configured"] };
  }

  const errors = [];

  this.timeSlotDefaults.forEach((slot, index) => {
    // Validate time format and logic
    const startTime = new Date(`1970-01-01T${slot.startTime}:00`);
    const endTime = new Date(`1970-01-01T${slot.endTime}:00`);

    if (startTime >= endTime) {
      errors.push(`Slot ${index + 1}: Start time must be before end time`);
    }

    // Validate break times
    slot.breakTimes.forEach((breakTime, breakIndex) => {
      const breakStart = new Date(`1970-01-01T${breakTime.startTime}:00`);
      const breakEnd = new Date(`1970-01-01T${breakTime.endTime}:00`);

      if (breakStart >= breakEnd) {
        errors.push(
          `Slot ${index + 1}, Break ${
            breakIndex + 1
          }: Break start time must be before break end time`
        );
      }

      if (breakStart < startTime || breakEnd > endTime) {
        errors.push(
          `Slot ${index + 1}, Break ${
            breakIndex + 1
          }: Break time must be within slot time range`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
};

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
