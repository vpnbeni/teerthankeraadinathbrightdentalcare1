import { templateManager } from "../services/templateManager.js";
import { ValidationError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * Get the current availability template
 * GET /api/admin/availability/template
 */
export const getAvailabilityTemplate = async (req, res, next) => {
  try {
    const template = await templateManager.getTemplate();

    res.status(200).json({
      success: true,
      message: "Availability template retrieved successfully",
      data: {
        template: {
          _id: template._id,
          defaultSlots: template.defaultSlots,
          workingDays: template.workingDays,
          slotDuration: template.slotDuration,
          version: template.version,
          updatedBy: template.updatedBy,
          updatedAt: template.updatedAt,
          createdAt: template.createdAt,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error retrieving availability template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
    });

    next(
      new ValidationError(
        "Failed to retrieve availability template",
        "TEMPLATE_RETRIEVAL_ERROR"
      )
    );
  }
};

/**
 * Update the availability template
 * PUT /api/admin/availability/template
 */
export const updateAvailabilityTemplate = async (req, res, next) => {
  try {
    const { defaultSlots, workingDays, slotDuration } = req.body;
    const adminId = req.user.id;

    // Prepare audit information
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    // Prepare template data for update
    const templateData = {};
    if (defaultSlots !== undefined) templateData.defaultSlots = defaultSlots;
    if (workingDays !== undefined) templateData.workingDays = workingDays;
    if (slotDuration !== undefined) templateData.slotDuration = slotDuration;

    const updatedTemplate = await templateManager.updateTemplate(
      templateData,
      adminId,
      auditInfo
    );

    res.status(200).json({
      success: true,
      message: "Availability template updated successfully",
      data: {
        template: {
          _id: updatedTemplate._id,
          defaultSlots: updatedTemplate.defaultSlots,
          workingDays: updatedTemplate.workingDays,
          slotDuration: updatedTemplate.slotDuration,
          version: updatedTemplate.version,
          updatedBy: updatedTemplate.updatedBy,
          updatedAt: updatedTemplate.updatedAt,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error updating availability template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      requestBody: req.body,
    });

    if (error.name === "ValidationError") {
      return next(new ValidationError(error.message, "TEMPLATE_UPDATE_ERROR"));
    }

    next(
      new ValidationError(
        "Failed to update availability template",
        "TEMPLATE_UPDATE_ERROR"
      )
    );
  }
};

/**
 * Add a custom slot to the template
 * POST /api/admin/availability/template/slots
 */
export const addTemplateSlot = async (req, res, next) => {
  try {
    const { startTime, endTime, isActive = true, maxBookings = 1 } = req.body;
    const adminId = req.user.id;

    // Prepare audit information
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    // Prepare slot data
    const slotData = {
      startTime,
      endTime,
      isActive,
      maxBookings,
    };

    const updatedTemplate = await templateManager.addCustomSlot(
      slotData,
      adminId,
      auditInfo
    );

    // Find the newly added slot
    const newSlot =
      updatedTemplate.defaultSlots[updatedTemplate.defaultSlots.length - 1];

    res.status(201).json({
      success: true,
      message: "Custom slot added to template successfully",
      data: {
        slot: {
          _id: newSlot._id,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          isActive: newSlot.isActive,
          maxBookings: newSlot.maxBookings,
        },
        template: {
          _id: updatedTemplate._id,
          version: updatedTemplate.version,
          updatedAt: updatedTemplate.updatedAt,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error adding custom slot to template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      requestBody: req.body,
    });

    if (error.name === "ValidationError") {
      return next(new ValidationError(error.message, "SLOT_ADD_ERROR"));
    }

    next(
      new ValidationError(
        "Failed to add custom slot to template",
        "SLOT_ADD_ERROR"
      )
    );
  }
};

/**
 * Remove a slot from the template
 * DELETE /api/admin/availability/template/slots/:slotId
 */
export const removeTemplateSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const adminId = req.user.id;

    // Prepare audit information
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const updatedTemplate = await templateManager.removeSlot(
      slotId,
      adminId,
      auditInfo
    );

    res.status(200).json({
      success: true,
      message: "Slot removed from template successfully",
      data: {
        template: {
          _id: updatedTemplate._id,
          defaultSlots: updatedTemplate.defaultSlots,
          version: updatedTemplate.version,
          updatedAt: updatedTemplate.updatedAt,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error removing slot from template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      slotId: req.params.slotId,
    });

    if (error.name === "ValidationError") {
      return next(new ValidationError(error.message, "SLOT_REMOVE_ERROR"));
    }

    next(
      new ValidationError(
        "Failed to remove slot from template",
        "SLOT_REMOVE_ERROR"
      )
    );
  }
};

/**
 * Toggle a slot's active status
 * PATCH /api/admin/availability/template/slots/:slotId/toggle
 */
export const toggleTemplateSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const adminId = req.user.id;

    // Prepare audit information
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const updatedTemplate = await templateManager.toggleSlot(
      slotId,
      adminId,
      auditInfo
    );

    // Find the toggled slot
    const toggledSlot = updatedTemplate.defaultSlots.id(slotId);

    res.status(200).json({
      success: true,
      message: `Slot ${
        toggledSlot.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        slot: {
          _id: toggledSlot._id,
          startTime: toggledSlot.startTime,
          endTime: toggledSlot.endTime,
          isActive: toggledSlot.isActive,
          maxBookings: toggledSlot.maxBookings,
        },
        template: {
          _id: updatedTemplate._id,
          version: updatedTemplate.version,
          updatedAt: updatedTemplate.updatedAt,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error toggling slot in template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      slotId: req.params.slotId,
    });

    if (error.name === "ValidationError") {
      return next(new ValidationError(error.message, "SLOT_TOGGLE_ERROR"));
    }

    next(
      new ValidationError(
        "Failed to toggle slot in template",
        "SLOT_TOGGLE_ERROR"
      )
    );
  }
};

/**
 * Reset template to default 8 AM to 6 PM hourly slots
 * POST /api/admin/availability/template/reset
 */
export const resetTemplateToDefault = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    // Prepare audit information
    const auditInfo = {
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: req.originalUrl,
    };

    const resetTemplate = await templateManager.resetToDefault(
      adminId,
      auditInfo
    );

    res.status(200).json({
      success: true,
      message:
        "Template reset to default 8 AM to 6 PM hourly slots successfully",
      data: {
        template: {
          _id: resetTemplate._id,
          defaultSlots: resetTemplate.defaultSlots,
          workingDays: resetTemplate.workingDays,
          slotDuration: resetTemplate.slotDuration,
          version: resetTemplate.version,
          updatedBy: resetTemplate.updatedBy,
          updatedAt: resetTemplate.updatedAt,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error resetting template to default:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
    });

    if (error.name === "ValidationError") {
      return next(new ValidationError(error.message, "TEMPLATE_RESET_ERROR"));
    }

    next(
      new ValidationError(
        "Failed to reset template to default",
        "TEMPLATE_RESET_ERROR"
      )
    );
  }
};

/**
 * Get active slots from the template
 * GET /api/admin/availability/template/active-slots
 */
export const getActiveTemplateSlots = async (req, res, next) => {
  try {
    const activeSlots = await templateManager.getActiveSlots();

    res.status(200).json({
      success: true,
      message: "Active template slots retrieved successfully",
      data: {
        activeSlots: activeSlots.map((slot) => ({
          _id: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxBookings: slot.maxBookings,
        })),
        count: activeSlots.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error retrieving active template slots:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
    });

    next(
      new ValidationError(
        "Failed to retrieve active template slots",
        "ACTIVE_SLOTS_ERROR"
      )
    );
  }
};
