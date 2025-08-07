import express from "express";
import { auth, requireRole } from "../middleware/auth.js";
import {
  healthMonitor,
  memoryMonitor,
  dbPerformanceMonitor,
} from "../middleware/monitoring.js";
import optimizationService from "../services/optimizationService.js";
import { backupService } from "../services/backupService.js";
import metricsService from "../services/metricsService.js";
import logger from "../utils/logger.js";

const router = express.Router();

// System health endpoint (public for load balancers)
router.get("/health", async (req, res) => {
  try {
    const [healthMetrics, dbHealth] = await Promise.all([
      metricsService.getHealthMetrics(),
      optimizationService.checkDatabaseHealth(),
    ]);

    const health = {
      status: dbHealth.status === "healthy" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: memoryMonitor(),
      environment: process.env.NODE_ENV || "development",
      database: dbHealth,
      system: healthMetrics?.system || null,
    };

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed system metrics (admin only)
router.get("/metrics", auth, requireRole("admin"), async (req, res) => {
  try {
    const [performanceMetrics, backupStats] = await Promise.all([
      optimizationService.getPerformanceMetrics(),
      backupService.getBackupStats(),
    ]);

    const metrics = {
      system: {
        uptime: process.uptime(),
        memory: memoryMonitor(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || "development",
      },
      api: healthMonitor.getStats(),
      database: performanceMetrics?.database || null,
      queries: performanceMetrics?.queries || dbPerformanceMonitor.getStats(),
      cache: performanceMetrics?.cache || null,
      backups: backupStats,
      timestamp: new Date().toISOString(),
    };

    logger.info("System metrics requested by admin", { userId: req.user.id });
    res.json(metrics);
  } catch (error) {
    logger.error(`Error fetching system metrics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system metrics",
    });
  }
});

// Performance monitoring endpoint
router.get("/performance", auth, requireRole("admin"), (req, res) => {
  try {
    const performance = {
      api: healthMonitor.getStats(),
      database: dbPerformanceMonitor.getStats(),
      memory: memoryMonitor(),
      timestamp: new Date().toISOString(),
    };

    res.json(performance);
  } catch (error) {
    logger.error(`Error fetching performance data: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch performance data",
    });
  }
});

// Logs endpoint (admin only, last 100 entries)
router.get("/logs", auth, requireRole("admin"), (req, res) => {
  try {
    const { level = "info", limit = 100 } = req.query;

    // This would typically read from log files
    // For now, return a placeholder response
    const logs = {
      level,
      limit: parseInt(limit),
      entries: [], // Would contain actual log entries
      message: "Log viewing requires file system access to log files",
      logFiles: [
        "logs/error-YYYY-MM-DD.log",
        "logs/combined-YYYY-MM-DD.log",
        "logs/http-YYYY-MM-DD.log",
      ],
      timestamp: new Date().toISOString(),
    };

    logger.info("System logs requested by admin", { userId: req.user.id });
    res.json(logs);
  } catch (error) {
    logger.error(`Error fetching logs: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
    });
  }
});

// Clear cache endpoint
router.post("/cache/clear", auth, requireRole("admin"), (req, res) => {
  try {
    const { key } = req.body;

    optimizationService.clearCache(key);

    logger.info(`Cache cleared by admin`, {
      userId: req.user.id,
      key: key || "all",
    });

    res.json({
      success: true,
      message: key ? `Cache key '${key}' cleared` : "All cache cleared",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error clearing cache: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
    });
  }
});

// Trigger manual backup
router.post("/backup/create", auth, requireRole("admin"), async (req, res) => {
  try {
    const { type = "full" } = req.body;

    let result;
    if (type === "incremental") {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      result = await backupService.createIncrementalBackup(
        sixHoursAgo,
        req.user.id
      );
    } else {
      result = await backupService.createFullBackup(req.user.id);
    }

    logger.info(`Manual ${type} backup created by admin`, {
      userId: req.user.id,
      backupName: result.backupName,
    });

    res.json({
      success: true,
      message: `${type} backup created successfully`,
      backup: result,
    });
  } catch (error) {
    logger.error(`Error creating manual backup: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
    });
  }
});

// List backups
router.get("/backups", auth, requireRole("admin"), async (req, res) => {
  try {
    const backups = await backupService.listBackups();

    res.json({
      success: true,
      backups,
      count: backups.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error listing backups: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to list backups",
    });
  }
});

// Prometheus metrics endpoint
router.get("/metrics/prometheus", async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  } catch (error) {
    logger.error(`Error fetching Prometheus metrics: ${error.message}`);
    res.status(500).send("Error fetching metrics");
  }
});

// JSON metrics endpoint (admin only)
router.get("/metrics/json", auth, requireRole("admin"), async (req, res) => {
  try {
    const metrics = await metricsService.getMetricsJson();
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error fetching JSON metrics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
    });
  }
});

// Cache statistics endpoint
router.get("/cache/stats", auth, requireRole("admin"), (req, res) => {
  try {
    const cacheStats = optimizationService.getCacheStats();

    res.json({
      success: true,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error fetching cache stats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cache statistics",
    });
  }
});

// Database health check endpoint
router.get("/database/health", auth, requireRole("admin"), async (req, res) => {
  try {
    const dbHealth = await optimizationService.checkDatabaseHealth();

    res.json({
      success: true,
      database: dbHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error checking database health: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to check database health",
    });
  }
});

// Trigger data cleanup
router.post("/cleanup", auth, requireRole("admin"), async (req, res) => {
  try {
    const result = await optimizationService.cleanupOldData();

    logger.info("Manual data cleanup triggered by admin", {
      userId: req.user.id,
    });

    res.json({
      success: true,
      message: "Data cleanup completed successfully",
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(`Error during manual cleanup: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to perform data cleanup",
    });
  }
});

export default router;
