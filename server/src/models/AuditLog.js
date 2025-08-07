import mongoose from "mongoose";

/**
 * Audit Log Schema for Admin Actions
 * Tracks all administrative actions with timestamps and change tracking
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Admin user who performed the action
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Action performed
    action: {
      type: String,
      required: true,
      enum: [
        "create",
        "update",
        "delete",
        "view",
        "cancel",
        "reschedule",
        "extend_subscription",
        "change_plan",
        "cancel_subscription",
        "bulk_operation",
        "login",
        "logout",
      ],
    },

    // Resource that was acted upon
    resource: {
      type: String,
      required: true,
      enum: [
        "user",
        "users",
        "appointment",
        "appointments",
        "availability",
        "subscription",
        "settings",
        "system",
      ],
    },

    // ID of the resource that was acted upon
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Not required for list operations
      default: null,
    },

    // Change tracking - before and after values
    changes: {
      before: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      after: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    // Request metadata
    metadata: {
      ipAddress: {
        type: String,
        required: true,
      },
      userAgent: String,
      sessionId: String,
      endpoint: String,
      method: String,
    },

    // Additional context
    description: String,
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: String,
  },
  {
    timestamps: true,
    // Prevent modification of audit logs
    strict: true,
  }
);

// Indexes for efficient querying
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// Prevent updates to audit logs for data integrity
auditLogSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate"],
  function () {
    throw new Error("Audit logs cannot be modified");
  }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
