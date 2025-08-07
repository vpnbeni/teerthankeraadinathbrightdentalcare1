import { holidayManager } from "../services/holidayManager.js";
import { AppError } from "../utils/errors.js";

/**
 * Holiday Controller
 * Handles HTTP requests for holiday management
 */

/**
 * Get all holidays with optional filtering
 * GET /api/admin/availability/holidays
 */
export const getHolidays = async (req, res, next) => {
  try {
    const {
      isActive,
      isRecurring,
      startDate,
      endDate,
      search,
      limit,
      skip,
      sort,
    } = req.query;

    // Build filters
    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }
    if (isRecurring !== undefined) {
      filters.isRecurring = isRecurring === "true";
    }
    if (startDate && endDate) {
      filters.dateRange = { startDate, endDate };
    }
    if (search) {
      filters.search = search;
    }

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

    const result = await holidayManager.getHolidays(filters, options);

    res.json({
      success: true,
      data: result.holidays,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific holiday by ID
 * GET /api/admin/availability/holidays/:id
 */
export const getHolidayById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const holiday = await holidayManager.getHolidayById(id);

    res.json({
      success: true,
      data: holiday,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new holiday
 * POST /api/admin/availability/holidays
 */
export const createHoliday = async (req, res, next) => {
  try {
    const holidayData = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const holiday = await holidayManager.createHoliday(
      holidayData,
      userId,
      auditInfo
    );

    res.status(201).json({
      success: true,
      data: holiday,
      message: "Holiday created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing holiday
 * PUT /api/admin/availability/holidays/:id
 */
export const updateHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const holiday = await holidayManager.updateHoliday(
      id,
      updateData,
      userId,
      auditInfo
    );

    res.json({
      success: true,
      data: holiday,
      message: "Holiday updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a holiday (soft delete)
 * DELETE /api/admin/availability/holidays/:id
 */
export const deleteHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const holiday = await holidayManager.deleteHoliday(id, userId, auditInfo);

    res.json({
      success: true,
      data: holiday,
      message: "Holiday deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create holidays
 * POST /api/admin/availability/holidays/bulk
 */
export const bulkCreateHolidays = async (req, res, next) => {
  try {
    const { holidays } = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const result = await holidayManager.bulkCreateHolidays(
      holidays,
      userId,
      auditInfo
    );

    res.status(201).json({
      success: true,
      data: result,
      message: `Bulk operation completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update holidays
 * PUT /api/admin/availability/holidays/bulk
 */
export const bulkUpdateHolidays = async (req, res, next) => {
  try {
    const { updates } = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const result = await holidayManager.bulkUpdateHolidays(
      updates,
      userId,
      auditInfo
    );

    res.json({
      success: true,
      data: result,
      message: `Bulk update completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete holidays
 * DELETE /api/admin/availability/holidays/bulk
 */
export const bulkDeleteHolidays = async (req, res, next) => {
  try {
    const { holidayIds } = req.body;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const result = await holidayManager.bulkDeleteHolidays(
      holidayIds,
      userId,
      auditInfo
    );

    res.json({
      success: true,
      data: result,
      message: `Bulk delete completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a specific date is a holiday
 * GET /api/admin/availability/holidays/check/:date
 */
export const checkHoliday = async (req, res, next) => {
  try {
    const { date } = req.params;
    const checkDate = new Date(date);

    if (isNaN(checkDate.getTime())) {
      throw new AppError("Invalid date format", 400);
    }

    const holiday = await holidayManager.isHoliday(checkDate);

    res.json({
      success: true,
      data: {
        isHoliday: !!holiday,
        holiday: holiday || null,
        date: checkDate.toISOString().split("T")[0],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get holidays in a date range
 * GET /api/admin/availability/holidays/range
 */
export const getHolidaysInRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError("Start date and end date are required", 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError("Invalid date format", 400);
    }

    if (start > end) {
      throw new AppError("Start date must be before end date", 400);
    }

    const holidays = await holidayManager.getHolidaysInRange(start, end);

    res.json({
      success: true,
      data: holidays,
      dateRange: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get upcoming holidays
 * GET /api/admin/availability/holidays/upcoming
 */
export const getUpcomingHolidays = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit) : 10;

    if (limitNum < 1 || limitNum > 50) {
      throw new AppError("Limit must be between 1 and 50", 400);
    }

    const holidays = await holidayManager.getUpcomingHolidays(limitNum);

    res.json({
      success: true,
      data: holidays,
      limit: limitNum,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get holiday statistics
 * GET /api/admin/availability/holidays/stats
 */
export const getHolidayStats = async (req, res, next) => {
  try {
    const stats = await holidayManager.getHolidayStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate a deactivated holiday
 * PATCH /api/admin/availability/holidays/:id/reactivate
 */
export const reactivateHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const holiday = await holidayManager.reactivateHoliday(
      id,
      userId,
      auditInfo
    );

    res.json({
      success: true,
      data: holiday,
      message: "Holiday reactivated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
