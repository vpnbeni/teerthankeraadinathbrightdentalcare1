import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import mongoose from "mongoose";
import cron from "node-cron";
import { config } from "../config/environment.js";
import { auditService } from "./auditService.js";
import { encryptionService } from "./encryptionService.js";
import logger from "../utils/logger.js";

const execAsync = promisify(exec);

/**
 * Backup Service for HIPAA Compliance
 * Handles automated backups and data recovery procedures
 */
class BackupService {
  constructor() {
    this.backupDir = path.join(process.cwd(), "backups");
    this.retentionDays = 90; // Keep backups for 90 days
    this.maxBackupSize = 1024 * 1024 * 1024; // 1GB max backup size

    this.ensureBackupDirectory();
    this.startAutomaticBackups();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info(`Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Create full database backup
   */
  async createFullBackup(userId = "system") {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `full-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      logger.info("Starting full database backup...");

      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // Extract database name from MongoDB URI
      const dbName = this.extractDatabaseName(config.MONGODB_URI);

      // Create mongodump command
      const dumpCommand = `mongodump --uri="${config.MONGODB_URI}" --out="${backupPath}"`;

      // Execute backup
      const { stdout, stderr } = await execAsync(dumpCommand);

      if (stderr && !stderr.includes("done dumping")) {
        throw new Error(`Backup failed: ${stderr}`);
      }

      // Compress backup
      const compressedPath = `${backupPath}.tar.gz`;
      const compressCommand = `tar -czf "${compressedPath}" -C "${this.backupDir}" "${backupName}"`;

      await execAsync(compressCommand);

      // Remove uncompressed directory
      await execAsync(`rm -rf "${backupPath}"`);

      // Get backup file size
      const stats = fs.statSync(compressedPath);
      const backupSize = stats.size;

      // Check backup size
      if (backupSize > this.maxBackupSize) {
        logger.warn(
          `Backup size (${this.formatBytes(
            backupSize
          )}) exceeds maximum allowed size`
        );
      }

      // Log backup creation
      await auditService.logAction({
        userId,
        userRole: userId === "system" ? "system" : "admin",
        action: "DATA_BACKUP",
        resourceType: "System",
        resourceId: "database",
        ipAddress: "localhost",
        description: `Full database backup created: ${backupName}`,
        hipaaCategory: "SYSTEM",
      });

      logger.info(
        `Full backup completed: ${compressedPath} (${this.formatBytes(
          backupSize
        )})`
      );

      return {
        success: true,
        backupPath: compressedPath,
        backupName,
        size: backupSize,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Full backup failed: ${error.message}`);

      // Log backup failure
      await auditService.logAction({
        userId,
        userRole: userId === "system" ? "system" : "admin",
        action: "DATA_BACKUP",
        resourceType: "System",
        resourceId: "database",
        ipAddress: "localhost",
        success: false,
        errorMessage: error.message,
        description: "Full database backup failed",
        hipaaCategory: "SYSTEM",
      });

      throw error;
    }
  }

  /**
   * Create incremental backup (collections that changed recently)
   */
  async createIncrementalBackup(sinceDate, userId = "system") {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `incremental-backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      logger.info("Starting incremental backup...");

      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // Collections to backup incrementally
      const collections = [
        "users",
        "appointments",
        "sessions",
        "payments",
        "auditlogs",
      ];

      const dbName = this.extractDatabaseName(config.MONGODB_URI);

      for (const collection of collections) {
        const query = JSON.stringify({
          $or: [
            { updatedAt: { $gte: sinceDate } },
            { createdAt: { $gte: sinceDate } },
          ],
        });

        const dumpCommand = `mongodump --uri="${config.MONGODB_URI}" --collection="${collection}" --query='${query}' --out="${backupPath}"`;

        try {
          await execAsync(dumpCommand);
        } catch (error) {
          logger.warn(
            `Failed to backup collection ${collection}: ${error.message}`
          );
        }
      }

      // Compress backup
      const compressedPath = `${backupPath}.tar.gz`;
      const compressCommand = `tar -czf "${compressedPath}" -C "${this.backupDir}" "${backupName}"`;

      await execAsync(compressCommand);

      // Remove uncompressed directory
      await execAsync(`rm -rf "${backupPath}"`);

      // Get backup file size
      const stats = fs.statSync(compressedPath);
      const backupSize = stats.size;

      // Log backup creation
      await auditService.logAction({
        userId,
        userRole: userId === "system" ? "system" : "admin",
        action: "DATA_BACKUP",
        resourceType: "System",
        resourceId: "database_incremental",
        ipAddress: "localhost",
        description: `Incremental backup created: ${backupName}`,
        hipaaCategory: "SYSTEM",
      });

      logger.info(
        `Incremental backup completed: ${compressedPath} (${this.formatBytes(
          backupSize
        )})`
      );

      return {
        success: true,
        backupPath: compressedPath,
        backupName,
        size: backupSize,
        timestamp: new Date(),
        sinceDate,
      };
    } catch (error) {
      logger.error(`Incremental backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupPath, userId) {
    try {
      logger.info("Starting database restore...");

      // Verify backup file exists
      if (!fs.existsSync(backupPath)) {
        throw new Error("Backup file not found");
      }

      // Extract backup
      const extractDir = path.join(this.backupDir, "restore-temp");
      const extractCommand = `tar -xzf "${backupPath}" -C "${this.backupDir}"`;

      await execAsync(extractCommand);

      // Find the extracted directory
      const extractedDirs = fs
        .readdirSync(this.backupDir)
        .filter(
          (dir) =>
            dir.startsWith("full-backup-") ||
            dir.startsWith("incremental-backup-")
        )
        .filter((dir) =>
          fs.statSync(path.join(this.backupDir, dir)).isDirectory()
        );

      if (extractedDirs.length === 0) {
        throw new Error("No valid backup directory found after extraction");
      }

      const backupDataDir = path.join(this.backupDir, extractedDirs[0]);
      const dbName = this.extractDatabaseName(config.MONGODB_URI);

      // Create mongorestore command
      const restoreCommand = `mongorestore --uri="${
        config.MONGODB_URI
      }" --drop "${path.join(backupDataDir, dbName)}"`;

      // Execute restore
      const { stdout, stderr } = await execAsync(restoreCommand);

      if (stderr && !stderr.includes("done")) {
        throw new Error(`Restore failed: ${stderr}`);
      }

      // Clean up extracted files
      await execAsync(`rm -rf "${backupDataDir}"`);

      // Log restore operation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DATA_BACKUP",
        resourceType: "System",
        resourceId: "database_restore",
        ipAddress: "localhost",
        description: `Database restored from backup: ${path.basename(
          backupPath
        )}`,
        hipaaCategory: "SYSTEM",
      });

      logger.info("Database restore completed successfully");

      return {
        success: true,
        restoredFrom: backupPath,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Database restore failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((file) => file.endsWith(".tar.gz"))
        .map((file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);

          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            type: file.includes("incremental") ? "incremental" : "full",
          };
        })
        .sort((a, b) => b.created - a.created);

      return files;
    } catch (error) {
      logger.error(`Error listing backups: ${error.message}`);
      return [];
    }
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanOldBackups() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      const backups = await this.listBackups();
      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          fs.unlinkSync(backup.path);
          deletedCount++;
          logger.info(`Deleted old backup: ${backup.name}`);
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned ${deletedCount} old backups`);
      }

      return deletedCount;
    } catch (error) {
      logger.error(`Error cleaning old backups: ${error.message}`);
      return 0;
    }
  }

  /**
   * Export user data (HIPAA right to access)
   */
  async exportUserData(userId, requestedBy) {
    try {
      logger.info(`Exporting data for user: ${userId}`);

      // Get user data
      const User = mongoose.model("User");
      const Appointment = mongoose.model("Appointment");
      const Session = mongoose.model("Session");
      const Payment = mongoose.model("Payment");

      const [user, appointments, sessions, payments] = await Promise.all([
        User.findById(userId).select("-passwordHash"),
        Appointment.find({ userId }),
        Session.find({ userId }),
        Payment.find({ userId }),
      ]);

      if (!user) {
        throw new Error("User not found");
      }

      // Decrypt sensitive data for export
      const userData = {
        personalInfo: {
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          gender: user.gender,
          alternativePhone: user.alternativePhone,
        },
        medicalInfo: encryptionService.decryptMedicalInfo(user.medicalInfo),
        subscription: user.subscription,
        appointments: appointments,
        sessions: sessions.map((session) => ({
          ...session.toObject(),
          examination: encryptionService.decryptExaminationData(
            session.examination
          ),
        })),
        payments: payments,
        documents: user.documents,
        exportDate: new Date(),
        exportedBy: requestedBy,
      };

      // Create export file
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const exportName = `user-data-export-${userId}-${timestamp}.json`;
      const exportPath = path.join(this.backupDir, exportName);

      fs.writeFileSync(exportPath, JSON.stringify(userData, null, 2));

      // Log data export
      await auditService.logAction({
        userId: requestedBy,
        userRole: "admin",
        action: "DATA_EXPORT",
        resourceType: "User",
        resourceId: userId,
        ipAddress: "localhost",
        patientId: userId,
        description: `User data exported for HIPAA compliance`,
        hipaaCategory: "PHI",
      });

      logger.info(`User data exported: ${exportPath}`);

      return {
        success: true,
        exportPath,
        exportName,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`User data export failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start automatic backup schedule using node-cron
   */
  startAutomaticBackups() {
    if (config.NODE_ENV === "production") {
      // Full backup every day at 2 AM
      cron.schedule("0 2 * * *", async () => {
        logger.info("Starting scheduled full backup...");
        try {
          await this.createFullBackup();
          logger.info("Scheduled full backup completed successfully");
        } catch (error) {
          logger.error(`Scheduled full backup failed: ${error.message}`);
        }
      });

      // Incremental backup every 6 hours
      cron.schedule("0 */6 * * *", async () => {
        logger.info("Starting scheduled incremental backup...");
        try {
          const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
          await this.createIncrementalBackup(sixHoursAgo);
          logger.info("Scheduled incremental backup completed successfully");
        } catch (error) {
          logger.error(`Scheduled incremental backup failed: ${error.message}`);
        }
      });

      // Cleanup old backups weekly on Sundays at 3 AM
      cron.schedule("0 3 * * 0", async () => {
        logger.info("Starting scheduled backup cleanup...");
        try {
          const deletedCount = await this.cleanOldBackups();
          logger.info(
            `Scheduled backup cleanup completed: ${deletedCount} backups removed`
          );
        } catch (error) {
          logger.error(`Scheduled backup cleanup failed: ${error.message}`);
        }
      });

      logger.info("Automatic backup schedule started with cron jobs");
    } else {
      logger.warn("Automatic backups disabled in development mode");
    }
  }

  /**
   * Extract database name from MongoDB URI
   */
  extractDatabaseName(uri) {
    const match = uri.match(/\/([^?]+)/);
    return match ? match[1] : "dental_clinic";
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();

      const stats = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        latestBackup: backups[0] || null,
        backupsByType: {
          full: backups.filter((b) => b.type === "full").length,
          incremental: backups.filter((b) => b.type === "incremental").length,
        },
        oldestBackup: backups[backups.length - 1] || null,
      };

      return stats;
    } catch (error) {
      logger.error(`Error getting backup stats: ${error.message}`);
      return null;
    }
  }
}

export const backupService = new BackupService();
