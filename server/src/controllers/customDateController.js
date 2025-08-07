import { customDateManager } from "../services/customDateManager.js";
import { ValidationError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * Custom Date Availability Controller
 * Handles HTTP requests for custom date availability management
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.1, 7.2, 7.3, 7.4
 */

/**
 * Get all custom dates with optional filtering
 * GET /api/admin/availability/custom-dates
 */
export const getCustomDates = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reason,
      isActive,
      createdBy,
      search,
      limit,
      skip,
      sort,
    } = req.query;

    // Build filters
    const filters = {};

    if (startDate && endDate) {
      filters.dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };
    }

    if (reason) filters.reason = reason;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (createdBy) filters.createdBy = createdBy;
    if (search) filters.search = search;

    // Build options
    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (skip) options.skip = parseInt(skip);
    if (sort) {
      try {
        options.sort = JSON.parse(sort);
      } catch (error) {
        options.sort = { date: 1 };
      }
    }

    const result = await customDateManager.getCustomDates(filters, options);

    res.json({
      success: true,
      data: result.customDates,
      pagination: result.pagination,
      message: `Retrieved ${result.customDates.length} custom dates`,
    });
  } catch (error) {
    logger.error("Error getting custom dates:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve custom dates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get a specific custom date by ID
 * GET /api/admin/availability/custom-dates/:id
 */
export const getCustomDateById = async (req, res) => {
  try {
    const { id } = req.params;

    const customDate = await customDateManager.getCustomDateById(id);

    res.json({
      success: true,
      data: customDate,
      message: "Custom date retrieved successfully",
    });
  } catch (error) {
    logger.error("Error getting custom date by ID:", error);

    if (error instanceof ValidationError) {
      const statusCode = error.code === "CUSTOM_DATE_NOT_FOUND" ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve custom date",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Create a new custom date availability
 * POST /api/admin/availability/custom-dates
 */
export const createCustomDate = async (req, res) => {
  try {
    const customDateData = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const customDate = await customDateManager.createCustomDate(
      customDateData,
      userId,
      auditInfo
    );

    res.status(201).json({
      success: true,
      data: customDate,
      message: `Custom date availability created for ${
        customDate.date.toISOString().split("T")[0]
      }`,
    });
  } catch (error) {
    logger.error("Error creating custom date:", error);

    if (error instanceof ValidationError) {
      const statusCode =
        error.code === "CUSTOM_DATE_ALREADY_EXISTS" ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create custom date",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Update an existing custom date availability
 * PUT /api/admin/availability/custom-dates/:id
 */
export const updateCustomDate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const customDate = await customDateManager.updateCustomDate(
      id,
      updateData,
      userId,
      auditInfo
    );

    res.json({
      success: true,
      data: customDate,
      message: `Custom date availability updated for ${
        customDate.date.toISOString().split("T")[0]
      }`,
    });
  } catch (error) {
    logger.error("Error updating custom date:", error);

    if (error instanceof ValidationError) {
      const statusCode =
        error.code === "CUSTOM_DATE_NOT_FOUND"
          ? 404
          : error.code === "CUSTOM_DATE_ALREADY_EXISTS"
          ? 409
          : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update custom date",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Delete a custom date availability (soft delete)
 * DELETE /api/admin/availability/custom-dates/:id
 */
export const deleteCustomDate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const customDate = await customDateManager.deleteCustomDate(
      id,
      userId,
      auditInfo
    );

    res.json({
      success: true,
      data: customDate,
      message: `Custom date availability deleted for ${
        customDate.date.toISOString().split("T")[0]
      }`,
    });
  } catch (error) {
    logger.error("Error deleting custom date:", error);

    if (error instanceof ValidationError) {
      const statusCode =
        error.code === "CUSTOM_DATE_NOT_FOUND"
          ? 404
          : error.code === "APPOINTMENT_CONFLICT"
          ? 409
          : 400;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete custom date",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Bulk create custom dates
 * POST /api/admin/availability/custom-dates/bulk
 */
export const bulkCreateCustomDates = async (req, res) => {
  try {
    const { customDates } = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    if (!Array.isArray(customDates)) {
      return res.status(400).json({
        success: false,
        message: "customDates must be an array",
        code: "INVALID_REQUEST_FORMAT",
      });
    }

    const result = await customDateManager.bulkCreateCustomDates(
      customDates,
      userId,
      auditInfo
    );

    const statusCode = result.failed.length > 0 ? 207 : 201; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: result.failed.length === 0,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: result.summary,
      },
      message: `Bulk operation completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
    });
  } catch (error) {
    logger.error("Error bulk creating custom dates:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to bulk create custom dates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Bulk update custom dates
 * PUT /api/admin/availability/custom-dates/bulk
 */
export const bulkUpdateCustomDates = async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: "updates must be an array",
        code: "INVALID_REQUEST_FORMAT",
      });
    }

    const result = await customDateManager.bulkUpdateCustomDates(
      updates,
      userId,
      auditInfo
    );

    const statusCode = result.failed.length > 0 ? 207 : 200; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: result.failed.length === 0,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: result.summary,
      },
      message: `Bulk update completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
    });
  } catch (error) {
    logger.error("Error bulk updating custom dates:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to bulk update custom dates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Bulk delete custom dates
 * DELETE /api/admin/availability/custom-dates/bulk
 */
export const bulkDeleteCustomDates = async (req, res) => {
  try {
    const { customDateIds } = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    if (!Array.isArray(customDateIds)) {
      return res.status(400).json({
        success: false,
        message: "customDateIds must be an array",
        code: "INVALID_REQUEST_FORMAT",
      });
    }

    const result = await customDateManager.bulkDeleteCustomDates(
      customDateIds,
      userId,
      auditInfo
    );

    const statusCode = result.failed.length > 0 ? 207 : 200; // 207 Multi-Status for partial success

    res.status(statusCode).json({
      success: result.failed.length === 0,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: result.summary,
      },
      message: `Bulk delete completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
    });
  } catch (error) {
    logger.error("Error bulk deleting custom dates:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to bulk delete custom dates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get custom dates in a date range
 * GET /api/admin/availability/custom-dates/range
 */
export const getCustomDatesInRange = async (req, res) => {
  try {
    const { startDate, endDate, reason, createdBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
        code: "MISSING_REQUIRED_PARAMETERS",
      });
    }

    const options = {};
    if (reason) options.reason = reason;
    if (createdBy) options.createdBy = createdBy;

    const customDates = await customDateManager.getCustomDatesInRange(
      new Date(startDate),
      new Date(endDate),
      options
    );

    res.json({
      success: true,
      data: customDates,
      message: `Retrieved ${customDates.length} custom dates in range`,
    });
  } catch (error) {
    logger.error("Error getting custom dates in range:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve custom dates in range",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Preview custom dates
 * POST /api/admin/availability/custom-dates/preview
 */
export const previewCustomDates = async (req, res) => {
  try {
    const { customDates, startDate, endDate } = req.body;

    if (!Array.isArray(customDates)) {
      return res.status(400).json({
        success: false,
        message: "customDates must be an array",
        code: "INVALID_REQUEST_FORMAT",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
        code: "MISSING_REQUIRED_PARAMETERS",
      });
    }

    const preview = await customDateManager.previewCustomDates(
      customDates,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: preview,
      message: "Custom dates preview generated successfully",
    });
  } catch (error) {
    logger.error("Error previewing custom dates:", error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
        details: error.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate custom dates preview",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
