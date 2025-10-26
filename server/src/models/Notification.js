import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "appointment_created",
        "new_appointment",
        "appointment_confirmed",
        "appointment_cancelled",
        "appointment_reminder",
        "appointment_rescheduled",
        "appointment_completed",
        "payment_success",
        "payment_failed",
        "subscription_expiring",
        "subscription_expired",
        "system_announcement",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
      // Additional data specific to notification type
      additionalData: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.read = true;
  return await this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
