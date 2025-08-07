import mongoose from "mongoose";
import { config } from "../config/environment.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Audit Service for HIPAA Compliance
 * Handles logging of all healthcare data access and modifications
 */
class AuditService {
  /**
   * Log user action
   */
  async logAction({
    userId,
    userRole,
    action,
    resourceType,
    resourceId,
    ipAddress,
    userAgent,
    endpoint,
    method,
    oldValues = null,
    newValues = null,
    description = "",
    success = true,
    errorMessage = null,
    patientId = null,
    hipaaCategory = "SYSTEM",
  }) {
    try {
      // Map service fields to model fields
      const auditLog = new AuditLog({
        adminId: userId,
        action: action.toLowerCase(),
        resource: this.mapResourceType(resourceType),
        resourceId: mongoose.Types.ObjectId.isValid(resourceId)
          ? resourceId
          : new mongoose.Types.ObjectId(),
        changes: {
          before: oldValues,
          after: newValues,
        },
        metadata: {
          ipAddress,
          userAgent,
          endpoint,
          method,
        },
        description,
        success,
        errorMessage,
      });

      await auditLog.save();

      // Log to console in development
      if (config.NODE_ENV === "development") {
        console.log(
          `🔍 AUDIT: ${action} ${resourceType}:${resourceId} by ${userRole}:${userId}`
        );
      }

      return auditLog;
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    userId,
    action,
    ipAddress,
    userAgent,
    success = true,
    errorMessage = null,
    userRole = "user" // Add userRole parameter with default value
  ) {
    // Create a valid ObjectId for system operations or use provided userId
    let auditUserId;

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      auditUserId = userId;
    } else {
      // Create a system ObjectId for anonymous/failed operations
      auditUserId = new mongoose.Types.ObjectId();
    }

    return this.logAction({
      userId: auditUserId,
      userRole, // Use the provided userRole
      action,
      resourceType: "System",
      resourceId: auditUserId, // Use the userId as resourceId instead of "auth"
      ipAddress,
      userAgent,
      endpoint: "/auth",
      method: "POST",
      success,
      errorMessage,
      hipaaCategory: "SYSTEM",
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId,
    userRole,
    resourceType,
    resourceId,
    ipAddress,
    patientId = null
  ) {
    return this.logAction({
      userId,
      userRole,
      action: "READ",
      resourceType,
      resourceId,
      ipAddress,
      userAgent: "",
      patientId,
      hipaaCategory: this.getHipaaCategory(resourceType),
      description: `Accessed ${resourceType} data`,
    });
  }

  /**
   * Log data modification
   */
  async logDataModification(
    userId,
    userRole,
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    ipAddress,
    patientId = null
  ) {
    return this.logAction({
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent: "",
      oldValues,
      newValues,
      patientId,
      hipaaCategory: this.getHipaaCategory(resourceType),
      description: `${action} ${resourceType} data`,
    });
  }

  /**
   * Log medical record access
   */
  async logMedicalAccess(
    userId,
    userRole,
    patientId,
    action,
    details,
    ipAddress
  ) {
    return this.logAction({
      userId,
      userRole,
      action,
      resourceType: "MedicalRecord",
      resourceId: patientId.toString(),
      ipAddress,
      userAgent: "",
      patientId,
      hipaaCategory: "PHI",
      description: `Medical record ${action.toLowerCase()}: ${details}`,
    });
  }

  /**
   * Map resource type to model enum values
   */
  mapResourceType(resourceType) {
    const mapping = {
      User: "user",
      MedicalRecord: "user",
      Session: "appointment",
      Appointment: "appointment",
      Document: "user",
      Payment: "subscription",
      System: "system",
    };

    return mapping[resourceType] || "system";
  }

  /**
   * Get HIPAA category based on resource type
   */
  getHipaaCategory(resourceType) {
    const categories = {
      User: "PHI",
      Session: "PHI",
      MedicalRecord: "PHI",
      Document: "ePHI",
      Appointment: "PHI",
      Payment: "ADMINISTRATIVE",
      System: "SYSTEM",
    };

    return categories[resourceType] || "SYSTEM";
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId, options = {}) {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      action,
      resourceType,
    } = options;

    const query = { userId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "name phone role")
      .populate("patientId", "name phone");

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for a patient
   */
  async getPatientAuditLogs(patientId, options = {}) {
    const { page = 1, limit = 50, startDate, endDate, action } = options;

    const query = { patientId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "name phone role");

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get system audit logs (admin only)
   */
  async getSystemAuditLogs(options = {}) {
    const {
      page = 1,
      limit = 100,
      startDate,
      endDate,
      action,
      resourceType,
      userId,
    } = options;

    const query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "name phone role")
      .populate("patientId", "name phone");

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    const query = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const [
      totalActions,
      actionsByType,
      phiAccess,
      failedActions,
      userActivity,
    ] = await Promise.all([
      AuditLog.countDocuments(query),

      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      AuditLog.countDocuments({
        ...query,
        hipaaCategory: { $in: ["PHI", "ePHI"] },
      }),

      AuditLog.countDocuments({
        ...query,
        success: false,
      }),

      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
      ]),
    ]);

    return {
      period: { startDate, endDate },
      summary: {
        totalActions,
        phiAccess,
        failedActions,
        successRate: (
          ((totalActions - failedActions) / totalActions) *
          100
        ).toFixed(2),
      },
      actionsByType,
      topUsers: userActivity,
    };
  }

  /**
   * Clean old audit logs (retention policy)
   */
  async cleanOldLogs(retentionDays = 2555) {
    // 7 years default for HIPAA
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    console.log(`🗑️ Cleaned ${result.deletedCount} old audit logs`);
    return result;
  }
}

export const auditService = new AuditService();
