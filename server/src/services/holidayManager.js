import Holiday from "../models/Holiday.js";
import Appointment from "../models/Appointment.js";
import { auditService } from "./auditService.js";
import { ValidationError } from "../utils/errors.js";

/**
 * HolidayManager Service
 * Handles CRUD operations for holiday management
 * Provides conflict validation with existing appointments
 * Supports recurring holidays and bulk operations
 */
class HolidayManager {
  /**
   * Get all holidays with optional filtering
   * @param {Object} filters - Optional filters (isActive, isRecurring, dateRange)
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Object>} Holidays with pagination info
   */
  async getHolidays(filters = {}, options = {}) {
    try {
      const query = {};

      // Apply filters
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.isRecurring !== undefined) {
        query.isRecurring = filters.isRecurring;
      }

      if (filters.dateRange) {
        const { startDate, endDate } = filters.dateRange;
        if (startDate && endDate) {
          query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          };
        }
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
        ];
      }

      // Set default options
      const limit = Math.min(options.limit || 50, 100);
      const skip = options.skip || 0;
      const sort = options.sort || { date: 1 };

      // Execute query
      const [holidays, total] = await Promise.all([
        Holiday.find(query)
          .populate("createdBy updatedBy", "name email")
          .sort(sort)
          .limit(limit)
          .skip(skip)
          .lean(),
        Holiday.countDocuments(query),
      ]);

      return {
        holidays,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + holidays.length < total,
        },
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to retrieve holidays: ${error.message}`,
        "HOLIDAYS_RETRIEVAL_ERROR"
      );
    }
  }

  /**
   * Get a specific holiday by ID
   * @param {string} holidayId - The holiday ID
   * @returns {Promise<Object>} The holiday object
   */
  async getHolidayById(holidayId) {
    try {
      const holiday = await Holiday.findById(holidayId)
        .populate("createdBy updatedBy", "name email")
        .lean();

      if (!holiday) {
        throw new ValidationError("Holiday not found", "HOLIDAY_NOT_FOUND");
      }

      return holiday;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to retrieve holiday: ${error.message}`,
        "HOLIDAY_RETRIEVAL_ERROR"
      );
    }
  }

  /**
   * Create a new holiday
   * @param {Object} holidayData - The holiday data
   * @param {string} userId - The ID of the user creating the holiday
   * @param {Object} auditInfo - Audit information (IP, user agent, etc.)
   * @returns {Promise<Object>} The created holiday
   */
  async createHoliday(holidayData, userId, auditInfo = {}) {
    try {
      // Validate holiday data
      this._validateHolidayData(holidayData);

      // Check for conflicts with existing appointments
      await this._validateNoAppointmentConflicts(holidayData.date);

      // Create the holiday
      const holiday = await Holiday.createHoliday(holidayData, userId);

      // Log the holiday creation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "Holiday",
        resourceId: holiday._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/holidays",
        method: "POST",
        newValues: {
          name: holiday.name,
          date: holiday.date,
          description: holiday.description,
          isRecurring: holiday.isRecurring,
        },
        description: `Created holiday: ${holiday.name} on ${holiday.formattedDate}`,
        success: true,
      });

      return holiday.toObject();
    } catch (error) {
      // Log failed creation attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "Holiday",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/holidays",
        method: "POST",
        description: `Failed to create holiday: ${holidayData.name}`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to create holiday: ${error.message}`,
        "HOLIDAY_CREATE_ERROR"
      );
    }
  }

  /**
   * Update an existing holiday
   * @param {string} holidayId - The holiday ID
   * @param {Object} updateData - The data to update
   * @param {string} userId - The ID of the user updating the holiday
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The updated holiday
   */
  async updateHoliday(holidayId, updateData, userId, auditInfo = {}) {
    try {
      const holiday = await Holiday.findById(holidayId);
      if (!holiday) {
        throw new ValidationError("Holiday not found", "HOLIDAY_NOT_FOUND");
      }

      // Store old values for audit
      const oldValues = {
        name: holiday.name,
        date: holiday.date,
        description: holiday.description,
        isRecurring: holiday.isRecurring,
        isActive: holiday.isActive,
      };

      // Validate update data
      if (updateData.date || updateData.name) {
        this._validateHolidayData({ ...holiday.toObject(), ...updateData });
      }

      // Check for conflicts if date is being changed
      if (
        updateData.date &&
        updateData.date.getTime() !== holiday.date.getTime()
      ) {
        await this._validateNoAppointmentConflicts(updateData.date);
      }

      // Update the holiday
      const updatedHoliday = await holiday.updateHoliday(updateData, userId);

      // Log the holiday update
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "Holiday",
        resourceId: holiday._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || `/api/admin/availability/holidays/${holidayId}`,
        method: "PUT",
        oldValues,
        newValues: {
          name: updatedHoliday.name,
          date: updatedHoliday.date,
          description: updatedHoliday.description,
          isRecurring: updatedHoliday.isRecurring,
          isActive: updatedHoliday.isActive,
        },
        description: `Updated holiday: ${updatedHoliday.name}`,
        success: true,
      });

      return updatedHoliday.toObject();
    } catch (error) {
      // Log failed update attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "Holiday",
        resourceId: holidayId,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || `/api/admin/availability/holidays/${holidayId}`,
        method: "PUT",
        description: `Failed to update holiday with ID: ${holidayId}`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to update holiday: ${error.message}`,
        "HOLIDAY_UPDATE_ERROR"
      );
    }
  }

  /**
   * Delete a holiday (soft delete by deactivating)
   * @param {string} holidayId - The holiday ID
   * @param {string} userId - The ID of the user deleting the holiday
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The deactivated holiday
   */
  async deleteHoliday(holidayId, userId, auditInfo = {}) {
    try {
      const holiday = await Holiday.findById(holidayId);
      if (!holiday) {
        throw new ValidationError("Holiday not found", "HOLIDAY_NOT_FOUND");
      }

      if (!holiday.isActive) {
        throw new ValidationError(
          "Holiday is already deleted",
          "HOLIDAY_ALREADY_DELETED"
        );
      }

      const oldValues = {
        name: holiday.name,
        date: holiday.date,
        isActive: holiday.isActive,
      };

      // Deactivate the holiday
      const deactivatedHoliday = await holiday.deactivate(userId);

      // Log the holiday deletion
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "Holiday",
        resourceId: holiday._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || `/api/admin/availability/holidays/${holidayId}`,
        method: "DELETE",
        oldValues,
        newValues: { isActive: false },
        description: `Deleted holiday: ${holiday.name} on ${holiday.formattedDate}`,
        success: true,
      });

      return deactivatedHoliday.toObject();
    } catch (error) {
      // Log failed deletion attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "Holiday",
        resourceId: holidayId,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || `/api/admin/availability/holidays/${holidayId}`,
        method: "DELETE",
        description: `Failed to delete holiday with ID: ${holidayId}`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to delete holiday: ${error.message}`,
        "HOLIDAY_DELETE_ERROR"
      );
    }
  }

  /**
   * Bulk create holidays
   * @param {Array} holidaysData - Array of holiday data objects
   * @param {string} userId - The ID of the user creating the holidays
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Results with successful and failed operations
   */
  async bulkCreateHolidays(holidaysData, userId, auditInfo = {}) {
    try {
      if (!Array.isArray(holidaysData) || holidaysData.length === 0) {
        throw new ValidationError(
          "Holidays data must be a non-empty array",
          "INVALID_BULK_DATA"
        );
      }

      if (holidaysData.length > 100) {
        throw new ValidationError(
          "Cannot create more than 100 holidays at once",
          "BULK_LIMIT_EXCEEDED"
        );
      }

      // Validate all holiday data first
      const validationErrors = [];
      for (let i = 0; i < holidaysData.length; i++) {
        try {
          this._validateHolidayData(holidaysData[i]);
        } catch (error) {
          validationErrors.push({
            index: i,
            data: holidaysData[i],
            error: error.message,
          });
        }
      }

      if (validationErrors.length > 0) {
        throw new ValidationError(
          "Validation errors in bulk data",
          "BULK_VALIDATION_ERROR",
          { validationErrors }
        );
      }

      // Check for appointment conflicts
      const conflictErrors = [];
      for (let i = 0; i < holidaysData.length; i++) {
        try {
          await this._validateNoAppointmentConflicts(holidaysData[i].date);
        } catch (error) {
          conflictErrors.push({
            index: i,
            data: holidaysData[i],
            error: error.message,
          });
        }
      }

      if (conflictErrors.length > 0) {
        throw new ValidationError(
          "Appointment conflicts in bulk data",
          "BULK_CONFLICT_ERROR",
          { conflictErrors }
        );
      }

      // Perform bulk creation
      const { results, errors } = await Holiday.bulkCreateHolidays(
        holidaysData,
        userId
      );

      // Log the bulk operation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "Holiday",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/holidays/bulk",
        method: "POST",
        newValues: {
          totalAttempted: holidaysData.length,
          successful: results.filter((r) => r.success).length,
          failed: errors.length,
        },
        description: `Bulk created ${
          results.filter((r) => r.success).length
        } holidays out of ${holidaysData.length} attempted`,
        success: errors.length === 0,
        errorMessage:
          errors.length > 0
            ? `${errors.length} holidays failed to create`
            : undefined,
      });

      return {
        successful: results.filter((r) => r.success),
        failed: errors,
        summary: {
          total: holidaysData.length,
          successful: results.filter((r) => r.success).length,
          failed: errors.length,
        },
      };
    } catch (error) {
      // Log failed bulk operation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "Holiday",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/holidays/bulk",
        method: "POST",
        description: `Failed bulk holiday creation`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to bulk create holidays: ${error.message}`,
        "BULK_CREATE_ERROR"
      );
    }
  }

  /**
   * Bulk update holidays
   * @param {Array} updates - Array of {id, data} objects
   * @param {string} userId - The ID of the user updating the holidays
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Results with successful and failed operations
   */
  async bulkUpdateHolidays(updates, userId, auditInfo = {}) {
    try {
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new ValidationError(
          "Updates must be a non-empty array",
          "INVALID_BULK_DATA"
        );
      }

      if (updates.length > 50) {
        throw new ValidationError(
          "Cannot update more than 50 holidays at once",
          "BULK_LIMIT_EXCEEDED"
        );
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          if (!update.id || !update.data) {
            throw new ValidationError(
              "Each update must have id and data fields"
            );
          }

          const updatedHoliday = await this.updateHoliday(
            update.id,
            update.data,
            userId,
            { ...auditInfo, skipAudit: true } // Skip individual audit logs for bulk
          );

          results.push({
            success: true,
            id: update.id,
            holiday: updatedHoliday,
          });
        } catch (error) {
          errors.push({
            success: false,
            id: update.id,
            data: update.data,
            error: error.message,
          });
        }
      }

      // Log the bulk update operation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "Holiday",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/holidays/bulk",
        method: "PUT",
        newValues: {
          totalAttempted: updates.length,
          successful: results.length,
          failed: errors.length,
        },
        description: `Bulk updated ${results.length} holidays out of ${updates.length} attempted`,
        success: errors.length === 0,
        errorMessage:
          errors.length > 0
            ? `${errors.length} holidays failed to update`
            : undefined,
      });

      return {
        successful: results,
        failed: errors,
        summary: {
          total: updates.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to bulk update holidays: ${error.message}`,
        "BULK_UPDATE_ERROR"
      );
    }
  }

  /**
   * Bulk delete holidays
   * @param {Array} holidayIds - Array of holiday IDs to delete
   * @param {string} userId - The ID of the user deleting the holidays
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Results with successful and failed operations
   */
  async bulkDeleteHolidays(holidayIds, userId, auditInfo = {}) {
    try {
      if (!Array.isArray(holidayIds) || holidayIds.length === 0) {
        throw new ValidationError(
          "Holiday IDs must be a non-empty array",
          "INVALID_BULK_DATA"
        );
      }

      if (holidayIds.length > 50) {
        throw new ValidationError(
          "Cannot delete more than 50 holidays at once",
          "BULK_LIMIT_EXCEEDED"
        );
      }

      const results = [];
      const errors = [];

      for (const holidayId of holidayIds) {
        try {
          const deletedHoliday = await this.deleteHoliday(
            holidayId,
            userId,
            { ...auditInfo, skipAudit: true } // Skip individual audit logs for bulk
          );

          results.push({
            success: true,
            id: holidayId,
            holiday: deletedHoliday,
          });
        } catch (error) {
          errors.push({
            success: false,
            id: holidayId,
            error: error.message,
          });
        }
      }

      // Log the bulk delete operation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "Holiday",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/holidays/bulk",
        method: "DELETE",
        newValues: {
          totalAttempted: holidayIds.length,
          successful: results.length,
          failed: errors.length,
        },
        description: `Bulk deleted ${results.length} holidays out of ${holidayIds.length} attempted`,
        success: errors.length === 0,
        errorMessage:
          errors.length > 0
            ? `${errors.length} holidays failed to delete`
            : undefined,
      });

      return {
        successful: results,
        failed: errors,
        summary: {
          total: holidayIds.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to bulk delete holidays: ${error.message}`,
        "BULK_DELETE_ERROR"
      );
    }
  }

  /**
   * Check if a specific date is a holiday
   * @param {Date} date - The date to check
   * @returns {Promise<Object|null>} Holiday object if date is a holiday, null otherwise
   */
  async isHoliday(date) {
    try {
      return await Holiday.getHolidayForDate(date);
    } catch (error) {
      throw new ValidationError(
        `Failed to check holiday status: ${error.message}`,
        "HOLIDAY_CHECK_ERROR"
      );
    }
  }

  /**
   * Get holidays in a date range
   * @param {Date} startDate - Start date of the range
   * @param {Date} endDate - End date of the range
   * @returns {Promise<Array>} Array of holidays in the range
   */
  async getHolidaysInRange(startDate, endDate) {
    try {
      return await Holiday.getHolidaysInRange(startDate, endDate);
    } catch (error) {
      throw new ValidationError(
        `Failed to get holidays in range: ${error.message}`,
        "HOLIDAYS_RANGE_ERROR"
      );
    }
  }

  /**
   * Get upcoming holidays
   * @param {number} limit - Maximum number of holidays to return
   * @returns {Promise<Array>} Array of upcoming holidays
   */
  async getUpcomingHolidays(limit = 10) {
    try {
      return await Holiday.getUpcomingHolidays(limit);
    } catch (error) {
      throw new ValidationError(
        `Failed to get upcoming holidays: ${error.message}`,
        "UPCOMING_HOLIDAYS_ERROR"
      );
    }
  }

  /**
   * Get holiday statistics
   * @returns {Promise<Object>} Holiday statistics
   */
  async getHolidayStats() {
    try {
      return await Holiday.getHolidayStats();
    } catch (error) {
      throw new ValidationError(
        `Failed to get holiday statistics: ${error.message}`,
        "HOLIDAY_STATS_ERROR"
      );
    }
  }

  /**
   * Reactivate a deactivated holiday
   * @param {string} holidayId - The holiday ID
   * @param {string} userId - The ID of the user reactivating the holiday
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The reactivated holiday
   */
  async reactivateHoliday(holidayId, userId, auditInfo = {}) {
    try {
      const holiday = await Holiday.findById(holidayId);
      if (!holiday) {
        throw new ValidationError("Holiday not found", "HOLIDAY_NOT_FOUND");
      }

      if (holiday.isActive) {
        throw new ValidationError(
          "Holiday is already active",
          "HOLIDAY_ALREADY_ACTIVE"
        );
      }

      // Check for conflicts with existing appointments
      await this._validateNoAppointmentConflicts(holiday.date);

      const reactivatedHoliday = await holiday.reactivate(userId);

      // Log the holiday reactivation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "Holiday",
        resourceId: holiday._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/holidays/${holidayId}/reactivate`,
        method: "PATCH",
        oldValues: { isActive: false },
        newValues: { isActive: true },
        description: `Reactivated holiday: ${holiday.name} on ${holiday.formattedDate}`,
        success: true,
      });

      return reactivatedHoliday.toObject();
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to reactivate holiday: ${error.message}`,
        "HOLIDAY_REACTIVATE_ERROR"
      );
    }
  }

  /**
   * Validate holiday data
   * @private
   * @param {Object} holidayData - The holiday data to validate
   */
  _validateHolidayData(holidayData) {
    if (
      !holidayData.name ||
      typeof holidayData.name !== "string" ||
      holidayData.name.trim().length === 0
    ) {
      throw new ValidationError(
        "Holiday name is required and cannot be empty",
        "MISSING_HOLIDAY_NAME"
      );
    }

    if (holidayData.name.length > 100) {
      throw new ValidationError(
        "Holiday name cannot exceed 100 characters",
        "HOLIDAY_NAME_TOO_LONG"
      );
    }

    if (
      !holidayData.date ||
      !(holidayData.date instanceof Date) ||
      isNaN(holidayData.date)
    ) {
      throw new ValidationError(
        "Valid holiday date is required",
        "INVALID_HOLIDAY_DATE"
      );
    }

    if (holidayData.description && holidayData.description.length > 500) {
      throw new ValidationError(
        "Holiday description cannot exceed 500 characters",
        "HOLIDAY_DESCRIPTION_TOO_LONG"
      );
    }

    if (
      holidayData.isRecurring !== undefined &&
      typeof holidayData.isRecurring !== "boolean"
    ) {
      throw new ValidationError(
        "isRecurring must be a boolean value",
        "INVALID_RECURRING_FLAG"
      );
    }
  }

  /**
   * Validate that no appointments exist on the given date
   * @private
   * @param {Date} date - The date to check for conflicts
   */
  async _validateNoAppointmentConflicts(date) {
    try {
      // Normalize date to start of day for comparison
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointments = await Appointment.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: {
          $in: ["scheduled", "confirmed"],
        },
      }).countDocuments();

      if (existingAppointments > 0) {
        throw new ValidationError(
          `Cannot create holiday on ${
            date.toISOString().split("T")[0]
          } - ${existingAppointments} existing appointment(s) found`,
          "APPOINTMENT_CONFLICT",
          {
            conflictDate: date.toISOString().split("T")[0],
            appointmentCount: existingAppointments,
          }
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to validate appointment conflicts: ${error.message}`,
        "CONFLICT_VALIDATION_ERROR"
      );
    }
  }
}

export const holidayManager = new HolidayManager();
export default holidayManager;
