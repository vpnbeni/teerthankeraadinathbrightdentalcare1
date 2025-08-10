import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "new_booking",
      "appointment_cancellation",
      "appointment_reschedule",
      "subscription_change",
      "subscription_extension",
      "subscription_cancellation",
      "payment_received",
      "system_alert",
      "user_registration",
    ],
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  email: {
    type: Boolean,
    default: true,
  },
  sms: {
    type: Boolean,
    default: false,
  },
  inApp: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
  },
  customRecipients: [
    {
      email: {
        type: String,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      name: String,
      role: String,
    },
  ],
  schedule: {
    enabled: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      default: "09:00",
    },
    endTime: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      default: "18:00",
    },
    days: [
      {
        type: Number,
        min: 0,
        max: 6, // 0 = Sunday, 6 = Saturday
      },
    ],
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
  },
  template: {
    subject: String,
    customMessage: String,
  },
});

const adminNotificationPreferencesSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    globalSettings: {
      enabled: {
        type: Boolean,
        default: true,
      },
      defaultEmail: {
        type: String,
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        default: "support@teerthankeraadinathbrightdentalcare.in",
      },
      fallbackEmail: {
        type: String,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      batchNotifications: {
        enabled: {
          type: Boolean,
          default: false,
        },
        interval: {
          type: Number,
          default: 60, // minutes
        },
        maxBatchSize: {
          type: Number,
          default: 10,
        },
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: true,
        },
        startTime: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          default: "22:00",
        },
        endTime: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          default: "08:00",
        },
      },
    },
    preferences: [notificationPreferenceSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries (adminId already has unique index from field definition)
adminNotificationPreferencesSchema.index({ "preferences.type": 1 });

// Static method to get preferences for admin
adminNotificationPreferencesSchema.statics.getPreferences = async function (
  adminId
) {
  let preferences = await this.findOne({ adminId }).populate(
    "adminId",
    "name email"
  );

  if (!preferences) {
    // Create default preferences
    preferences = await this.createDefaultPreferences(adminId);
  }

  return preferences;
};

// Static method to create default preferences
adminNotificationPreferencesSchema.statics.createDefaultPreferences =
  async function (adminId) {
    const defaultPreferences = [
      { type: "new_booking", priority: "high" },
      { type: "appointment_cancellation", priority: "normal" },
      { type: "appointment_reschedule", priority: "normal" },
      { type: "subscription_change", priority: "normal" },
      { type: "subscription_extension", priority: "low" },
      { type: "subscription_cancellation", priority: "high" },
      { type: "payment_received", priority: "low" },
      { type: "system_alert", priority: "urgent" },
      { type: "user_registration", priority: "low" },
    ];

    const preferences = new this({
      adminId,
      preferences: defaultPreferences,
    });

    return await preferences.save();
  };

// Method to get preference for specific notification type
adminNotificationPreferencesSchema.methods.getPreferenceForType = function (
  notificationType
) {
  const preference = this.preferences.find((p) => p.type === notificationType);

  if (!preference) {
    // Return default preference
    return {
      type: notificationType,
      enabled: true,
      email: true,
      sms: false,
      inApp: true,
      priority: "normal",
    };
  }

  return preference;
};

// Method to check if notifications should be sent based on schedule
adminNotificationPreferencesSchema.methods.shouldSendNotification = function (
  notificationType
) {
  if (!this.globalSettings.enabled) {
    return false;
  }

  const preference = this.getPreferenceForType(notificationType);

  if (!preference.enabled) {
    return false;
  }

  // Check quiet hours
  if (this.globalSettings.quietHours.enabled) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const startTime = this.globalSettings.quietHours.startTime;
    const endTime = this.globalSettings.quietHours.endTime;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      if (currentTime >= startTime || currentTime <= endTime) {
        // Only send urgent notifications during quiet hours
        return preference.priority === "urgent";
      }
    } else {
      // Same day quiet hours
      if (currentTime >= startTime && currentTime <= endTime) {
        return preference.priority === "urgent";
      }
    }
  }

  // Check schedule if enabled
  if (preference.schedule && preference.schedule.enabled) {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    // Check if current day is in allowed days
    if (
      preference.schedule.days.length > 0 &&
      !preference.schedule.days.includes(currentDay)
    ) {
      return false;
    }

    // Check if current time is within allowed hours
    if (
      currentTime < preference.schedule.startTime ||
      currentTime > preference.schedule.endTime
    ) {
      return false;
    }
  }

  return true;
};

// Method to get notification recipients
adminNotificationPreferencesSchema.methods.getNotificationRecipients =
  function (notificationType) {
    const preference = this.getPreferenceForType(notificationType);
    const recipients = [];

    // Add default admin email
    if (preference.email && this.globalSettings.defaultEmail) {
      recipients.push({
        email: this.globalSettings.defaultEmail,
        name: "Admin",
        type: "primary",
      });
    }

    // Add custom recipients
    if (preference.customRecipients && preference.customRecipients.length > 0) {
      preference.customRecipients.forEach((recipient) => {
        recipients.push({
          email: recipient.email,
          name: recipient.name || "Admin",
          type: "custom",
          role: recipient.role,
        });
      });
    }

    // Add fallback email if primary fails
    if (
      this.globalSettings.fallbackEmail &&
      this.globalSettings.fallbackEmail !== this.globalSettings.defaultEmail
    ) {
      recipients.push({
        email: this.globalSettings.fallbackEmail,
        name: "Admin Fallback",
        type: "fallback",
      });
    }

    return recipients;
  };

const AdminNotificationPreferences = mongoose.model(
  "AdminNotificationPreferences",
  adminNotificationPreferencesSchema
);

export default AdminNotificationPreferences;
