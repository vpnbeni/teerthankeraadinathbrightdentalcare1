import AvailabilityTemplate from "../models/AvailabilityTemplate.js";
import { auditService } from "./auditService.js";
import { ValidationError } from "../utils/errors.js";

/**
 * TemplateManager Service
 * Handles CRUD operations for availability template management
 * Provides default slot generation and validation
 */
class TemplateManager {
  /**
   * Get the current availability template
   * @returns {Promise<Object>} The availability template
   */
  async getTemplate() {
    try {
      const template = await AvailabilityTemplate.getTemplate();
      return template;
    } catch (error) {
      throw new ValidationError(
        `Failed to retrieve template: ${error.message}`,
        "TEMPLATE_RETRIEVAL_ERROR"
      );
    }
  }

  /**
   * Update the availability template
   * @param {Object} templateData - The template data to update
   * @param {string} userId - The ID of the user making the update
   * @param {Object} auditInfo - Audit information (IP, user agent, etc.)
   * @returns {Promise<Object>} The updated template
   */
  async updateTemplate(templateData, userId, auditInfo = {}) {
    try {
      const template = await AvailabilityTemplate.getTemplate();
      const oldValues = {
        defaultSlots: template.defaultSlots,
        workingDays: template.workingDays,
        slotDuration: template.slotDuration,
      };

      // Update template fields
      if (templateData.defaultSlots !== undefined) {
        // Validate slots before updating
        this._validateSlots(templateData.defaultSlots);
        template.defaultSlots = templateData.defaultSlots;
      }

      if (templateData.workingDays !== undefined) {
        template.workingDays = templateData.workingDays;
      }

      if (templateData.slotDuration !== undefined) {
        template.slotDuration = templateData.slotDuration;
      }

      template.updatedBy = userId;

      const updatedTemplate = await template.save();

      // Log the template update
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: template._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/template",
        method: "PUT",
        oldValues,
        newValues: {
          defaultSlots: updatedTemplate.defaultSlots,
          workingDays: updatedTemplate.workingDays,
          slotDuration: updatedTemplate.slotDuration,
        },
        description: "Updated availability template",
        success: true,
      });

      return updatedTemplate;
    } catch (error) {
      // Log failed update attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: "availability_template",
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint: auditInfo.endpoint || "/api/admin/availability/template",
        method: "PUT",
        description: "Failed to update availability template",
        success: false,
        errorMessage: error.message,
      });

      throw new ValidationError(
        `Failed to update template: ${error.message}`,
        "TEMPLATE_UPDATE_ERROR"
      );
    }
  }

  /**
   * Add a custom slot to the template
   * @param {Object} slotData - The slot data to add
   * @param {string} userId - The ID of the user making the update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The updated template
   */
  async addCustomSlot(slotData, userId, auditInfo = {}) {
    try {
      // Validate slot data
      this._validateSlotData(slotData);

      const template = await AvailabilityTemplate.getTemplate();
      const oldSlots = [...template.defaultSlots];

      await template.addSlot(slotData, userId);

      // Log the slot addition
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "AvailabilityTemplate",
        resourceId: template._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/template/slots",
        method: "POST",
        oldValues: { defaultSlots: oldSlots },
        newValues: { defaultSlots: template.defaultSlots },
        description: `Added custom slot: ${slotData.startTime}-${slotData.endTime}`,
        success: true,
      });

      return template;
    } catch (error) {
      // Log failed slot addition
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "CREATE",
        resourceType: "AvailabilityTemplate",
        resourceId: "availability_template",
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/template/slots",
        method: "POST",
        description: `Failed to add custom slot: ${slotData.startTime}-${slotData.endTime}`,
        success: false,
        errorMessage: error.message,
      });

      throw new ValidationError(
        `Failed to add custom slot: ${error.message}`,
        "SLOT_ADD_ERROR"
      );
    }
  }

  /**
   * Remove a slot from the template
   * @param {string} slotId - The ID of the slot to remove
   * @param {string} userId - The ID of the user making the update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The updated template
   */
  async removeSlot(slotId, userId, auditInfo = {}) {
    try {
      const template = await AvailabilityTemplate.getTemplate();
      const slotToRemove = template.defaultSlots.id(slotId);

      if (!slotToRemove) {
        throw new ValidationError("Slot not found", "SLOT_NOT_FOUND");
      }

      const oldSlots = [...template.defaultSlots];
      const removedSlotInfo = {
        startTime: slotToRemove.startTime,
        endTime: slotToRemove.endTime,
      };

      await template.removeSlot(slotId, userId);

      // Log the slot removal
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "AvailabilityTemplate",
        resourceId: template._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/template/slots/${slotId}`,
        method: "DELETE",
        oldValues: { defaultSlots: oldSlots },
        newValues: { defaultSlots: template.defaultSlots },
        description: `Removed slot: ${removedSlotInfo.startTime}-${removedSlotInfo.endTime}`,
        success: true,
      });

      return template;
    } catch (error) {
      // Log failed slot removal
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "DELETE",
        resourceType: "AvailabilityTemplate",
        resourceId: "availability_template",
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/template/slots/${slotId}`,
        method: "DELETE",
        description: `Failed to remove slot with ID: ${slotId}`,
        success: false,
        errorMessage: error.message,
      });

      throw new ValidationError(
        `Failed to remove slot: ${error.message}`,
        "SLOT_REMOVE_ERROR"
      );
    }
  }

  /**
   * Update a specific slot in the template
   * @param {string} slotId - The ID of the slot to update
   * @param {Object} slotData - The updated slot data
   * @param {string} userId - The ID of the user making the update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The updated template
   */
  async updateSlot(slotId, slotData, userId, auditInfo = {}) {
    try {
      // Validate slot data
      this._validateSlotData(slotData);

      const template = await AvailabilityTemplate.getTemplate();
      const oldSlot = template.defaultSlots.id(slotId);

      if (!oldSlot) {
        throw new ValidationError("Slot not found", "SLOT_NOT_FOUND");
      }

      const oldSlotData = {
        startTime: oldSlot.startTime,
        endTime: oldSlot.endTime,
        isActive: oldSlot.isActive,
        maxBookings: oldSlot.maxBookings,
      };

      await template.updateSlot(slotId, slotData, userId);

      // Log the slot update
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: template._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/template/slots/${slotId}`,
        method: "PUT",
        oldValues: { slot: oldSlotData },
        newValues: { slot: slotData },
        description: `Updated slot: ${oldSlotData.startTime}-${oldSlotData.endTime}`,
        success: true,
      });

      return template;
    } catch (error) {
      // Log failed slot update
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: "availability_template",
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/template/slots/${slotId}`,
        method: "PUT",
        description: `Failed to update slot with ID: ${slotId}`,
        success: false,
        errorMessage: error.message,
      });

      throw new ValidationError(
        `Failed to update slot: ${error.message}`,
        "SLOT_UPDATE_ERROR"
      );
    }
  }

  /**
   * Toggle a slot's active status
   * @param {string} slotId - The ID of the slot to toggle
   * @param {string} userId - The ID of the user making the update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The updated template
   */
  async toggleSlot(slotId, userId, auditInfo = {}) {
    try {
      const template = await AvailabilityTemplate.getTemplate();
      const slot = template.defaultSlots.id(slotId);

      if (!slot) {
        throw new ValidationError("Slot not found", "SLOT_NOT_FOUND");
      }

      const oldStatus = slot.isActive;
      await template.toggleSlot(slotId, userId);
      const newStatus = slot.isActive;

      // Log the slot toggle
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: template._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/template/slots/${slotId}/toggle`,
        method: "PATCH",
        oldValues: { isActive: oldStatus },
        newValues: { isActive: newStatus },
        description: `Toggled slot ${slot.startTime}-${slot.endTime} from ${
          oldStatus ? "active" : "inactive"
        } to ${newStatus ? "active" : "inactive"}`,
        success: true,
      });

      return template;
    } catch (error) {
      // Log failed slot toggle
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: "availability_template",
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint ||
          `/api/admin/availability/template/slots/${slotId}/toggle`,
        method: "PATCH",
        description: `Failed to toggle slot with ID: ${slotId}`,
        success: false,
        errorMessage: error.message,
      });

      throw new ValidationError(
        `Failed to toggle slot: ${error.message}`,
        "SLOT_TOGGLE_ERROR"
      );
    }
  }

  /**
   * Generate default 8 AM to 6 PM hourly slots
   * @returns {Array} Array of default slot objects
   */
  generateDefaultSlots() {
    return AvailabilityTemplate.generateDefaultSlots();
  }

  /**
   * Reset template to default 8 AM to 6 PM hourly slots
   * @param {string} userId - The ID of the user making the reset
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} The reset template
   */
  async resetToDefault(userId, auditInfo = {}) {
    try {
      const template = await AvailabilityTemplate.getTemplate();
      const oldValues = {
        defaultSlots: template.defaultSlots,
        workingDays: template.workingDays,
        slotDuration: template.slotDuration,
      };

      // Reset to default values
      template.defaultSlots = this.generateDefaultSlots();
      template.workingDays = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
      template.slotDuration = 60;
      template.updatedBy = userId;

      const resetTemplate = await template.save();

      // Log the template reset
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: template._id,
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/template/reset",
        method: "POST",
        oldValues,
        newValues: {
          defaultSlots: resetTemplate.defaultSlots,
          workingDays: resetTemplate.workingDays,
          slotDuration: resetTemplate.slotDuration,
        },
        description:
          "Reset availability template to default 8 AM to 6 PM hourly slots",
        success: true,
      });

      return resetTemplate;
    } catch (error) {
      // Log failed reset attempt
      await auditService.logAction({
        userId,
        userRole: "admin",
        action: "UPDATE",
        resourceType: "AvailabilityTemplate",
        resourceId: "availability_template",
        ipAddress: auditInfo.ipAddress || "unknown",
        userAgent: auditInfo.userAgent || "unknown",
        endpoint:
          auditInfo.endpoint || "/api/admin/availability/template/reset",
        method: "POST",
        description: "Failed to reset availability template to default",
        success: false,
        errorMessage: error.message,
      });

      throw new ValidationError(
        `Failed to reset template: ${error.message}`,
        "TEMPLATE_RESET_ERROR"
      );
    }
  }

  /**
   * Get active slots from the template
   * @returns {Promise<Array>} Array of active slots
   */
  async getActiveSlots() {
    try {
      const template = await this.getTemplate();
      return template.getActiveSlots();
    } catch (error) {
      throw new ValidationError(
        `Failed to get active slots: ${error.message}`,
        "ACTIVE_SLOTS_ERROR"
      );
    }
  }

  /**
   * Check if a date is a working day according to the template
   * @param {Date} date - The date to check
   * @returns {Promise<boolean>} True if it's a working day
   */
  async isWorkingDay(date) {
    try {
      const template = await this.getTemplate();
      return template.isWorkingDay(date);
    } catch (error) {
      throw new ValidationError(
        `Failed to check working day: ${error.message}`,
        "WORKING_DAY_ERROR"
      );
    }
  }

  /**
   * Validate slot data
   * @private
   * @param {Object} slotData - The slot data to validate
   */
  _validateSlotData(slotData) {
    if (!slotData.startTime || !slotData.endTime) {
      throw new ValidationError(
        "Start time and end time are required",
        "MISSING_TIME_FIELDS"
      );
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (
      !timeRegex.test(slotData.startTime) ||
      !timeRegex.test(slotData.endTime)
    ) {
      throw new ValidationError(
        "Time must be in HH:MM format",
        "INVALID_TIME_FORMAT"
      );
    }

    // Validate time order and duration
    const [startHour, startMin] = slotData.startTime.split(":").map(Number);
    const [endHour, endMin] = slotData.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new ValidationError(
        "End time must be after start time",
        "INVALID_TIME_ORDER"
      );
    }

    if (endMinutes - startMinutes < 15) {
      throw new ValidationError(
        "Time slot must be at least 15 minutes long",
        "SLOT_TOO_SHORT"
      );
    }

    if (endMinutes - startMinutes > 240) {
      throw new ValidationError(
        "Time slot cannot exceed 4 hours",
        "SLOT_TOO_LONG"
      );
    }

    // Validate maxBookings if provided
    if (slotData.maxBookings !== undefined) {
      if (
        !Number.isInteger(slotData.maxBookings) ||
        slotData.maxBookings < 1 ||
        slotData.maxBookings > 10
      ) {
        throw new ValidationError(
          "Max bookings must be an integer between 1 and 10",
          "INVALID_MAX_BOOKINGS"
        );
      }
    }
  }

  /**
   * Validate array of slots for overlaps
   * @private
   * @param {Array} slots - Array of slots to validate
   */
  _validateSlots(slots) {
    if (!Array.isArray(slots)) {
      throw new ValidationError(
        "Slots must be an array",
        "INVALID_SLOTS_FORMAT"
      );
    }

    // Validate each slot
    slots.forEach((slot, index) => {
      try {
        this._validateSlotData(slot);
      } catch (error) {
        throw new ValidationError(
          `Slot ${index + 1}: ${error.message}`,
          "SLOT_VALIDATION_ERROR"
        );
      }
    });

    // Check for overlaps
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
}

export const templateManager = new TemplateManager();
export default templateManager;
