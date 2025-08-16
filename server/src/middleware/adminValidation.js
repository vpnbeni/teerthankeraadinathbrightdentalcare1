/**
 * Enhanced validation middleware specifically for admin panel operations
 * Extends the base validation with admin-specific rules and error handling
 */

import { body, param, query, validationResult } from "express-validator";
import { AppError } from "./errorHandler.js";

/**
 * Enhanced validation error handler for admin operations
 */
const handleAdminValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    // Log validation errors for admin operations
    console.warn("Admin validation failed:", {
      endpoint: req.originalUrl,
      method: req.method,
      adminId: req.user?.id,
      errors: errorMessages,
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

/**
 * Admin-specific validation rules
 */
export const adminValidationRules = {
  // Availability management validation
  createAvailability: [
    body("date")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid date")
      .custom((value) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(value);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate < today) {
          throw new Error("Cannot create availability for past dates");
        }
        return true;
      }),

    body("timeSlots")
      .isArray({ min: 1 })
      .withMessage("At least one time slot is required"),

    body("timeSlots.*.startTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("timeSlots.*.endTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format")
      .custom((endTime, { req, path }) => {
        const index = path.split("[")[1].split("]")[0];
        const startTime = req.body.timeSlots[index]?.startTime;

        if (startTime && endTime) {
          const start = new Date(`2000-01-01 ${startTime}`);
          const end = new Date(`2000-01-01 ${endTime}`);

          if (end <= start) {
            throw new Error("End time must be after start time");
          }

          // Check minimum duration (15 minutes)
          const diffMinutes = (end - start) / (1000 * 60);
          if (diffMinutes < 15) {
            throw new Error("Time slot must be at least 15 minutes long");
          }
        }
        return true;
      }),

    body("timeSlots.*.maxBookings")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Max bookings must be between 1 and 10"),

    body("isHoliday")
      .optional()
      .isBoolean()
      .withMessage("Holiday status must be true or false"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
  ],

  updateAvailability: [
    param("id")
      .isMongoId()
      .withMessage("Please provide a valid availability ID"),

    body("timeSlots")
      .optional()
      .isArray()
      .withMessage("Time slots must be an array"),

    body("timeSlots.*.startTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("timeSlots.*.endTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format"),

    body("isHoliday")
      .optional()
      .isBoolean()
      .withMessage("Holiday status must be true or false"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
  ],

  // Appointment management validation
  adminCancelAppointment: [
    param("id")
      .isMongoId()
      .withMessage("Please provide a valid appointment ID"),

    body("reason")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Cancellation reason must be between 10 and 500 characters"),

    body("notifyPatient")
      .isBoolean()
      .withMessage("Patient notification preference must be specified"),

    body("restoreSession")
      .optional()
      .isBoolean()
      .withMessage("Session restoration preference must be true or false"),

    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Admin notes cannot exceed 1000 characters"),
  ],

  bulkCancelAppointments: [
    body("appointmentIds")
      .isArray({ min: 1, max: 50 })
      .withMessage("Please select between 1 and 50 appointments"),

    body("appointmentIds.*").isMongoId().withMessage("Invalid appointment ID"),

    body("reason")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Cancellation reason must be between 10 and 500 characters"),

    body("notifyPatients")
      .isBoolean()
      .withMessage("Patient notification preference must be specified"),

    body("restoreSessions")
      .optional()
      .isBoolean()
      .withMessage("Session restoration preference must be true or false"),
  ],

  rescheduleAppointment: [
    param("id")
      .isMongoId()
      .withMessage("Please provide a valid appointment ID"),

    body("newDate")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid new date")
      .custom((value) => {
        if (value <= new Date()) {
          throw new Error("New appointment date must be in the future");
        }
        return true;
      }),

    body("newTimeSlot")
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      )
      .withMessage("Time slot must be in format HH:MM-HH:MM"),

    body("reason")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Reason cannot exceed 500 characters"),

    body("notifyPatient")
      .optional()
      .isBoolean()
      .withMessage("Patient notification preference must be true or false"),
  ],

  // User management validation
  adminUpdateUserPersonalInfo: [
    param("id").isMongoId().withMessage("Please provide a valid user ID"),

    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("phone")
      .optional()
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number")
      .custom(async (value, { req }) => {
        if (value) {
          // Import User model dynamically to avoid circular dependency
          const { User } = await import("../models/index.js");
          const existingUser = await User.findOne({
            phone: value,
            _id: { $ne: req.params.id },
          });
          if (existingUser) {
            throw new Error("Phone number is already registered");
          }
        }
        return true;
      }),

    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address")
      .custom(async (value, { req }) => {
        if (value) {
          const { User } = await import("../models/index.js");
          const existingUser = await User.findOne({
            email: value,
            _id: { $ne: req.params.id },
          });
          if (existingUser) {
            throw new Error("Email is already registered");
          }
        }
        return true;
      }),

    body("address")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Address cannot exceed 500 characters"),

    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),

    body("alternativePhone")
      .optional()
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),

    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Admin notes cannot exceed 1000 characters"),
  ],

  adminUpdateUserMedicalInfo: [
    param("id").isMongoId().withMessage("Please provide a valid user ID"),

    body("systemicDiseases")
      .optional()
      .isArray()
      .withMessage("Systemic diseases must be an array"),

    body("systemicDiseases.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage(
        "Each systemic disease entry must be between 1 and 200 characters"
      ),

    body("drugAllergies")
      .optional()
      .isArray()
      .withMessage("Drug allergies must be an array"),

    body("drugAllergies.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage(
        "Each drug allergy entry must be between 1 and 200 characters"
      ),

    body("isPregnant")
      .optional()
      .isBoolean()
      .withMessage("Pregnancy status must be true or false"),

    body("pastTreatments")
      .optional()
      .isArray()
      .withMessage("Past treatments must be an array"),

    body("pastTreatments.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage(
        "Each past treatment entry must be between 1 and 200 characters"
      ),

    body("previousExperiences")
      .optional()
      .isArray()
      .withMessage("Previous experiences must be an array"),

    body("previousExperiences.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage(
        "Each previous experience entry must be between 1 and 200 characters"
      ),

    body("lastUpdatedBy")
      .optional()
      .isMongoId()
      .withMessage("Invalid admin ID"),
  ],

  // Subscription management validation
  adminExtendSubscription: [
    param("id").isMongoId().withMessage("Please provide a valid user ID"),

    body("months")
      .isInt({ min: 1, max: 24 })
      .withMessage("Extension months must be between 1 and 24"),

    body("reason")
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Reason must be between 5 and 500 characters"),

    body("notifyUser")
      .optional()
      .isBoolean()
      .withMessage("User notification preference must be true or false"),

    body("addSessions")
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage("Additional sessions must be between 0 and 50"),
  ],

  adminChangeSubscriptionPlan: [
    param("id").isMongoId().withMessage("Please provide a valid user ID"),

    body("newPlanId")
      .isMongoId()
      .withMessage("Please provide a valid plan ID")
      .custom(async (value) => {
        const { Plan } = await import("../models/index.js");
        const plan = await Plan.findById(value);
        if (!plan) {
          throw new Error("Selected plan not found");
        }
        if (!plan.isActive) {
          throw new Error("Selected plan is not active");
        }
        return true;
      }),

    body("reason")
      .optional()
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage("Reason must be between 5 and 500 characters"),

    body("adjustSessions")
      .optional()
      .isBoolean()
      .withMessage("Session adjustment preference must be true or false"),

    body("notifyUser")
      .optional()
      .isBoolean()
      .withMessage("User notification preference must be true or false"),

    body("prorateBilling")
      .optional()
      .isBoolean()
      .withMessage("Prorate billing preference must be true or false"),
  ],

  adminCancelSubscription: [
    param("id").isMongoId().withMessage("Please provide a valid user ID"),

    body("reason")
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage("Cancellation reason must be between 10 and 500 characters"),

    body("immediate")
      .optional()
      .isBoolean()
      .withMessage("Immediate cancellation preference must be true or false"),

    body("refundAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Refund amount must be a positive number"),

    body("notifyUser")
      .optional()
      .isBoolean()
      .withMessage("User notification preference must be true or false"),
  ],

  // Availability template management validation
  adminUpdateAvailabilityTemplate: [
    body("defaultSlots")
      .optional()
      .isArray()
      .withMessage("Default slots must be an array"),

    body("defaultSlots.*.startTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("defaultSlots.*.endTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format")
      .custom((endTime, { req, path }) => {
        const index = path.split("[")[1].split("]")[0];
        const startTime = req.body.defaultSlots[index]?.startTime;

        if (startTime && endTime) {
          const start = new Date(`2000-01-01 ${startTime}`);
          const end = new Date(`2000-01-01 ${endTime}`);

          if (end <= start) {
            throw new Error("End time must be after start time");
          }

          // Check minimum duration (15 minutes)
          const diffMinutes = (end - start) / (1000 * 60);
          if (diffMinutes < 15) {
            throw new Error("Time slot must be at least 15 minutes long");
          }

          // Check maximum duration (4 hours)
          if (diffMinutes > 240) {
            throw new Error("Time slot cannot exceed 4 hours");
          }
        }
        return true;
      }),

    body("defaultSlots.*.isActive")
      .optional()
      .isBoolean()
      .withMessage("Slot active status must be true or false"),

    body("defaultSlots.*.maxBookings")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Max bookings must be between 1 and 10"),

    body("workingDays")
      .optional()
      .isArray({ min: 1, max: 7 })
      .withMessage("Working days must be an array with 1-7 elements"),

    body("workingDays.*")
      .isInt({ min: 0, max: 6 })
      .withMessage(
        "Working days must be integers between 0 (Sunday) and 6 (Saturday)"
      ),

    body("slotDuration")
      .optional()
      .isInt({ min: 15, max: 240 })
      .withMessage("Slot duration must be between 15 and 240 minutes"),
  ],

  adminAddTemplateSlot: [
    body("startTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("endTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format")
      .custom((endTime, { req }) => {
        const startTime = req.body.startTime;

        if (startTime && endTime) {
          const start = new Date(`2000-01-01 ${startTime}`);
          const end = new Date(`2000-01-01 ${endTime}`);

          if (end <= start) {
            throw new Error("End time must be after start time");
          }

          // Check minimum duration (15 minutes)
          const diffMinutes = (end - start) / (1000 * 60);
          if (diffMinutes < 15) {
            throw new Error("Time slot must be at least 15 minutes long");
          }

          // Check maximum duration (4 hours)
          if (diffMinutes > 240) {
            throw new Error("Time slot cannot exceed 4 hours");
          }
        }
        return true;
      }),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Slot active status must be true or false"),

    body("maxBookings")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Max bookings must be between 1 and 10"),
  ],

  adminRemoveTemplateSlot: [
    param("slotId").isMongoId().withMessage("Please provide a valid slot ID"),
  ],

  // Holiday management validation
  adminCreateHoliday: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Holiday name must be between 2 and 100 characters"),

    body("date")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid holiday date"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Holiday description cannot exceed 500 characters"),

    body("isRecurring")
      .optional()
      .isBoolean()
      .withMessage("Recurring status must be true or false"),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Active status must be true or false"),
  ],

  adminUpdateHoliday: [
    param("id").isMongoId().withMessage("Please provide a valid holiday ID"),

    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Holiday name must be between 2 and 100 characters"),

    body("date")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid holiday date"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Holiday description cannot exceed 500 characters"),

    body("isRecurring")
      .optional()
      .isBoolean()
      .withMessage("Recurring status must be true or false"),

    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("Active status must be true or false"),
  ],

  adminBulkCreateHolidays: [
    body("holidays")
      .isArray({ min: 1, max: 100 })
      .withMessage("Please provide between 1 and 100 holidays"),

    body("holidays.*.name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Holiday name must be between 2 and 100 characters"),

    body("holidays.*.date")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid holiday date"),

    body("holidays.*.description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Holiday description cannot exceed 500 characters"),

    body("holidays.*.isRecurring")
      .optional()
      .isBoolean()
      .withMessage("Recurring status must be true or false"),
  ],

  adminBulkUpdateHolidays: [
    body("updates")
      .isArray({ min: 1, max: 50 })
      .withMessage("Please provide between 1 and 50 holiday updates"),

    body("updates.*.id")
      .isMongoId()
      .withMessage("Please provide a valid holiday ID"),

    body("updates.*.data")
      .isObject()
      .withMessage("Update data must be an object"),

    body("updates.*.data.name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Holiday name must be between 2 and 100 characters"),

    body("updates.*.data.date")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid holiday date"),

    body("updates.*.data.description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Holiday description cannot exceed 500 characters"),

    body("updates.*.data.isRecurring")
      .optional()
      .isBoolean()
      .withMessage("Recurring status must be true or false"),

    body("updates.*.data.isActive")
      .optional()
      .isBoolean()
      .withMessage("Active status must be true or false"),
  ],

  adminBulkDeleteHolidays: [
    body("holidayIds")
      .isArray({ min: 1, max: 50 })
      .withMessage("Please provide between 1 and 50 holiday IDs"),

    body("holidayIds.*")
      .isMongoId()
      .withMessage("Please provide valid holiday IDs"),
  ],

  // Settings management validation
  adminUpdateEmailTemplates: [
    body("templates").isObject().withMessage("Templates must be an object"),

    body("templates.*.subject")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Template subject must be between 5 and 200 characters"),

    body("templates.*.htmlContent")
      .trim()
      .isLength({ min: 50, max: 10000 })
      .withMessage("HTML content must be between 50 and 10000 characters"),

    body("templates.*.textContent")
      .trim()
      .isLength({ min: 50, max: 5000 })
      .withMessage("Text content must be between 50 and 5000 characters"),

    body("templates.*.variables")
      .optional()
      .isArray()
      .withMessage("Template variables must be an array"),

    body("templates.*.isActive")
      .optional()
      .isBoolean()
      .withMessage("Template active status must be true or false"),
  ],

  adminUpdateBusinessRules: [
    body("rules").isObject().withMessage("Rules must be an object"),

    body("rules.*.name")
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage("Rule name must be between 3 and 100 characters"),

    body("rules.*.value").exists().withMessage("Rule value is required"),

    body("rules.*.description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Rule description cannot exceed 500 characters"),

    body("rules.*.category")
      .isIn(["booking", "cancellation", "payment", "notification", "general"])
      .withMessage(
        "Rule category must be one of: booking, cancellation, payment, notification, general"
      ),

    body("rules.*.isActive")
      .optional()
      .isBoolean()
      .withMessage("Rule active status must be true or false"),
  ],

  adminUpdateTimeSlotDefaults: [
    body("timeSlots")
      .isArray({ min: 1 })
      .withMessage("At least one time slot configuration is required"),

    body("timeSlots.*.dayOfWeek")
      .isInt({ min: 0, max: 6 })
      .withMessage("Day of week must be between 0 (Sunday) and 6 (Saturday)"),

    body("timeSlots.*.startTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("timeSlots.*.endTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format")
      .custom((endTime, { req, path }) => {
        const index = path.split("[")[1].split("]")[0];
        const startTime = req.body.timeSlots[index]?.startTime;

        if (startTime && endTime) {
          const start = new Date(`2000-01-01 ${startTime}`);
          const end = new Date(`2000-01-01 ${endTime}`);

          if (end <= start) {
            throw new Error("End time must be after start time");
          }
        }
        return true;
      }),

    body("timeSlots.*.slotDuration")
      .optional()
      .isInt({ min: 15, max: 240 })
      .withMessage("Slot duration must be between 15 and 240 minutes"),

    body("timeSlots.*.maxBookingsPerSlot")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Max bookings per slot must be between 1 and 10"),

    body("timeSlots.*.breakTimes")
      .optional()
      .isArray()
      .withMessage("Break times must be an array"),

    body("timeSlots.*.isActive")
      .optional()
      .isBoolean()
      .withMessage("Time slot active status must be true or false"),
  ],

  // Analytics and reporting validation
  adminAnalyticsDateRange: [
    query("startDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid start date"),

    query("endDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid end date")
      .custom((endDate, { req }) => {
        const startDate = req.query.startDate;
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),

    query("groupBy")
      .optional()
      .isIn(["day", "week", "month", "year"])
      .withMessage("Group by must be one of: day, week, month, year"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage("Limit must be between 1 and 1000"),
  ],

  adminGenerateReport: [
    body("reportType")
      .isIn(["appointments", "revenue", "patients", "sessions", "custom"])
      .withMessage(
        "Report type must be one of: appointments, revenue, patients, sessions, custom"
      ),

    body("startDate")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid start date"),

    body("endDate")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid end date")
      .custom((endDate, { req }) => {
        const startDate = new Date(req.body.startDate);
        const endDateObj = new Date(endDate);

        if (endDateObj < startDate) {
          throw new Error("End date must be after start date");
        }

        // Limit report range to 1 year
        const maxDate = new Date(startDate);
        maxDate.setFullYear(maxDate.getFullYear() + 1);

        if (endDateObj > maxDate) {
          throw new Error("Report date range cannot exceed 1 year");
        }

        return true;
      }),

    body("format")
      .isIn(["pdf", "excel", "csv"])
      .withMessage("Report format must be one of: pdf, excel, csv"),

    body("includeCharts")
      .optional()
      .isBoolean()
      .withMessage("Include charts preference must be true or false"),

    body("filters")
      .optional()
      .isObject()
      .withMessage("Filters must be an object"),
  ],

  // Audit log validation
  adminAuditLogFilters: [
    query("startDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid start date"),

    query("endDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid end date"),

    query("adminId")
      .optional()
      .isMongoId()
      .withMessage("Please provide a valid admin ID"),

    query("action")
      .optional()
      .isIn(["create", "update", "delete", "view", "cancel", "reschedule"])
      .withMessage(
        "Action must be one of: create, update, delete, view, cancel, reschedule"
      ),

    query("resource")
      .optional()
      .isIn(["user", "appointment", "availability", "subscription", "settings"])
      .withMessage(
        "Resource must be one of: user, appointment, availability, subscription, settings"
      ),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],

  // Custom Date validation
  adminCreateCustomDate: [
    body("date")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid date"),

    body("reason")
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage("Reason must be between 1 and 200 characters"),

    body("isHoliday")
      .optional()
      .isBoolean()
      .withMessage("isHoliday must be a boolean"),

    body("customSlots")
      .optional()
      .isArray()
      .withMessage("Custom slots must be an array"),

    body("customSlots.*.startTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("customSlots.*.endTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format"),

    body("customSlots.*.maxBookings")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Max bookings must be between 1 and 10"),
  ],

  adminUpdateCustomDate: [
    param("id")
      .isMongoId()
      .withMessage("Please provide a valid custom date ID"),

    body("date")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid date"),

    body("reason")
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage("Reason must be between 1 and 200 characters"),

    body("isHoliday")
      .optional()
      .isBoolean()
      .withMessage("isHoliday must be a boolean"),

    body("customSlots")
      .optional()
      .isArray()
      .withMessage("Custom slots must be an array"),

    body("customSlots.*.startTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("customSlots.*.endTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format"),

    body("customSlots.*.maxBookings")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Max bookings must be between 1 and 10"),
  ],

  adminBulkCreateCustomDates: [
    body("customDates")
      .isArray({ min: 1 })
      .withMessage("At least one custom date is required"),

    body("customDates.*.date")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid date for each custom date"),

    body("customDates.*.reason")
      .optional()
      .isString()
      .isLength({ min: 1, max: 200 })
      .withMessage("Reason must be between 1 and 200 characters"),

    body("customDates.*.isHoliday")
      .optional()
      .isBoolean()
      .withMessage("isHoliday must be a boolean"),
  ],

  adminBulkUpdateCustomDates: [
    body("updates")
      .isArray({ min: 1 })
      .withMessage("At least one update is required"),

    body("updates.*.id")
      .isMongoId()
      .withMessage("Please provide a valid custom date ID for each update"),
  ],

  adminBulkDeleteCustomDates: [
    body("customDateIds")
      .isArray({ min: 1 })
      .withMessage("At least one custom date ID is required"),

    body("customDateIds.*")
      .isMongoId()
      .withMessage("Each custom date ID must be valid"),
  ],

  adminUpdateNotificationEmail: [
    body("notificationEmail")
      .optional()
      .custom((value) => {
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            throw new Error("Please provide a valid email address");
          }
        }
        return true;
      })
      .withMessage("Please provide a valid email address"),
  ],
};

/**
 * Middleware factory to apply admin validation rules
 */
export const validateAdminRequest = (ruleName) => {
  const rules = adminValidationRules[ruleName];

  if (!rules) {
    throw new Error(`Admin validation rules for '${ruleName}' not found`);
  }

  return [...rules, handleAdminValidationErrors];
};

/**
 * Custom admin validation helpers
 */
export const adminValidationHelpers = {
  // Check if user exists and is active
  validateUserExists: async (userId) => {
    const { User } = await import("../models/index.js");
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.status === "deleted") {
      throw new Error("User account is deleted");
    }

    return user;
  },

  // Check if appointment exists and can be modified
  validateAppointmentModifiable: async (appointmentId) => {
    const { Appointment } = await import("../models/index.js");
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.status === "completed") {
      throw new Error("Cannot modify completed appointment");
    }

    return appointment;
  },

  // Check if time slot is available
  validateTimeSlotAvailable: async (
    date,
    timeSlot,
    excludeAppointmentId = null
  ) => {
    const { Appointment } = await import("../models/index.js");

    const query = {
      date: new Date(date),
      timeSlot,
      status: { $in: ["confirmed", "pending"] },
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointment = await Appointment.findOne(query);

    if (existingAppointment) {
      throw new Error("Time slot is not available");
    }

    return true;
  },

  // Validate business hours
  validateBusinessHours: (timeSlot) => {
    const [startTime, endTime] = timeSlot.split("-");
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);

    // Business hours: 9 AM to 6 PM
    const businessStart = new Date("2000-01-01 09:00");
    const businessEnd = new Date("2000-01-01 18:00");

    if (start < businessStart || end > businessEnd) {
      throw new Error("Time slot must be within business hours (9 AM - 6 PM)");
    }

    return true;
  },

  // Validate subscription modification
  validateSubscriptionModification: async (userId, modification) => {
    const { User } = await import("../models/index.js");
    const user = await User.findById(userId).populate("subscription.plan");

    if (!user || !user.subscription) {
      throw new Error("User subscription not found");
    }

    if (user.subscription.status === "cancelled") {
      throw new Error("Cannot modify cancelled subscription");
    }

    return user;
  },
};

export default {
  adminValidationRules,
  validateAdminRequest,
  adminValidationHelpers,
  handleAdminValidationErrors,
};
