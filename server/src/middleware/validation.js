import { body, validationResult } from "express-validator";

/**
 * Validation Middleware
 * Handles request validation using express-validator
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
  }

  next();
};

/**
 * Validation rules for different endpoints
 */
const validationRules = {
  register: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("phone")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),

    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("planId").isMongoId().withMessage("Please provide a valid plan ID"),

    body("address")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Address cannot exceed 500 characters"),

    body("gender")
      .optional()
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
  ],

  verifyPhone: [
    body("phone")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),

    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be a 6-digit number"),
  ],

  login: [
    body("phone")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),

    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],

  adminLogin: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],

  loginOTP: [
    // Allow either phone or email
    body("phone")
      .optional({ nullable: true })
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),
    body("email")
      .optional({ nullable: true })
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body().custom((value, { req }) => {
      if (!req.body.phone && !req.body.email) {
        throw new Error("Either phone or email is required");
      }
      return true;
    }),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be a 6-digit number"),
  ],

  sendOTP: [
    // Allow either phone or email
    body("phone")
      .optional({ nullable: true })
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),
    body("email")
      .optional({ nullable: true })
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body().custom((value, { req }) => {
      if (!req.body.phone && !req.body.email) {
        throw new Error("Either phone or email is required");
      }
      return true;
    }),
  ],

  setPassword: [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],

  resetPassword: [
    body("phone")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),

    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be a 6-digit number"),

    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],

  // User profile validation
  updateProfile: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

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
  ],

  // Medical information validation
  updateMedicalInfo: [
    body("systemicDiseases")
      .optional()
      .isArray()
      .withMessage("Systemic diseases must be an array"),

    body("systemicDiseases.*")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Each systemic disease entry cannot exceed 200 characters"),

    body("drugAllergies")
      .optional()
      .isArray()
      .withMessage("Drug allergies must be an array"),

    body("drugAllergies.*")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Each drug allergy entry cannot exceed 200 characters"),

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
      .isLength({ max: 200 })
      .withMessage("Each past treatment entry cannot exceed 200 characters"),

    body("previousExperiences")
      .optional()
      .isArray()
      .withMessage("Previous experiences must be an array"),

    body("previousExperiences.*")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage(
        "Each previous experience entry cannot exceed 200 characters"
      ),
  ],

  // Appointment validation
  createAppointment: [
    body("date")
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid date")
      .custom((value) => {
        if (value <= new Date()) {
          throw new Error("Appointment date must be in the future");
        }
        return true;
      }),

    body("timeSlot")
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      )
      .withMessage("Time slot must be in format HH:MM-HH:MM"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes cannot exceed 1000 characters"),
  ],

  // Payment validation
  createPayment: [
    body("planId")
      .notEmpty()
      .withMessage("Plan ID is required")
      .isMongoId()
      .withMessage("Please provide a valid plan ID")
      .custom(async (value) => {
        // Import Plan model dynamically to avoid circular dependency
        const { Plan } = await import("../models/index.js");
        const plan = await Plan.findById(value);
        if (!plan) {
          throw new Error("Plan not found");
        }
        if (!plan.isActive) {
          throw new Error("Selected plan is not available");
        }
        return true;
      }),
  ],

  // Plan creation validation
  createPlan: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Plan name must be between 2 and 100 characters"),

    body("sessions")
      .isInt({ min: 1, max: 50 })
      .withMessage("Sessions must be between 1 and 50"),

    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),

    body("duration")
      .isInt({ min: 1, max: 24 })
      .withMessage("Duration must be between 1 and 24 months"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters"),

    body("features")
      .optional()
      .isArray()
      .withMessage("Features must be an array"),

    body("features.*")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Each feature cannot exceed 200 characters"),
  ],

  // Session validation
  createSession: [
    body("appointmentId")
      .isMongoId()
      .withMessage("Please provide a valid appointment ID"),

    body("examination")
      .optional()
      .isObject()
      .withMessage("Examination must be an object"),

    body("examination.teethPresent")
      .optional()
      .isInt({ min: 0, max: 32 })
      .withMessage("Teeth present must be between 0 and 32"),

    body("examination.missingTeeth")
      .optional()
      .isArray()
      .withMessage("Missing teeth must be an array"),

    body("examination.missingTeeth.*")
      .optional()
      .isInt({ min: 1, max: 32 })
      .withMessage("Each missing tooth number must be between 1 and 32"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Notes cannot exceed 2000 characters"),
  ],

  updateSession: [
    body("examination")
      .optional()
      .isObject()
      .withMessage("Examination must be an object"),

    body("examination.teethPresent")
      .optional()
      .isInt({ min: 0, max: 32 })
      .withMessage("Teeth present must be between 0 and 32"),

    body("examination.missingTeeth")
      .optional()
      .isArray()
      .withMessage("Missing teeth must be an array"),

    body("examination.missingTeeth.*")
      .optional()
      .isInt({ min: 1, max: 32 })
      .withMessage("Each missing tooth number must be between 1 and 32"),

    body("notes")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Notes cannot exceed 2000 characters"),
  ],

  addCustomField: [
    body("fieldName")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Field name must be between 1 and 100 characters"),

    body("fieldValue")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Field value must be between 1 and 1000 characters"),
  ],

  // Subscription update validation
  updateSubscription: [
    body("planId")
      .optional()
      .isMongoId()
      .withMessage("Please provide a valid plan ID"),

    body("startDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid start date"),

    body("endDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("Please provide a valid end date"),

    body("sessionsRemaining")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Sessions remaining must be a non-negative integer"),

    body("status")
      .optional()
      .isIn(["active", "expired", "suspended"])
      .withMessage("Status must be active, expired, or suspended"),
  ],

  // Admin user personal info update validation
  adminUpdatePersonalInfo: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("phone")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Please provide a valid Indian phone number"),

    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

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
  ],

  // Admin user medical info update validation
  adminUpdateMedicalInfo: [
    body("systemicDiseases")
      .optional()
      .isArray()
      .withMessage("Systemic diseases must be an array"),

    body("systemicDiseases.*")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Each systemic disease entry cannot exceed 200 characters"),

    body("drugAllergies")
      .optional()
      .isArray()
      .withMessage("Drug allergies must be an array"),

    body("drugAllergies.*")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Each drug allergy entry cannot exceed 200 characters"),

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
      .isLength({ max: 200 })
      .withMessage("Each past treatment entry cannot exceed 200 characters"),

    body("previousExperiences")
      .optional()
      .isArray()
      .withMessage("Previous experiences must be an array"),

    body("previousExperiences.*")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage(
        "Each previous experience entry cannot exceed 200 characters"
      ),
  ],

  // Payment validation
  createOrder: [
    body("planId")
      .notEmpty()
      .withMessage("Plan ID is required")
      .isMongoId()
      .withMessage("Please provide a valid plan ID"),
  ],

  verifyPayment: [
    body("razorpayOrderId")
      .notEmpty()
      .withMessage("Razorpay Order ID is required"),
    body("razorpayPaymentId")
      .notEmpty()
      .withMessage("Razorpay Payment ID is required"),
    body("razorpaySignature")
      .notEmpty()
      .withMessage("Razorpay Signature is required"),
    body("paymentMethod")
      .notEmpty()
      .withMessage("Payment method is required")
      .isIn(["card", "netbanking", "upi", "wallet"])
      .withMessage("Invalid payment method"),
  ],

  // Admin subscription management validation
  adminExtendSubscription: [
    body("months")
      .isInt({ min: 1, max: 24 })
      .withMessage("Extension months must be between 1 and 24"),

    body("reason")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Reason cannot exceed 500 characters"),
  ],

  adminChangeSubscriptionPlan: [
    body("newPlanId")
      .notEmpty()
      .withMessage("New plan ID is required")
      .isMongoId()
      .withMessage("Please provide a valid plan ID"),

    body("reason")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Reason cannot exceed 500 characters"),

    body("adjustSessions")
      .optional()
      .isBoolean()
      .withMessage("Adjust sessions must be true or false"),
  ],

  adminCancelSubscription: [
    body("reason")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Reason cannot exceed 500 characters"),

    body("immediate")
      .optional()
      .isBoolean()
      .withMessage("Immediate cancellation must be true or false"),
  ],

  // Admin settings management validation
  adminUpdateEmailTemplates: [
    body("templates").isObject().withMessage("Templates must be an object"),

    body("templates.*.subject")
      .notEmpty()
      .withMessage("Template subject is required")
      .isLength({ max: 200 })
      .withMessage("Template subject cannot exceed 200 characters"),

    body("templates.*.htmlContent")
      .notEmpty()
      .withMessage("Template HTML content is required")
      .isLength({ max: 10000 })
      .withMessage("Template HTML content cannot exceed 10000 characters"),

    body("templates.*.textContent")
      .notEmpty()
      .withMessage("Template text content is required")
      .isLength({ max: 5000 })
      .withMessage("Template text content cannot exceed 5000 characters"),

    body("templates.*.variables")
      .optional()
      .isArray()
      .withMessage("Template variables must be an array"),

    body("templates.*.variables.*.name")
      .optional()
      .notEmpty()
      .withMessage("Variable name is required"),

    body("templates.*.variables.*.description")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Variable description cannot exceed 200 characters"),

    body("templates.*.variables.*.required")
      .optional()
      .isBoolean()
      .withMessage("Variable required field must be true or false"),
  ],

  adminUpdateBusinessRules: [
    body("rules").isObject().withMessage("Rules must be an object"),

    body("rules.*.name")
      .notEmpty()
      .withMessage("Rule name is required")
      .isLength({ max: 100 })
      .withMessage("Rule name cannot exceed 100 characters"),

    body("rules.*.value").exists().withMessage("Rule value is required"),

    body("rules.*.description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Rule description cannot exceed 500 characters"),

    body("rules.*.category")
      .isIn(["booking", "cancellation", "payment", "notification", "general"])
      .withMessage(
        "Rule category must be one of: booking, cancellation, payment, notification, general"
      ),
  ],

  adminUpdateTimeSlots: [
    body("timeSlots")
      .isArray()
      .withMessage("Time slots must be an array")
      .notEmpty()
      .withMessage("At least one time slot is required"),

    body("timeSlots.*.dayOfWeek")
      .isInt({ min: 0, max: 6 })
      .withMessage("Day of week must be between 0 (Sunday) and 6 (Saturday)"),

    body("timeSlots.*.startTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Start time must be in HH:MM format"),

    body("timeSlots.*.endTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("End time must be in HH:MM format"),

    body("timeSlots.*.breakTimes")
      .optional()
      .isArray()
      .withMessage("Break times must be an array"),

    body("timeSlots.*.breakTimes.*.startTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Break start time must be in HH:MM format"),

    body("timeSlots.*.breakTimes.*.endTime")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Break end time must be in HH:MM format"),

    body("timeSlots.*.breakTimes.*.description")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Break description cannot exceed 200 characters"),

    body("timeSlots.*.slotDuration")
      .optional()
      .isInt({ min: 15, max: 240 })
      .withMessage("Slot duration must be between 15 and 240 minutes"),

    body("timeSlots.*.maxBookingsPerSlot")
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage("Max bookings per slot must be between 1 and 10"),

    body("timeSlots.*.isActive")
      .optional()
      .isBoolean()
      .withMessage("Is active must be true or false"),
  ],

  adminResetSettings: [
    body("confirm")
      .equals("true")
      .withMessage("Confirmation is required to reset settings"),

    body("category")
      .optional()
      .isIn(["email-templates", "business-rules", "time-slots", "general"])
      .withMessage(
        "Category must be one of: email-templates, business-rules, time-slots, general"
      ),
  ],
};

/**
 * Middleware factory to apply validation rules
 */
export const validateRequest = (ruleName) => {
  const rules = validationRules[ruleName];

  if (!rules) {
    throw new Error(`Validation rules for '${ruleName}' not found`);
  }

  return [...rules, handleValidationErrors];
};

/**
 * Custom validation helpers
 */
export const customValidators = {
  isValidObjectId: (value) => {
    return /^[0-9a-fA-F]{24}$/.test(value);
  },

  isValidPhoneNumber: (value) => {
    return /^[6-9]\d{9}$/.test(value);
  },

  isValidTimeSlot: (value) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(
      value
    );
  },

  isFutureDate: (value) => {
    return new Date(value) > new Date();
  },
};
