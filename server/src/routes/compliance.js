import express from "express";
import { auth } from "../middleware/auth.js";
import { auditAdminAction } from "../middleware/auditMiddleware.js";
import { complianceService } from "../services/complianceService.js";
import { auditService } from "../services/auditService.js";
import { backupService } from "../services/backupService.js";
import { sessionService } from "../services/sessionService.js";

const router = express.Router();

router.use(auth); // All routes require authentication

/**
 * @route   GET /api/compliance/status
 * @desc    Get HIPAA compliance status
 * @access  Admin only
 */
router.get("/status", auth, auditAdminAction, async (req, res) => {
  try {
    const status = complianceService.getComplianceStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get compliance status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get compliance status",
    });
  }
});

/**
 * @route   POST /api/compliance/report
 * @desc    Generate compliance report
 * @access  Admin only
 */
router.post("/report", auth, auditAdminAction, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const report = await complianceService.generateComplianceReport(
      startDate,
      endDate,
      req.user._id
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Generate compliance report error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate compliance report",
    });
  }
});

/**
 * @route   POST /api/compliance/security-scan
 * @desc    Perform security scan
 * @access  Admin only
 */
router.post("/security-scan", auth, auditAdminAction, async (req, res) => {
  try {
    const scanResults = await complianceService.performSecurityScan(
      req.user._id
    );

    res.json({
      success: true,
      data: scanResults,
    });
  } catch (error) {
    console.error("Security scan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform security scan",
    });
  }
});

/**
 * @route   GET /api/compliance/audit-logs
 * @desc    Get audit logs with filtering
 * @access  Admin only
 */
router.get("/audit-logs", auth, auditAdminAction, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      action,
      resourceType,
      userId,
    } = req.query;

    const logs = await auditService.getSystemAuditLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      action,
      resourceType,
      userId,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get audit logs",
    });
  }
});

/**
 * @route   GET /api/compliance/audit-logs/user/:userId
 * @desc    Get audit logs for specific user
 * @access  Admin only
 */
router.get(
  "/audit-logs/user/:userId",
  auth,
  auditAdminAction,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        action,
        resourceType,
      } = req.query;

      const logs = await auditService.getUserAuditLogs(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate,
        action,
        resourceType,
      });

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error("Get user audit logs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user audit logs",
      });
    }
  }
);

/**
 * @route   GET /api/compliance/audit-logs/patient/:patientId
 * @desc    Get audit logs for specific patient
 * @access  Admin only
 */
router.get(
  "/audit-logs/patient/:patientId",
  auth,
  auditAdminAction,
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 50, startDate, endDate, action } = req.query;

      const logs = await auditService.getPatientAuditLogs(patientId, {
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate,
        action,
      });

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error("Get patient audit logs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get patient audit logs",
      });
    }
  }
);

/**
 * @route   POST /api/compliance/backup/create
 * @desc    Create database backup
 * @access  Admin only
 */
router.post("/backup/create", auth, auditAdminAction, async (req, res) => {
  try {
    const { type = "full" } = req.body;

    let result;
    if (type === "incremental") {
      const { sinceDate } = req.body;
      if (!sinceDate) {
        return res.status(400).json({
          success: false,
          message: "Since date is required for incremental backup",
        });
      }
      result = await backupService.createIncrementalBackup(
        new Date(sinceDate),
        req.user._id
      );
    } else {
      result = await backupService.createFullBackup(req.user._id);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Create backup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
    });
  }
});

/**
 * @route   GET /api/compliance/backup/list
 * @desc    List available backups
 * @access  Admin only
 */
router.get("/backup/list", auth, auditAdminAction, async (req, res) => {
  try {
    const backups = await backupService.listBackups();

    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error("List backups error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list backups",
    });
  }
});

/**
 * @route   POST /api/compliance/backup/restore
 * @desc    Restore database from backup
 * @access  Admin only
 */
router.post("/backup/restore", auth, auditAdminAction, async (req, res) => {
  try {
    const { backupPath } = req.body;

    if (!backupPath) {
      return res.status(400).json({
        success: false,
        message: "Backup path is required",
      });
    }

    const result = await backupService.restoreFromBackup(
      backupPath,
      req.user._id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Restore backup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore backup",
    });
  }
});

/**
 * @route   GET /api/compliance/backup/stats
 * @desc    Get backup statistics
 * @access  Admin only
 */
router.get("/backup/stats", auth, auditAdminAction, async (req, res) => {
  try {
    const stats = await backupService.getBackupStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get backup stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get backup statistics",
    });
  }
});

/**
 * @route   POST /api/compliance/export-user-data/:userId
 * @desc    Export user data for HIPAA compliance
 * @access  Admin only
 */
router.post(
  "/export-user-data/:userId",
  auth,
  auditAdminAction,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await backupService.exportUserData(userId, req.user._id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Export user data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export user data",
      });
    }
  }
);

/**
 * @route   GET /api/compliance/sessions/active
 * @desc    Get active sessions
 * @access  Admin only
 */
router.get("/sessions/active", auth, auditAdminAction, async (req, res) => {
  try {
    const stats = await sessionService.getSessionStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active sessions",
    });
  }
});

/**
 * @route   POST /api/compliance/sessions/force-logout/:userId
 * @desc    Force logout user from all devices
 * @access  Admin only
 */
router.post(
  "/sessions/force-logout/:userId",
  auth,
  auditAdminAction,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason = "Admin action" } = req.body;

      const sessionsTerminated = await sessionService.forceLogoutUser(
        userId,
        req.user._id,
        reason
      );

      res.json({
        success: true,
        data: {
          sessionsTerminated,
          message: `User logged out from ${sessionsTerminated} sessions`,
        },
      });
    } catch (error) {
      console.error("Force logout error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to force logout user",
      });
    }
  }
);

/**
 * @route   DELETE /api/compliance/audit-logs/cleanup
 * @desc    Clean old audit logs (retention policy)
 * @access  Admin only
 */
router.delete(
  "/audit-logs/cleanup",
  auth,
  auditAdminAction,
  async (req, res) => {
    try {
      const { retentionDays = 2555 } = req.body; // 7 years default

      const result = await auditService.cleanOldLogs(retentionDays);

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount,
          message: `Cleaned ${result.deletedCount} old audit logs`,
        },
      });
    } catch (error) {
      console.error("Cleanup audit logs error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cleanup audit logs",
      });
    }
  }
);

export default router;
