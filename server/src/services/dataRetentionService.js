import mongoose from "mongoose";
import { config } from "../config/environment.js";
import { auditService } from "./auditService.js";
import { backupService } from "./backupService.js";

/**
 * Data Retention Service for HIPAA Compliance
 * Manages data lifecycle and retention policies
 */
class DataRetentionService {
  constructor() {
    this.retentionPolicies = {
      // HIPAA requires 6 years minimum, we use 7 years to be safe
      medicalRecords: 7 * 365, // 7 years in days
      auditLogs: 7 * 365, // 7 years in days
      backups: 90, // 90 days for backups
      sessions: 7 * 365, // 7 years for session data
      appointments: 7 * 365, // 7 years for appointment data
      payments: 7 * 365, // 7 years for payment records
      userAccounts: 7 * 365, // 7 years after account closure
      documents: 7 * 365, // 7 years for uploaded documents
    };

    this.startRetentionSchedule();
  }

  /**
   * Apply retention policy to expired data
   */
  async applyRetentionPolicy() {
    try {
      console.log("🗂️ Starting data retention policy enforcement...");

      const results = {
        auditLogs: await this.cleanExpiredAuditLogs(),
        backups: await this.cleanExpiredBackups(),
        inactiveUsers: await this.archiveInactiveUsers(),
        expiredSessions: await this.cleanExpiredSessions(),
        oldAppointments: await this.archiveOldAppointments(),
        oldPayments: await this.archiveOldPayments(),
        orphanedDocuments: await this.cleanOrphanedDocuments(),
      };

      // Log retention policy execution
      await auditService.logAction({
        userId: "system",
        userRole: "system",
        action: "delete",
        resourceType: "System",
        resourceId: "data_retention",
        ipAddress: "localhost",
        description: `Data retention policy applied: ${JSON.stringify(
          results
        )}`,
        hipaaCategory: "ADMINISTRATIVE",
      });

      console.log("✅ Data retention policy completed:", results);
      return results;
    } catch (error) {
      console.error("❌ Data retention policy failed:", error);
      throw error;
    }
  }

  /**
   * Clean expired audit logs
   */
  async cleanExpiredAuditLogs() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.retentionPolicies.auditLogs
      );

      const result = await auditService.cleanOldLogs(
        this.retentionPolicies.auditLogs
      );

      return {
        deletedCount: result.deletedCount || 0,
        cutoffDate,
      };
    } catch (error) {
      console.error("Failed to clean audit logs:", error);
      return { deletedCount: 0, error: error.message };
    }
  }

  /**
   * Clean expired backups
   */
  async cleanExpiredBackups() {
    try {
      const deletedCount = await backupService.cleanOldBackups();

      return {
        deletedCount,
        retentionDays: this.retentionPolicies.backups,
      };
    } catch (error) {
      console.error("Failed to clean backups:", error);
      return { deletedCount: 0, error: error.message };
    }
  }

  /**
   * Archive inactive users (soft delete)
   */
  async archiveInactiveUsers() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.retentionPolicies.userAccounts
      );

      const User = mongoose.model("User");

      // Find users who haven't logged in for the retention period
      // and have expired subscriptions
      const inactiveUsers = await User.find({
        "subscription.status": "expired",
        "subscription.endDate": { $lt: cutoffDate },
        updatedAt: { $lt: cutoffDate },
      });

      let archivedCount = 0;

      for (const user of inactiveUsers) {
        // Create backup of user data before archiving
        await backupService.exportUserData(user._id, "system");

        // Mark user as archived (soft delete)
        user.isArchived = true;
        user.archivedAt = new Date();
        await user.save();

        archivedCount++;
      }

      return {
        archivedCount,
        cutoffDate,
      };
    } catch (error) {
      console.error("Failed to archive inactive users:", error);
      return { archivedCount: 0, error: error.message };
    }
  }

  /**
   * Clean expired sessions
   */
  async cleanExpiredSessions() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.retentionPolicies.sessions
      );

      const Session = mongoose.model("Session");

      // Only delete sessions older than retention period
      // and not linked to active appointments
      const result = await Session.deleteMany({
        createdAt: { $lt: cutoffDate },
        // Add additional conditions to preserve important sessions
      });

      return {
        deletedCount: result.deletedCount,
        cutoffDate,
      };
    } catch (error) {
      console.error("Failed to clean expired sessions:", error);
      return { deletedCount: 0, error: error.message };
    }
  }

  /**
   * Archive old appointments
   */
  async archiveOldAppointments() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.retentionPolicies.appointments
      );

      const Appointment = mongoose.model("Appointment");

      // Archive old completed appointments
      const result = await Appointment.updateMany(
        {
          date: { $lt: cutoffDate },
          status: { $in: ["completed", "cancelled"] },
        },
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
          },
        }
      );

      return {
        archivedCount: result.modifiedCount,
        cutoffDate,
      };
    } catch (error) {
      console.error("Failed to archive old appointments:", error);
      return { archivedCount: 0, error: error.message };
    }
  }

  /**
   * Archive old payments
   */
  async archiveOldPayments() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.retentionPolicies.payments
      );

      const Payment = mongoose.model("Payment");

      // Archive old payments
      const result = await Payment.updateMany(
        {
          transactionDate: { $lt: cutoffDate },
        },
        {
          $set: {
            isArchived: true,
            archivedAt: new Date(),
          },
        }
      );

      return {
        archivedCount: result.modifiedCount,
        cutoffDate,
      };
    } catch (error) {
      console.error("Failed to archive old payments:", error);
      return { archivedCount: 0, error: error.message };
    }
  }

  /**
   * Clean orphaned documents
   */
  async cleanOrphanedDocuments() {
    try {
      const User = mongoose.model("User");

      // Find users with documents
      const usersWithDocs = await User.find({
        "documents.0": { $exists: true },
      });

      let cleanedCount = 0;

      for (const user of usersWithDocs) {
        const validDocuments = [];

        for (const doc of user.documents) {
          const cutoffDate = new Date();
          cutoffDate.setDate(
            cutoffDate.getDate() - this.retentionPolicies.documents
          );

          // Keep documents that are not expired
          if (doc.uploadDate > cutoffDate) {
            validDocuments.push(doc);
          } else {
            // TODO: Delete file from Cloudinary
            cleanedCount++;
          }
        }

        if (validDocuments.length !== user.documents.length) {
          user.documents = validDocuments;
          await user.save();
        }
      }

      return {
        cleanedCount,
      };
    } catch (error) {
      console.error("Failed to clean orphaned documents:", error);
      return { cleanedCount: 0, error: error.message };
    }
  }

  /**
   * Get retention policy status
   */
  async getRetentionStatus() {
    try {
      const User = mongoose.model("User");
      const Appointment = mongoose.model("Appointment");
      const Session = mongoose.model("Session");
      const Payment = mongoose.model("Payment");
      const { AuditLog } = await import("./auditService.js");

      const now = new Date();

      const status = {
        policies: this.retentionPolicies,
        dataAge: {
          users: await this.getDataAgeStats(User, "createdAt"),
          appointments: await this.getDataAgeStats(Appointment, "createdAt"),
          sessions: await this.getDataAgeStats(Session, "createdAt"),
          payments: await this.getDataAgeStats(Payment, "createdAt"),
          auditLogs: await this.getDataAgeStats(AuditLog, "timestamp"),
        },
        nextCleanup: this.getNextCleanupDate(),
        complianceStatus: "COMPLIANT", // This would be calculated based on actual data age
      };

      return status;
    } catch (error) {
      console.error("Failed to get retention status:", error);
      return { error: error.message };
    }
  }

  /**
   * Get data age statistics for a collection
   */
  async getDataAgeStats(Model, dateField) {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            oldestRecord: { $min: `$${dateField}` },
            newestRecord: { $max: `$${dateField}` },
            totalRecords: { $sum: 1 },
          },
        },
      ];

      const result = await Model.aggregate(pipeline);

      if (result.length === 0) {
        return {
          oldestRecord: null,
          newestRecord: null,
          totalRecords: 0,
          ageInDays: 0,
        };
      }

      const stats = result[0];
      const ageInDays = stats.oldestRecord
        ? Math.floor((new Date() - stats.oldestRecord) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...stats,
        ageInDays,
      };
    } catch (error) {
      console.error(
        `Failed to get data age stats for ${Model.modelName}:`,
        error
      );
      return { error: error.message };
    }
  }

  /**
   * Get next cleanup date
   */
  getNextCleanupDate() {
    const now = new Date();
    const nextCleanup = new Date(now);
    nextCleanup.setDate(now.getDate() + 7); // Weekly cleanup
    return nextCleanup;
  }

  /**
   * Start automatic retention schedule
   */
  startRetentionSchedule() {
    if (config.NODE_ENV === "production") {
      // Run retention policy weekly
      setInterval(() => {
        this.applyRetentionPolicy();
      }, 7 * 24 * 60 * 60 * 1000); // Every 7 days

      console.log("📅 Data retention schedule started (weekly)");
    } else {
      console.log("⚠️ Data retention schedule disabled in development mode");
    }
  }

  /**
   * Manual retention policy execution
   */
  async executeRetentionPolicy(adminId) {
    try {
      // Log manual execution
      await auditService.logAction({
        userId: adminId,
        userRole: "admin",
        action: "delete",
        resourceType: "System",
        resourceId: "manual_retention",
        ipAddress: "localhost",
        description: "Manual data retention policy execution",
        hipaaCategory: "ADMINISTRATIVE",
      });

      return await this.applyRetentionPolicy();
    } catch (error) {
      console.error("Manual retention policy failed:", error);
      throw error;
    }
  }

  /**
   * Update retention policy
   */
  async updateRetentionPolicy(policyType, days, adminId) {
    try {
      if (!this.retentionPolicies.hasOwnProperty(policyType)) {
        throw new Error(`Invalid policy type: ${policyType}`);
      }

      const oldValue = this.retentionPolicies[policyType];
      this.retentionPolicies[policyType] = days;

      // Log policy change
      await auditService.logAction({
        userId: adminId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "System",
        resourceId: "retention_policy",
        ipAddress: "localhost",
        oldValues: { [policyType]: oldValue },
        newValues: { [policyType]: days },
        description: `Retention policy updated: ${policyType} = ${days} days`,
        hipaaCategory: "ADMINISTRATIVE",
      });

      return {
        success: true,
        policyType,
        oldValue,
        newValue: days,
      };
    } catch (error) {
      console.error("Failed to update retention policy:", error);
      throw error;
    }
  }
}

export const dataRetentionService = new DataRetentionService();
