import AuditLog from "../models/AuditLog.js";
import { User } from "../models/index.js";

/**
 * Get audit logs with filtering capabilities
 * GET /api/admin/audit-logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      adminId,
      action,
      resource,
      resourceId,
    } = req.query;

    // Build query object
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Admin user filter
    if (adminId) {
      query.adminId = adminId;
    }

    // Action filter
    if (action) {
      query.action = action;
    }

    // Resource filter
    if (resource) {
      query.resource = resource;
    }

    // Resource ID filter
    if (resourceId) {
      query.resourceId = resourceId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Execute query with population
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("adminId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

/**
 * Get audit log statistics
 * GET /api/admin/audit-logs/stats
 */
export const getAuditLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date query
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) {
        dateQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.createdAt.$lte = new Date(endDate);
      }
    }

    // Get statistics
    const [totalLogs, actionStats, resourceStats, adminStats, recentActivity] =
      await Promise.all([
        // Total logs count
        AuditLog.countDocuments(dateQuery),

        // Actions breakdown
        AuditLog.aggregate([
          { $match: dateQuery },
          { $group: { _id: "$action", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Resources breakdown
        AuditLog.aggregate([
          { $match: dateQuery },
          { $group: { _id: "$resource", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Admin activity
        AuditLog.aggregate([
          { $match: dateQuery },
          { $group: { _id: "$adminId", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "admin",
            },
          },
          {
            $project: {
              count: 1,
              admin: { $arrayElemAt: ["$admin", 0] },
            },
          },
        ]),

        // Recent activity (last 24 hours)
        AuditLog.find({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        })
          .populate("adminId", "name email")
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

    res.json({
      success: true,
      data: {
        totalLogs,
        actionStats,
        resourceStats,
        adminStats,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching audit log statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit log statistics",
      error: error.message,
    });
  }
};

/**
 * Get audit logs for a specific resource
 * GET /api/admin/audit-logs/resource/:resource/:resourceId
 */
export const getResourceAuditLogs = async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = {
      resource,
      resourceId,
    };

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("adminId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching resource audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch resource audit logs",
      error: error.message,
    });
  }
};

/**
 * Get audit logs for a specific admin user
 * GET /api/admin/audit-logs/admin/:adminId
 */
export const getAdminAuditLogs = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = { adminId };

    // Add date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const [logs, total, adminInfo] = await Promise.all([
      AuditLog.find(query)
        .populate("adminId", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
      User.findById(adminId).select("name email role").lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        adminInfo,
        logs,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin audit logs",
      error: error.message,
    });
  }
};

/**
 * Export audit logs as CSV
 * GET /api/admin/audit-logs/export
 */
export const exportAuditLogs = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      adminId,
      action,
      resource,
      resourceId,
      format = "csv",
    } = req.query;

    // Build query object
    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Other filters
    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (resourceId) query.resourceId = resourceId;

    // Fetch all matching logs (limit to 10000 for performance)
    const logs = await AuditLog.find(query)
      .populate("adminId", "name email role")
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    if (format === "csv") {
      // Generate CSV content
      const csvHeaders = [
        "Timestamp",
        "Admin Name",
        "Admin Email",
        "Action",
        "Resource",
        "Resource ID",
        "Status",
        "Description",
        "IP Address",
        "User Agent",
        "Session ID",
        "Endpoint",
        "Method",
      ];

      const csvRows = logs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.adminId?.name || "Unknown",
        log.adminId?.email || "Unknown",
        log.action,
        log.resource,
        log.resourceId,
        log.success ? "Success" : "Failed",
        log.description || "",
        log.metadata?.ipAddress || "",
        log.metadata?.userAgent || "",
        log.metadata?.sessionId || "",
        log.metadata?.endpoint || "",
        log.metadata?.method || "",
      ]);

      // Convert to CSV format
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Set response headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );

      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        message: "Unsupported export format. Only CSV is supported.",
      });
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
      error: error.message,
    });
  }
};
