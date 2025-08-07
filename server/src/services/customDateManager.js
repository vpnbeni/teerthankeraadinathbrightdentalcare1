import CustomDateAvailability from "../models/CustomDateAvailability.js";
import Holiday from "../models/Holiday.js";
import Appointment from "../models/Appointment.js";
import { auditService } from "./auditService.js";
import { ValidationError } from "../utils/errors.js";
import { normalizeToStartOfDay, getDateString } from "../utils/dateUtils.js";

/**
 * CustomDateManager Service
 * Handles CRUD operations for custom date availability management
 * Provides validation to ensure custom slots don't conflict with holidays
 * Supports bulk operations and preview functionality
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
class CustomDateManager {
  /**
   * Get all custom dates with optional filtering
   * @param {Object} filters - Optional filters (dateRange, reason, isActive, createdBy)
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Object>} Custom dates with pagination info
   */
  async getCustomDates(filters = {}, options = {}) {
    try {
      const query = {};

      // Apply filters
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters.reason) {
        query.reason = filters.reason;
      }

      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }

      if (filters.dateRange) {
        const { startDate, endDate } = filters.dateRange;
        if (startDate && endDate) {
          query.date = {
            $gte: normalizeToStartOfDay(startDate),
            $lte: normalizeToStartOfDay(endDate),
          };
        }
      }

      if (filters.search) {
        query.$or = [
          { reason: { $regex: filters.search, $options: "i" } },
          { notes: { $regex: filters.search, $options: "i" } },
        ];
      }

      // Set default options
      const limit = Math.min(options.limit || 50, 100);
      const skip = options.skip || 0;
      const sort = options.sort || { date: 1 };

      // Execute query
      const [customDates, total] = await Promise.all([
        CustomDateAvailability.find(query)
          .populate("createdBy updatedBy", "name email")
          .sort(sort)
          .limit(limit)
          .skip(skip)
          .lean(),
        CustomDateAvailability.countDocuments(query),
      ]);

      return {
        customDates,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + customDates.length < total,
        },
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to retrieve custom dates: ${error.message}`,
        "CUSTOM_DATES_RETRIEVAL_ERROR"
      );
    }
  }

  /**
   * Get a specific custom date by ID
   * @param {string} customDateId - The custom date ID
   * @returns {Promise<Object>} The custom date object
   */
  async getCustomDateById(customDateId) {
    try {
      const customDate = await CustomDateAvailability.findById(customDateId)
        .populate("createdBy updatedBy", "name email")
        .lean();

      if (!customDate) {
        throw new ValidationError(
          "Custom date not found",
          "CUSTOM_DATE_NOT_FOUND"
        );
      }

      return customDate;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to retrieve custom date: ${error.message}`,
        "CUSTOM_DATE_RETRIEVAL_ERROR"
      );
    }
  }

  /**
   * Get custom date by specific date
   * @param {Date|string} date - The date to find custom availability for
   * @returns {Promise<Object|null>} The custom date object or null
   */
  async getCustomDateByDate(date) {
    try {
      const normalizedDate = normalizeToStartOfDay(date);
      return await CustomDateAvailability.findByDate(normalizedDate);
    } catch (error) {
      throw new ValidationError(
        `Failed to retrieve custom date for ${getDateString(date)}: ${
          error.message
        }`,
        "CUSTOM_DATE_BY_DATE_ERROR"
      );
    }
  }

  /**
   * Create a new custom date availability
   * @param {Object} customDateData - The custom date data
   * @param {string} userId - The ID of the user creating the custom date
   * @param {Object} auditInfo - Audit information (IP, user agent, etc.)
   * @returns {Promise<Object>} The created custom date
   */
  async createCustomDate(customDateData, userId, auditInfo = {}) {
    try {
      // Validate custom date data
      this._validateCustomDateData(customDateData);

      // Normalize the date
      const normalizedDate = normalizeToStartOfDay(customDateData.date);

      // Check for conflicts with holidays
      await this._validateNoHolidayConflicts(normalizedDate);

      // Check if custom date already exists
      const existingCustomDate = await this.getCustomDateByDate(normalizedDate);
      if (existingCustomDate) {
        throw new ValidationError(
          `Custom availability already exists for ${getDateString(
            normalizedDate
          )}`,
          "CUSTOM_DATE_ALREADY_EXISTS"
        );
      }

      // Create the custom date
      const customDate = await CustomDateAvailability.createCustomDate(
        {
          ...customDateData,
          date: normalizedDate,
        },
        userId
      );

      // Log the custom date creation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "CustomDateAvailability",
        resourceId: customDate._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/custom-dates",
        method: "POST",
        newValues: {
          date: customDate.date,
          reason: customDate.reason,
          customSlots: customDate.customSlots,
          notes: customDate.notes,
        },
        description: `Created custom date availability for ${getDateString(
          customDate.date
        )} - ${customDate.reason}`,
        success: true,
      });

      return customDate.toObject();
    } catch (error) {
      // Log failed creation attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "CustomDateAvailability",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/custom-dates",
        method: "POST",
        description: `Failed to create custom date availability for ${getDateString(
          customDateData.date
        )}`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to create custom date: ${error.message}`,
        "CUSTOM_DATE_CREATE_ERROR"
      );
    }
  }

  /**
   * Update an existing custom date availability
   * @param {string} customDateId - The custom date ID
   * @param {Object} updateData - The data to update
   * @param {string} userId - The ID of the user updating the custom date
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The updated custom date
   */
  async updateCustomDate(customDateId, updateData, userId, auditInfo = {}) {
    try {
      const customDate = await CustomDateAvailability.findById(customDateId);
      if (!customDate) {
        throw new ValidationError(
          "Custom date not found",
          "CUSTOM_DATE_NOT_FOUND"
        );
      }

      // Store old values for audit
      const oldValues = {
        date: customDate.date,
        reason: customDate.reason,
        customSlots: customDate.customSlots,
        notes: customDate.notes,
        isActive: customDate.isActive,
      };

      // Validate update data
      if (updateData.date || updateData.customSlots || updateData.reason) {
        this._validateCustomDateData({
          ...customDate.toObject(),
          ...updateData,
        });
      }

      // Check for holiday conflicts if date is being changed
      if (
        updateData.date &&
        updateData.date.getTime() !== customDate.date.getTime()
      ) {
        const normalizedDate = normalizeToStartOfDay(updateData.date);
        await this._validateNoHolidayConflicts(normalizedDate);

        // Check if another custom date exists for the new date
        const existingCustomDate = await this.getCustomDateByDate(
          normalizedDate
        );
        if (
          existingCustomDate &&
          existingCustomDate._id.toString() !== customDateId
        ) {
          throw new ValidationError(
            `Custom availability already exists for ${getDateString(
              normalizedDate
            )}`,
            "CUSTOM_DATE_ALREADY_EXISTS"
          );
        }

        updateData.date = normalizedDate;
      }

      // Check for appointment conflicts if slots are being modified
      if (updateData.customSlots) {
        await this._validateNoAppointmentConflicts(
          customDate.date,
          updateData.customSlots
        );
      }

      // Update the custom date
      const updatedCustomDate = await customDate.updateCustomDate(
        updateData,
        userId
      );

      // Log the custom date update
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "CustomDateAvailability",
        resourceId: customDate._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/custom-dates/${customDateId}`,
        method: "PUT",
        oldValues,
        newValues: {
          date: updatedCustomDate.date,
          reason: updatedCustomDate.reason,
          customSlots: updatedCustomDate.customSlots,
          notes: updatedCustomDate.notes,
          isActive: updatedCustomDate.isActive,
        },
        description: `Updated custom date availability for ${getDateString(
          updatedCustomDate.date
        )}`,
        success: true,
      });

      return updatedCustomDate.toObject();
    } catch (error) {
      // Log failed update attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "CustomDateAvailability",
        resourceId: customDateId,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/custom-dates/${customDateId}`,
        method: "PUT",
        description: `Failed to update custom date with ID: ${customDateId}`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to update custom date: ${error.message}`,
        "CUSTOM_DATE_UPDATE_ERROR"
      );
    }
  }

  /**
   * Delete a custom date (soft delete by deactivating)
   * @param {string} customDateId - The custom date ID
   * @param {string} userId - The ID of the user deleting the custom date
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The deactivated custom date
   */
  async deleteCustomDate(customDateId, userId, auditInfo = {}) {
    try {
      const customDate = await CustomDateAvailability.findById(customDateId);
      if (!customDate) {
        throw new ValidationError(
          "Custom date not found",
          "CUSTOM_DATE_NOT_FOUND"
        );
      }

      if (!customDate.isActive) {
        throw new ValidationError(
          "Custom date is already deleted",
          "CUSTOM_DATE_ALREADY_DELETED"
        );
      }

      // Check for appointment conflicts
      const hasConflicts = await customDate.hasConflictingAppointments();
      if (hasConflicts) {
        throw new ValidationError(
          `Cannot delete custom date for ${getDateString(
            customDate.date
          )} - existing appointments found`,
          "APPOINTMENT_CONFLICT"
        );
      }

      const oldValues = {
        date: customDate.date,
        reason: customDate.reason,
        isActive: customDate.isActive,
      };

      // Deactivate the custom date
      const deactivatedCustomDate = await customDate.deactivate(userId);

      // Log the custom date deletion
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "CustomDateAvailability",
        resourceId: customDate._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/custom-dates/${customDateId}`,
        method: "DELETE",
        oldValues,
        newValues: { isActive: false },
        description: `Deleted custom date availability for ${getDateString(
          customDate.date
        )}`,
        success: true,
      });

      return deactivatedCustomDate.toObject();
    } catch (error) {
      // Log failed deletion attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "CustomDateAvailability",
        resourceId: customDateId,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/custom-dates/${customDateId}`,
        method: "DELETE",
        description: `Failed to delete custom date with ID: ${customDateId}`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to delete custom date: ${error.message}`,
        "CUSTOM_DATE_DELETE_ERROR"
      );
    }
  }

  /**
   * Bulk create custom dates
   * @param {Array} customDatesData - Array of custom date data objects
   * @param {string} userId - The ID of the user creating the custom dates
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Results with successful and failed operations
   */
  async bulkCreateCustomDates(customDatesData, userId, auditInfo = {}) {
    try {
      if (!Array.isArray(customDatesData) || customDatesData.length === 0) {
        throw new ValidationError(
          "Custom dates data must be a non-empty array",
          "INVALID_BULK_DATA"
        );
      }

      if (customDatesData.length > 100) {
        throw new ValidationError(
          "Cannot create more than 100 custom dates at once",
          "BULK_LIMIT_EXCEEDED"
        );
      }

      // Validate all custom date data first
      const validationErrors = [];
      for (let i = 0; i < customDatesData.length; i++) {
        try {
          this._validateCustomDateData(customDatesData[i]);
        } catch (error) {
          validationErrors.push({
            index: i,
            data: customDatesData[i],
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

      // Check for holiday conflicts and existing custom dates
      const conflictErrors = [];
      for (let i = 0; i < customDatesData.length; i++) {
        try {
          const normalizedDate = normalizeToStartOfDay(customDatesData[i].date);
          await this._validateNoHolidayConflicts(normalizedDate);

          const existingCustomDate = await this.getCustomDateByDate(
            normalizedDate
          );
          if (existingCustomDate) {
            throw new ValidationError(
              `Custom availability already exists for ${getDateString(
                normalizedDate
              )}`
            );
          }
        } catch (error) {
          conflictErrors.push({
            index: i,
            data: customDatesData[i],
            error: error.message,
          });
        }
      }

      if (conflictErrors.length > 0) {
        throw new ValidationError(
          "Conflicts in bulk data",
          "BULK_CONFLICT_ERROR",
          { conflictErrors }
        );
      }

      // Normalize dates in the data
      const normalizedData = customDatesData.map((data) => ({
        ...data,
        date: normalizeToStartOfDay(data.date),
      }));

      // Perform bulk creation
      const { results, errors } =
        await CustomDateAvailability.bulkCreateCustomDates(
          normalizedData,
          userId
        );

      // Log the bulk operation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "CustomDateAvailability",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/custom-dates/bulk",
        method: "POST",
        newValues: {
          totalAttempted: customDatesData.length,
          successful: results.filter((r) => r.success).length,
          failed: errors.length,
        },
        description: `Bulk created ${
          results.filter((r) => r.success).length
        } custom dates out of ${customDatesData.length} attempted`,
        success: errors.length === 0,
        errorMessage:
          errors.length > 0
            ? `${errors.length} custom dates failed to create`
            : undefined,
      });

      return {
        successful: results.filter((r) => r.success),
        failed: errors,
        summary: {
          total: customDatesData.length,
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
        resourceType: "CustomDateAvailability",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/custom-dates/bulk",
        method: "POST",
        description: `Failed bulk custom date creation`,
        success: false,
        errorMessage: error.message,
      });

      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to bulk create custom dates: ${error.message}`,
        "BULK_CREATE_ERROR"
      );
    }
  }

  /**
   * Bulk update custom dates
   * @param {Array} updates - Array of {id, data} objects
   * @param {string} userId - The ID of the user updating the custom dates
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Results with successful and failed operations
   */
  async bulkUpdateCustomDates(updates, userId, auditInfo = {}) {
    try {
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new ValidationError(
          "Updates must be a non-empty array",
          "INVALID_BULK_DATA"
        );
      }

      if (updates.length > 50) {
        throw new ValidationError(
          "Cannot update more than 50 custom dates at once",
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

          const updatedCustomDate = await this.updateCustomDate(
            update.id,
            update.data,
            userId,
            { ...auditInfo, skipAudit: true } // Skip individual audit logs for bulk
          );

          results.push({
            success: true,
            id: update.id,
            customDate: updatedCustomDate,
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
        resourceType: "CustomDateAvailability",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/custom-dates/bulk",
        method: "PUT",
        newValues: {
          totalAttempted: updates.length,
          successful: results.length,
          failed: errors.length,
        },
        description: `Bulk updated ${results.length} custom dates out of ${updates.length} attempted`,
        success: errors.length === 0,
        errorMessage:
          errors.length > 0
            ? `${errors.length} custom dates failed to update`
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
        `Failed to bulk update custom dates: ${error.message}`,
        "BULK_UPDATE_ERROR"
      );
    }
  }

  /**
   * Bulk delete custom dates
   * @param {Array} customDateIds - Array of custom date IDs to delete
   * @param {string} userId - The ID of the user deleting the custom dates
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Results with successful and failed operations
   */
  async bulkDeleteCustomDates(customDateIds, userId, auditInfo = {}) {
    try {
      if (!Array.isArray(customDateIds) || customDateIds.length === 0) {
        throw new ValidationError(
          "Custom date IDs must be a non-empty array",
          "INVALID_BULK_DATA"
        );
      }

      if (customDateIds.length > 50) {
        throw new ValidationError(
          "Cannot delete more than 50 custom dates at once",
          "BULK_LIMIT_EXCEEDED"
        );
      }

      const results = [];
      const errors = [];

      for (const customDateId of customDateIds) {
        try {
          const deletedCustomDate = await this.deleteCustomDate(
            customDateId,
            userId,
            { ...auditInfo, skipAudit: true } // Skip individual audit logs for bulk
          );

          results.push({
            success: true,
            id: customDateId,
            customDate: deletedCustomDate,
          });
        } catch (error) {
          errors.push({
            success: false,
            id: customDateId,
            error: error.message,
          });
        }
      }

      // Log the bulk delete operation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "CustomDateAvailability",
        resourceId: null,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/custom-dates/bulk",
        method: "DELETE",
        newValues: {
          totalAttempted: customDateIds.length,
          successful: results.length,
          failed: errors.length,
        },
        description: `Bulk deleted ${results.length} custom dates out of ${customDateIds.length} attempted`,
        success: errors.length === 0,
        errorMessage:
          errors.length > 0
            ? `${errors.length} custom dates failed to delete`
            : undefined,
      });

      return {
        successful: results,
        failed: errors,
        summary: {
          total: customDateIds.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to bulk delete custom dates: ${error.message}`,
        "BULK_DELETE_ERROR"
      );
    }
  }

  /**
   * Get custom dates in a date range
   * @param {Date|string} startDate - Start date of the range
   * @param {Date|string} endDate - End date of the range
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Array of custom dates in the range
   */
  async getCustomDatesInRange(startDate, endDate, options = {}) {
    try {
      const start = normalizeToStartOfDay(startDate);
      const end = normalizeToStartOfDay(endDate);

      return await CustomDateAvailability.getCustomDatesInRange(
        start,
        end,
        options
      );
    } catch (error) {
      throw new ValidationError(
        `Failed to get custom dates in range: ${error.message}`,
        "CUSTOM_DATES_RANGE_ERROR"
      );
    }
  }

  /**
   * Preview how custom dates will appear to patients
   * @param {Array} customDatesData - Array of custom date data to preview
   * @param {Date|string} startDate - Start date for preview range
   * @param {Date|string} endDate - End date for preview range
   * @returns {Promise<Object>} Preview data showing how availability will appear
   */
  async previewCustomDates(customDatesData, startDate, endDate) {
    try {
      const start = normalizeToStartOfDay(startDate);
      const end = normalizeToStartOfDay(endDate);

      if (start > end) {
        throw new ValidationError(
          "Start date must be before or equal to end date",
          "INVALID_DATE_RANGE"
        );
      }

      const preview = {
        dateRange: {
          startDate: getDateString(start),
          endDate: getDateString(end),
        },
        customDates: [],
        conflicts: [],
        summary: {
          totalCustomDates: customDatesData.length,
          validCustomDates: 0,
          conflictingCustomDates: 0,
          totalSlots: 0,
          totalCapacity: 0,
        },
      };

      // Process each custom date
      for (const customDateData of customDatesData) {
        try {
          const normalizedDate = normalizeToStartOfDay(customDateData.date);
          const dateString = getDateString(normalizedDate);

          // Skip dates outside the preview range
          if (normalizedDate < start || normalizedDate > end) {
            continue;
          }

          // Check for holiday conflicts
          const isHoliday = await Holiday.isHoliday(normalizedDate);
          let conflictType = null;
          let conflictMessage = null;

          if (isHoliday) {
            const holiday = await Holiday.getHolidayForDate(normalizedDate);
            conflictType = "holiday";
            conflictMessage = `Date conflicts with holiday: ${holiday.name}`;
          }

          // Check for existing custom date
          const existingCustomDate = await this.getCustomDateByDate(
            normalizedDate
          );
          if (existingCustomDate && !conflictType) {
            conflictType = "existing_custom_date";
            conflictMessage = `Custom availability already exists for this date`;
          }

          // Check for appointment conflicts
          const hasAppointments = await this._hasExistingAppointments(
            normalizedDate
          );
          if (hasAppointments && !conflictType) {
            conflictType = "existing_appointments";
            conflictMessage = `Existing appointments found for this date`;
          }

          const previewItem = {
            date: dateString,
            reason: customDateData.reason,
            notes: customDateData.notes || "",
            customSlots: customDateData.customSlots.map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              maxBookings: slot.maxBookings,
              isActive: slot.isActive !== false,
            })),
            activeSlots: customDateData.customSlots.filter(
              (slot) => slot.isActive !== false
            ).length,
            totalCapacity: customDateData.customSlots
              .filter((slot) => slot.isActive !== false)
              .reduce((total, slot) => total + (slot.maxBookings || 1), 0),
            hasConflict: !!conflictType,
            conflictType,
            conflictMessage,
            patientView: {
              isAvailable: !conflictType,
              availableSlots: conflictType
                ? []
                : customDateData.customSlots
                    .filter((slot) => slot.isActive !== false)
                    .map((slot) => ({
                      timeSlot: `${slot.startTime}-${slot.endTime}`,
                      capacity: slot.maxBookings || 1,
                    })),
            },
          };

          if (conflictType) {
            preview.conflicts.push(previewItem);
            preview.summary.conflictingCustomDates++;
          } else {
            preview.customDates.push(previewItem);
            preview.summary.validCustomDates++;
            preview.summary.totalSlots += previewItem.activeSlots;
            preview.summary.totalCapacity += previewItem.totalCapacity;
          }
        } catch (error) {
          preview.conflicts.push({
            date: getDateString(customDateData.date),
            reason: customDateData.reason,
            hasConflict: true,
            conflictType: "validation_error",
            conflictMessage: error.message,
          });
          preview.summary.conflictingCustomDates++;
        }
      }

      return preview;
    } catch (error) {
      throw new ValidationError(
        `Failed to preview custom dates: ${error.message}`,
        "CUSTOM_DATE_PREVIEW_ERROR"
      );
    }
  }

  /**
   * Get custom date statistics
   * @param {Date|string} startDate - Start date for statistics
   * @param {Date|string} endDate - End date for statistics
   * @returns {Promise<Object>} Custom date statistics
   */
  async getCustomDateStats(startDate, endDate) {
    try {
      const start = normalizeToStartOfDay(startDate);
      const end = normalizeToStartOfDay(endDate);

      return await CustomDateAvailability.getCustomDateStats(start, end);
    } catch (error) {
      throw new ValidationError(
        `Failed to get custom date statistics: ${error.message}`,
        "CUSTOM_DATE_STATS_ERROR"
      );
    }
  }

  /**
   * Reactivate a deactivated custom date
   * @param {string} customDateId - The custom date ID
   * @param {string} userId - The ID of the user reactivating the custom date
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The reactivated custom date
   */
  async reactivateCustomDate(customDateId, userId, auditInfo = {}) {
    try {
      const customDate = await CustomDateAvailability.findById(customDateId);
      if (!customDate) {
        throw new ValidationError(
          "Custom date not found",
          "CUSTOM_DATE_NOT_FOUND"
        );
      }

      if (customDate.isActive) {
        throw new ValidationError(
          "Custom date is already active",
          "CUSTOM_DATE_ALREADY_ACTIVE"
        );
      }

      // Check for conflicts with holidays
      await this._validateNoHolidayConflicts(customDate.date);

      // Check for conflicts with other custom dates
      const existingCustomDate = await this.getCustomDateByDate(
        customDate.date
      );
      if (
        existingCustomDate &&
        existingCustomDate._id.toString() !== customDateId
      ) {
        throw new ValidationError(
          `Another custom availability exists for ${getDateString(
            customDate.date
          )}`,
          "CUSTOM_DATE_ALREADY_EXISTS"
        );
      }

      const reactivatedCustomDate = await customDate.reactivate(userId);

      // Log the custom date reactivation
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "CustomDateAvailability",
        resourceId: customDate._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/custom-dates/${customDateId}/reactivate`,
        method: "PATCH",
        oldValues: { isActive: false },
        newValues: { isActive: true },
        description: `Reactivated custom date availability for ${getDateString(
          customDate.date
        )}`,
        success: true,
      });

      return reactivatedCustomDate.toObject();
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to reactivate custom date: ${error.message}`,
        "CUSTOM_DATE_REACTIVATE_ERROR"
      );
    }
  }

  // Private helper methods

  /**
   * Validate custom date data
   * @private
   * @param {Object} customDateData - The custom date data to validate
   */
  _validateCustomDateData(customDateData) {
    if (
      !customDateData.date ||
      !(customDateData.date instanceof Date) ||
      isNaN(customDateData.date)
    ) {
      throw new ValidationError(
        "Valid custom date is required",
        "INVALID_CUSTOM_DATE"
      );
    }

    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(customDateData.date);
    inputDate.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      throw new ValidationError(
        "Custom date cannot be in the past",
        "CUSTOM_DATE_IN_PAST"
      );
    }

    if (
      !customDateData.reason ||
      typeof customDateData.reason !== "string" ||
      customDateData.reason.trim().length === 0
    ) {
      throw new ValidationError(
        "Custom date reason is required and cannot be empty",
        "MISSING_CUSTOM_DATE_REASON"
      );
    }

    const validReasons = [
      "Extended hours",
      "Reduced availability",
      "Special event",
      "Emergency coverage",
      "Staff training",
      "Maintenance",
      "Holiday coverage",
      "Other",
    ];

    if (!validReasons.includes(customDateData.reason)) {
      throw new ValidationError(
        `Invalid reason. Must be one of: ${validReasons.join(", ")}`,
        "INVALID_CUSTOM_DATE_REASON"
      );
    }

    if (customDateData.notes && customDateData.notes.length > 500) {
      throw new ValidationError(
        "Custom date notes cannot exceed 500 characters",
        "CUSTOM_DATE_NOTES_TOO_LONG"
      );
    }

    if (
      !customDateData.customSlots ||
      !Array.isArray(customDateData.customSlots) ||
      customDateData.customSlots.length === 0
    ) {
      throw new ValidationError(
        "At least one custom slot must be defined",
        "MISSING_CUSTOM_SLOTS"
      );
    }

    // Validate each custom slot
    customDateData.customSlots.forEach((slot, index) => {
      this._validateCustomSlot(slot, index);
    });

    // Check for overlapping slots
    this._validateNoOverlappingSlots(customDateData.customSlots);
  }

  /**
   * Validate a custom slot
   * @private
   * @param {Object} slot - The slot to validate
   * @param {number} index - The slot index for error messages
   */
  _validateCustomSlot(slot, index) {
    if (!slot.startTime || !slot.endTime) {
      throw new ValidationError(
        `Slot ${index + 1}: Start time and end time are required`,
        "MISSING_SLOT_TIMES"
      );
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
      throw new ValidationError(
        `Slot ${index + 1}: Time must be in HH:MM format`,
        "INVALID_SLOT_TIME_FORMAT"
      );
    }

    // Validate time order and duration
    const [startHour, startMin] = slot.startTime.split(":").map(Number);
    const [endHour, endMin] = slot.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new ValidationError(
        `Slot ${index + 1}: End time must be after start time`,
        "INVALID_SLOT_TIME_ORDER"
      );
    }

    if (endMinutes - startMinutes < 15) {
      throw new ValidationError(
        `Slot ${index + 1}: Time slot must be at least 15 minutes long`,
        "SLOT_TOO_SHORT"
      );
    }

    if (endMinutes - startMinutes > 240) {
      throw new ValidationError(
        `Slot ${index + 1}: Time slot cannot exceed 4 hours`,
        "SLOT_TOO_LONG"
      );
    }

    // Validate maxBookings
    if (slot.maxBookings !== undefined) {
      if (
        !Number.isInteger(slot.maxBookings) ||
        slot.maxBookings < 1 ||
        slot.maxBookings > 10
      ) {
        throw new ValidationError(
          `Slot ${index + 1}: Max bookings must be an integer between 1 and 10`,
          "INVALID_SLOT_MAX_BOOKINGS"
        );
      }
    }
  }

  /**
   * Validate that slots don't overlap
   * @private
   * @param {Array} slots - Array of slots to validate
   */
  _validateNoOverlappingSlots(slots) {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (this._timeSlotsOverlap(slots[i], slots[j])) {
          throw new ValidationError(
            `Slots overlap: ${slots[i].startTime}-${slots[i].endTime} and ${slots[j].startTime}-${slots[j].endTime}`,
            "SLOTS_OVERLAP"
          );
        }
      }
    }
  }

  /**
   * Check if two time slots overlap
   * @private
   * @param {Object} slot1 - First slot
   * @param {Object} slot2 - Second slot
   * @returns {boolean} True if slots overlap
   */
  _timeSlotsOverlap(slot1, slot2) {
    const slot1Start = this._timeToMinutes(slot1.startTime);
    const slot1End = this._timeToMinutes(slot1.endTime);
    const slot2Start = this._timeToMinutes(slot2.startTime);
    const slot2End = this._timeToMinutes(slot2.endTime);

    return slot1Start < slot2End && slot1End > slot2Start;
  }

  /**
   * Convert time string to minutes
   * @private
   * @param {string} timeString - Time in HH:MM format
   * @returns {number} Time in minutes
   */
  _timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Validate that custom date doesn't conflict with holidays
   * @private
   * @param {Date} date - The date to check for conflicts
   */
  async _validateNoHolidayConflicts(date) {
    try {
      const isHoliday = await Holiday.isHoliday(date);
      if (isHoliday) {
        const holiday = await Holiday.getHolidayForDate(date);
        throw new ValidationError(
          `Cannot create custom availability on holiday: ${
            holiday.name
          } (${getDateString(date)})`,
          "HOLIDAY_CONFLICT",
          {
            conflictDate: getDateString(date),
            holidayName: holiday.name,
          }
        );
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to validate holiday conflicts: ${error.message}`,
        "CONFLICT_VALIDATION_ERROR"
      );
    }
  }

  /**
   * Validate that custom slots don't conflict with existing appointments
   * @private
   * @param {Date} date - The date to check
   * @param {Array} customSlots - The custom slots to validate
   */
  async _validateNoAppointmentConflicts(date, customSlots) {
    try {
      const startOfDay = normalizeToStartOfDay(date);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const existingAppointments = await Appointment.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ["cancelled"] },
      }).select("timeSlot status");

      if (existingAppointments.length > 0) {
        // Check if any existing appointments fall outside the new custom slots
        const customSlotRanges = customSlots
          .filter((slot) => slot.isActive !== false)
          .map((slot) => ({
            start: this._timeToMinutes(slot.startTime),
            end: this._timeToMinutes(slot.endTime),
          }));

        const conflictingAppointments = existingAppointments.filter(
          (appointment) => {
            const [startTime] = appointment.timeSlot.split("-");
            const appointmentMinutes = this._timeToMinutes(startTime);

            // Check if appointment time falls within any custom slot
            return !customSlotRanges.some(
              (range) =>
                appointmentMinutes >= range.start &&
                appointmentMinutes < range.end
            );
          }
        );

        if (conflictingAppointments.length > 0) {
          throw new ValidationError(
            `Cannot modify custom slots - ${
              conflictingAppointments.length
            } existing appointment(s) would fall outside the new slot times on ${getDateString(
              date
            )}`,
            "APPOINTMENT_CONFLICT",
            {
              conflictDate: getDateString(date),
              appointmentCount: conflictingAppointments.length,
              conflictingTimeSlots: conflictingAppointments.map(
                (a) => a.timeSlot
              ),
            }
          );
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError(
        `Failed to validate appointment conflicts: ${error.message}`,
        "CONFLICT_VALIDATION_ERROR"
      );
    }
  }

  /**
   * Check if there are existing appointments for a date
   * @private
   * @param {Date} date - The date to check
   * @returns {Promise<boolean>} True if appointments exist
   */
  async _hasExistingAppointments(date) {
    try {
      const startOfDay = normalizeToStartOfDay(date);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const appointmentCount = await Appointment.countDocuments({
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: { $nin: ["cancelled"] },
      });

      return appointmentCount > 0;
    } catch (error) {
      throw new ValidationError(
        `Failed to check existing appointments: ${error.message}`,
        "APPOINTMENT_CHECK_ERROR"
      );
    }
  }
}

export const customDateManager = new CustomDateManager();
export default customDateManager;
