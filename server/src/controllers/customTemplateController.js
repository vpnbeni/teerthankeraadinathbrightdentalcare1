import CustomTemplate from "../models/CustomTemplate.js";
import { ValidationError, NotFoundError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";

/**
 * Get all custom templates
 * GET /api/admin/custom-templates
 */
export const getCustomTemplates = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      isActive,
      sortBy = "priority",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$text = { $search: search };
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    if (sortBy !== "name") sort.name = 1; // Secondary sort by name

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [templates, total] = await Promise.all([
      CustomTemplate.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CustomTemplate.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Custom templates retrieved successfully",
      data: {
        templates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error retrieving custom templates:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
    });

    next(
      new ValidationError(
        "Failed to retrieve custom templates",
        "CUSTOM_TEMPLATE_RETRIEVAL_ERROR"
      )
    );
  }
};

/**
 * Get a specific custom template
 * GET /api/admin/custom-templates/:id
 */
export const getCustomTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const template = await CustomTemplate.findById(id).lean();
    if (!template) {
      return next(new NotFoundError("Custom template not found"));
    }

    res.status(200).json({
      success: true,
      message: "Custom template retrieved successfully",
      data: { template },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error retrieving custom template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      templateId: req.params.id,
    });

    next(
      new ValidationError(
        "Failed to retrieve custom template",
        "CUSTOM_TEMPLATE_RETRIEVAL_ERROR"
      )
    );
  }
};

/**
 * Create a new custom template
 * POST /api/admin/custom-templates
 */
export const createCustomTemplate = async (req, res, next) => {
  try {
    const {
      name,
      description,
      timeSlots,
      workingDays,
      slotDuration,
      applicableDates,
      priority,
      metadata,
    } = req.body;

    // Ensure _id is not set on create
    delete req.body._id;

    const adminId = req.user.id;

    // Prepare template data
    const templateData = {
      name,
      description,
      timeSlots: timeSlots || [],
      workingDays: workingDays || [1, 2, 3, 4, 5, 6],
      slotDuration: slotDuration || 60,
      applicableDates: applicableDates || [],
      priority: priority || 1,
      createdBy: adminId,
      metadata: metadata || {},
    };

    const template = new CustomTemplate(templateData);
    await template.save();

    logger.info("Custom template created successfully:", {
      templateId: template._id,
      templateName: template.name,
      adminId,
      endpoint: req.originalUrl,
    });

    res.status(201).json({
      success: true,
      message: "Custom template created successfully",
      data: { template },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error creating custom template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      requestBody: req.body,
    });

    if (error.name === "ValidationError") {
      return next(new ValidationError(error.message, "TEMPLATE_VALIDATION_ERROR"));
    }

    next(
      new ValidationError(
        "Failed to create custom template",
        "CUSTOM_TEMPLATE_CREATE_ERROR"
      )
    );
  }
};

/**
 * Update a custom template
 * PUT /api/admin/custom-templates/:id
 */
export const updateCustomTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      timeSlots,
      workingDays,
      slotDuration,
      applicableDates,
      priority,
      isActive,
      metadata,
    } = req.body;

    const adminId = req.user.id;

    const template = await CustomTemplate.findById(id);
    if (!template) {
      return next(new NotFoundError("Custom template not found"));
    }

    // Update fields if provided
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (timeSlots !== undefined) template.timeSlots = timeSlots;
    if (workingDays !== undefined) template.workingDays = workingDays;
    if (slotDuration !== undefined) template.slotDuration = slotDuration;
    if (applicableDates !== undefined) template.applicableDates = applicableDates;
    if (priority !== undefined) template.priority = priority;
    if (isActive !== undefined) template.isActive = isActive;
    if (metadata !== undefined) template.metadata = { ...template.metadata, ...metadata };

    template.updatedBy = adminId;

    await template.save();

    logger.info("Custom template updated successfully:", {
      templateId: template._id,
      templateName: template.name,
      adminId,
      endpoint: req.originalUrl,
    });

    res.status(200).json({
      success: true,
      message: "Custom template updated successfully",
      data: { template },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error updating custom template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      templateId: req.params.id,
      requestBody: req.body,
    });

    if (error.name === "ValidationError") {
      return next(new ValidationError(error.message, "TEMPLATE_VALIDATION_ERROR"));
    }

    next(
      new ValidationError(
        "Failed to update custom template",
        "CUSTOM_TEMPLATE_UPDATE_ERROR"
      )
    );
  }
};

/**
 * Delete a custom template
 * DELETE /api/admin/custom-templates/:id
 */
export const deleteCustomTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const template = await CustomTemplate.findById(id);
    if (!template) {
      return next(new NotFoundError("Custom template not found"));
    }

    await CustomTemplate.findByIdAndDelete(id);

    logger.info("Custom template deleted successfully:", {
      templateId: id,
      templateName: template.name,
      adminId,
      endpoint: req.originalUrl,
    });

    res.status(200).json({
      success: true,
      message: "Custom template deleted successfully",
      data: { deletedTemplateId: id },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error deleting custom template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      templateId: req.params.id,
    });

    next(
      new ValidationError(
        "Failed to delete custom template",
        "CUSTOM_TEMPLATE_DELETE_ERROR"
      )
    );
  }
};

/**
 * Copy/duplicate a custom template
 * POST /api/admin/custom-templates/:id/copy
 */
export const copyCustomTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const adminId = req.user.id;

    const originalTemplate = await CustomTemplate.findById(id);
    if (!originalTemplate) {
      return next(new NotFoundError("Custom template not found"));
    }

    // Create a copy
    const templateCopy = new CustomTemplate({
      name: name || `Copy of ${originalTemplate.name}`,
      description: description || originalTemplate.description,
      timeSlots: originalTemplate.timeSlots,
      workingDays: originalTemplate.workingDays,
      slotDuration: originalTemplate.slotDuration,
      applicableDates: [], // Don't copy applicable dates
      priority: originalTemplate.priority,
      createdBy: adminId,
      metadata: {
        ...originalTemplate.metadata,
        createdFrom: "copy",
        originalTemplateId: id,
      },
    });

    await templateCopy.save();

    logger.info("Custom template copied successfully:", {
      originalTemplateId: id,
      newTemplateId: templateCopy._id,
      adminId,
      endpoint: req.originalUrl,
    });

    res.status(201).json({
      success: true,
      message: "Custom template copied successfully",
      data: { template: templateCopy },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error copying custom template:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      templateId: req.params.id,
    });

    next(
      new ValidationError(
        "Failed to copy custom template",
        "CUSTOM_TEMPLATE_COPY_ERROR"
      )
    );
  }
};

/**
 * Get templates applicable for a specific date
 * GET /api/admin/custom-templates/applicable/:date
 */
export const getApplicableTemplates = async (req, res, next) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return next(new ValidationError("Invalid date format"));
    }

    const templates = await CustomTemplate.findApplicableForDate(targetDate);

    res.status(200).json({
      success: true,
      message: "Applicable templates retrieved successfully",
      data: {
        date: targetDate.toISOString().split('T')[0],
        templates,
        count: templates.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error retrieving applicable templates:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      date: req.params.date,
    });

    next(
      new ValidationError(
        "Failed to retrieve applicable templates",
        "APPLICABLE_TEMPLATES_ERROR"
      )
    );
  }
};

/**
 * Preview template slots for a date range
 * POST /api/admin/custom-templates/preview
 */
export const previewTemplateSlots = async (req, res, next) => {
  try {
    const { templateId, startDate, endDate } = req.body;

    if (!templateId || !startDate || !endDate) {
      return next(new ValidationError("Template ID, start date, and end date are required"));
    }

    const template = await CustomTemplate.findById(templateId);
    if (!template) {
      return next(new NotFoundError("Custom template not found"));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new ValidationError("Invalid date format"));
    }

    const preview = [];
    const current = new Date(start);

    while (current <= end) {
      if (template.isApplicableForDate(current)) {
        const activeSlots = template.getActiveSlots();
        preview.push({
          date: current.toISOString().split('T')[0],
          dayOfWeek: current.getDay(),
          slots: activeSlots.map(slot => ({
            _id: slot._id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            maxBookings: slot.maxBookings,
          })),
          slotCount: activeSlots.length,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      message: "Template preview generated successfully",
      data: {
        template: {
          _id: template._id,
          name: template.name,
          description: template.description,
        },
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        preview,
        totalDays: preview.length,
        totalSlots: preview.reduce((sum, day) => sum + day.slotCount, 0),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error generating template preview:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      requestBody: req.body,
    });

    next(
      new ValidationError(
        "Failed to generate template preview",
        "TEMPLATE_PREVIEW_ERROR"
      )
    );
  }
};

/**
 * Bulk operations for custom templates
 * POST /api/admin/custom-templates/bulk
 */
export const bulkUpdateCustomTemplates = async (req, res, next) => {
  try {
    const { operation, templateIds, data } = req.body;
    const adminId = req.user.id;

    if (!operation || !Array.isArray(templateIds) || templateIds.length === 0) {
      return next(new ValidationError("Operation and template IDs are required"));
    }

    let result;
    
    switch (operation) {
      case "activate":
        result = await CustomTemplate.updateMany(
          { _id: { $in: templateIds } },
          { isActive: true, updatedBy: adminId }
        );
        break;
        
      case "deactivate":
        result = await CustomTemplate.updateMany(
          { _id: { $in: templateIds } },
          { isActive: false, updatedBy: adminId }
        );
        break;
        
      case "delete":
        result = await CustomTemplate.deleteMany({ _id: { $in: templateIds } });
        break;
        
      case "updatePriority":
        if (!data || typeof data.priority !== "number") {
          return next(new ValidationError("Priority value is required for priority update"));
        }
        result = await CustomTemplate.updateMany(
          { _id: { $in: templateIds } },
          { priority: data.priority, updatedBy: adminId }
        );
        break;
        
      default:
        return next(new ValidationError("Invalid bulk operation"));
    }

    logger.info("Bulk template operation completed:", {
      operation,
      templateIds,
      modifiedCount: result.modifiedCount || result.deletedCount,
      adminId,
      endpoint: req.originalUrl,
    });

    res.status(200).json({
      success: true,
      message: `Bulk ${operation} operation completed successfully`,
      data: {
        operation,
        templateIds,
        modifiedCount: result.modifiedCount || result.deletedCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error in bulk template operation:", {
      error: error.message,
      stack: error.stack,
      adminId: req.user?.id,
      endpoint: req.originalUrl,
      requestBody: req.body,
    });

    next(
      new ValidationError(
        "Failed to perform bulk template operation",
        "BULK_TEMPLATE_OPERATION_ERROR"
      )
    );
  }
};
